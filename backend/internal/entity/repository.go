package entity

import (
	"context"
	"database/sql"
	"errors"
	"strings"
)

var ErrNotFound = errors.New("entity not found")

type Repository struct{ db *sql.DB }

func NewRepository(db *sql.DB) *Repository { return &Repository{db: db} }

func (r *Repository) Create(ctx context.Context, input Input) (Entity, error) {
	id, err := newID()
	if err != nil {
		return Entity{}, err
	}
	stamp := now()
	item := Entity{
		ID: id, Code: input.Code, Name: input.Name, Category: input.Category,
		Status: input.Status, Latitude: *input.Latitude, Longitude: *input.Longitude,
		Description: input.Description, CreatedAt: stamp, UpdatedAt: stamp,
	}
	_, err = r.db.ExecContext(ctx, `INSERT INTO entities
		(id, code, name, category, status, latitude, longitude, description, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, item.ID, item.Code, item.Name, item.Category, item.Status,
		item.Latitude, item.Longitude, item.Description, item.CreatedAt, item.UpdatedAt)
	return item, err
}

func (r *Repository) List(ctx context.Context, q, category, status string) ([]Entity, error) {
	query := `SELECT id, code, name, category, status, latitude, longitude, description, created_at, updated_at
		FROM entities WHERE 1 = 1`
	args := make([]any, 0, 3)
	if q != "" {
		query += ` AND (code LIKE ? COLLATE NOCASE OR name LIKE ? COLLATE NOCASE)`
		args = append(args, "%"+q+"%", "%"+q+"%")
	}
	if category != "" {
		query += ` AND category = ?`
		args = append(args, category)
	}
	if status != "" {
		query += ` AND status = ?`
		args = append(args, status)
	}
	query += ` ORDER BY code COLLATE NOCASE, id`
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Entity, 0)
	for rows.Next() {
		var item Entity
		if err := rows.Scan(&item.ID, &item.Code, &item.Name, &item.Category, &item.Status,
			&item.Latitude, &item.Longitude, &item.Description, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) Get(ctx context.Context, id string) (Entity, error) {
	var item Entity
	err := r.db.QueryRowContext(ctx, `SELECT id, code, name, category, status, latitude, longitude,
		description, created_at, updated_at FROM entities WHERE id = ?`, id).Scan(
		&item.ID, &item.Code, &item.Name, &item.Category, &item.Status, &item.Latitude, &item.Longitude,
		&item.Description, &item.CreatedAt, &item.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return Entity{}, ErrNotFound
	}
	return item, err
}

func (r *Repository) Update(ctx context.Context, id string, input Input) (Entity, error) {
	result, err := r.db.ExecContext(ctx, `UPDATE entities SET code = ?, name = ?, category = ?, status = ?,
		latitude = ?, longitude = ?, description = ?, updated_at = ? WHERE id = ?`,
		input.Code, input.Name, input.Category, input.Status, *input.Latitude, *input.Longitude,
		input.Description, now(), id)
	if err != nil {
		return Entity{}, err
	}
	count, err := result.RowsAffected()
	if err != nil {
		return Entity{}, err
	}
	if count == 0 {
		return Entity{}, ErrNotFound
	}
	return r.Get(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM entities WHERE id = ?`, id)
	if err != nil {
		return err
	}
	count, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if count == 0 {
		return ErrNotFound
	}
	return nil
}

func IsDuplicateCode(err error) bool {
	return err != nil && strings.Contains(err.Error(), "UNIQUE constraint failed: entities.code")
}
