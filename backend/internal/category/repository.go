package category

import (
	"context"
	"database/sql"
	"errors"
	"strings"
)

type Repository struct{ db *sql.DB }

func NewRepository(db *sql.DB) *Repository { return &Repository{db: db} }

type scanner interface{ Scan(...any) error }

const columns = `c.id, c.legacy_key, c.name, c.description, c.icon_key, c.color, c.marker_style,
	c.created_at, c.updated_at, (SELECT count(*) FROM entities e WHERE e.category_id = c.id)`

func scanCategory(row scanner) (Category, error) {
	var item Category
	err := row.Scan(&item.ID, &item.LegacyKey, &item.Name, &item.Description, &item.IconKey, &item.Color, &item.MarkerStyle,
		&item.CreatedAt, &item.UpdatedAt, &item.EntityCount)
	item.BuiltIn = isBuiltIn(item.LegacyKey)
	return item, err
}

func (r *Repository) List(ctx context.Context) ([]Category, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT c.id, c.legacy_key, c.name, c.description, c.icon_key, c.color, c.marker_style,
		c.created_at, c.updated_at, count(e.id) FROM categories c
		LEFT JOIN entities e ON e.category_id = c.id
		GROUP BY c.id ORDER BY c.name COLLATE NOCASE, c.id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Category, 0)
	for rows.Next() {
		item, err := scanCategory(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) Create(ctx context.Context, input Input) (Category, error) {
	id, err := newID()
	if err != nil {
		return Category{}, err
	}
	stamp := now()
	_, err = r.db.ExecContext(ctx, `INSERT INTO categories
		(id, legacy_key, name, description, icon, icon_key, color, marker_style, created_at, updated_at)
		VALUES (?, ?, ?, ?, 'truck', ?, ?, ?, ?, ?)`, id, id, input.Name, input.Description, input.IconKey,
		input.Color, input.MarkerStyle, stamp, stamp)
	if isDuplicateName(err) {
		return Category{}, ErrDuplicateName
	}
	if err != nil {
		return Category{}, err
	}
	return r.Get(ctx, id)
}

func (r *Repository) Get(ctx context.Context, id string) (Category, error) {
	item, err := scanCategory(r.db.QueryRowContext(ctx, `SELECT `+columns+` FROM categories c WHERE c.id = ?`, id))
	if errors.Is(err, sql.ErrNoRows) {
		return Category{}, ErrNotFound
	}
	return item, err
}

func (r *Repository) Update(ctx context.Context, id string, input Input) (Category, error) {
	result, err := r.db.ExecContext(ctx, `UPDATE categories SET name = ?, description = ?, icon = 'truck', icon_key = ?,
		color = ?, marker_style = ?, updated_at = ? WHERE id = ?`,
		input.Name, input.Description, input.IconKey, input.Color, input.MarkerStyle, now(), id)
	if isDuplicateName(err) {
		return Category{}, ErrDuplicateName
	}
	if err != nil {
		return Category{}, err
	}
	count, err := result.RowsAffected()
	if err != nil {
		return Category{}, err
	}
	if count == 0 {
		return Category{}, ErrNotFound
	}
	return r.Get(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM categories WHERE id = ? AND legacy_key NOT IN ('vehicle', 'iot_device', 'facility')`, id)
	if err != nil {
		if strings.Contains(err.Error(), "FOREIGN KEY constraint failed") {
			return ErrInUse
		}
		return err
	}
	count, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if count == 0 {
		var key string
		if err := r.db.QueryRowContext(ctx, `SELECT legacy_key FROM categories WHERE id = ?`, id).Scan(&key); errors.Is(err, sql.ErrNoRows) {
			return ErrNotFound
		} else if err != nil {
			return err
		}
		if isBuiltIn(key) {
			return ErrBuiltIn
		}
		return ErrNotFound
	}
	return nil
}

func isDuplicateName(err error) bool {
	return err != nil && strings.Contains(err.Error(), "UNIQUE constraint failed: categories.name")
}
