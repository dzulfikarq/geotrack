package entity

import (
	"context"
	"database/sql"
	"errors"
	"strings"
)

var ErrNotFound = errors.New("entity not found")
var ErrCategoryNotFound = errors.New("category not found")

type Repository struct{ db *sql.DB }

func NewRepository(db *sql.DB) *Repository { return &Repository{db: db} }

func (r *Repository) Create(ctx context.Context, input Input) (Entity, error) {
	categoryID, err := r.resolveCategory(ctx, input)
	if err != nil {
		return Entity{}, err
	}
	id, err := newID()
	if err != nil {
		return Entity{}, err
	}
	stamp := now()
	item := Entity{
		ID: id, Code: input.Code, Name: input.Name, CategoryID: categoryID,
		Status: input.Status, Latitude: *input.Latitude, Longitude: *input.Longitude,
		Description: input.Description, CreatedAt: stamp, UpdatedAt: stamp,
	}
	_, err = r.db.ExecContext(ctx, `INSERT INTO entities
		(id, code, name, category_id, status, latitude, longitude, description, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, item.ID, item.Code, item.Name, item.CategoryID, item.Status,
		item.Latitude, item.Longitude, item.Description, item.CreatedAt, item.UpdatedAt)
	if err != nil {
		return Entity{}, err
	}
	return r.Get(ctx, item.ID)
}

func (r *Repository) List(ctx context.Context, q, categoryID, legacyCategory, status string) ([]Entity, error) {
	query := `SELECT e.id, e.code, e.name, c.legacy_key, e.category_id, c.name, c.icon_key, c.color, c.marker_style,
		e.status, e.latitude, e.longitude, e.description, e.created_at, e.updated_at
		FROM entities e JOIN categories c ON c.id = e.category_id WHERE 1 = 1`
	args := make([]any, 0, 3)
	if q != "" {
		query += ` AND (e.code LIKE ? COLLATE NOCASE OR e.name LIKE ? COLLATE NOCASE)`
		args = append(args, "%"+q+"%", "%"+q+"%")
	}
	if categoryID != "" {
		query += ` AND e.category_id = ?`
		args = append(args, categoryID)
	} else if legacyCategory != "" {
		query += ` AND c.legacy_key = ? COLLATE NOCASE`
		args = append(args, legacyCategory)
	}
	if status != "" {
		query += ` AND e.status = ?`
		args = append(args, status)
	}
	query += ` ORDER BY e.code COLLATE NOCASE, e.id`
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Entity, 0)
	for rows.Next() {
		var item Entity
		if err := scanEntity(rows, &item); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) Get(ctx context.Context, id string) (Entity, error) {
	var item Entity
	err := scanEntity(r.db.QueryRowContext(ctx, `SELECT e.id, e.code, e.name, c.legacy_key, e.category_id, c.name, c.icon_key, c.color, c.marker_style,
		e.status, e.latitude, e.longitude, e.description, e.created_at, e.updated_at
		FROM entities e JOIN categories c ON c.id = e.category_id WHERE e.id = ?`, id), &item)
	if errors.Is(err, sql.ErrNoRows) {
		return Entity{}, ErrNotFound
	}
	return item, err
}

func (r *Repository) Update(ctx context.Context, id string, input Input) (Entity, error) {
	categoryID, err := r.resolveCategory(ctx, input)
	if err != nil {
		return Entity{}, err
	}
	result, err := r.db.ExecContext(ctx, `UPDATE entities SET code = ?, name = ?, category_id = ?, status = ?,
		latitude = ?, longitude = ?, description = ?, updated_at = ? WHERE id = ?`,
		input.Code, input.Name, categoryID, input.Status, *input.Latitude, *input.Longitude,
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

func (r *Repository) CategoryExists(ctx context.Context, categoryID, legacyKey string) (bool, error) {
	var exists int
	var err error
	if categoryID != "" {
		err = r.db.QueryRowContext(ctx, `SELECT 1 FROM categories WHERE id = ?`, categoryID).Scan(&exists)
	} else {
		err = r.db.QueryRowContext(ctx, `SELECT 1 FROM categories WHERE legacy_key = ? COLLATE NOCASE`, legacyKey).Scan(&exists)
	}
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	return err == nil, err
}

func (r *Repository) resolveCategory(ctx context.Context, input Input) (string, error) {
	var id string
	var err error
	if input.CategoryID != "" {
		err = r.db.QueryRowContext(ctx, `SELECT id FROM categories WHERE id = ?`, input.CategoryID).Scan(&id)
	} else {
		err = r.db.QueryRowContext(ctx, `SELECT id FROM categories WHERE legacy_key = ? COLLATE NOCASE`, input.Category).Scan(&id)
	}
	if errors.Is(err, sql.ErrNoRows) {
		return "", ErrCategoryNotFound
	}
	return id, err
}

func scanEntity(row interface{ Scan(...any) error }, item *Entity) error {
	return row.Scan(&item.ID, &item.Code, &item.Name, &item.Category, &item.CategoryID, &item.CategoryName,
		&item.CategoryIconKey, &item.CategoryColor, &item.CategoryMarkerStyle, &item.Status, &item.Latitude, &item.Longitude,
		&item.Description, &item.CreatedAt, &item.UpdatedAt)
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
