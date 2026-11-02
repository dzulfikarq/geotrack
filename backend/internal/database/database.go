package database

import (
	"database/sql"
	"embed"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

//go:embed schema.sql
var schema embed.FS

func Open(path string) (*sql.DB, error) {
	if path == "" {
		path = "./data/geotrack.db"
	}
	if path != ":memory:" && !strings.HasPrefix(path, "file:") {
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			return nil, fmt.Errorf("create database directory: %w", err)
		}
	}

	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}
	// ponytail: one connection serializes SQLite writes; increase only if read throughput matters.
	db.SetMaxOpenConns(1)
	err = initialize(db)
	if err != nil {
		db.Close()
		return nil, fmt.Errorf("initialize database: %w", err)
	}
	return db, nil
}

type defaultCategory struct {
	id, key, name, description, icon, color, markerStyle string
}

var defaultCategories = []defaultCategory{
	{"00000000-0000-4000-8000-000000000001", "vehicle", "Vehicle", "Vehicles and mobile assets.", "truck", "orange", "pin"},
	{"00000000-0000-4000-8000-000000000002", "iot_device", "IoT Device", "Connected sensors and devices.", "cpu", "teal", "circle"},
	{"00000000-0000-4000-8000-000000000003", "facility", "Facility", "Buildings and fixed locations.", "building-2", "violet", "rounded-square"},
}

func initialize(db *sql.DB) error {
	if _, err := db.Exec(`PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON`); err != nil {
		return err
	}
	ddl, err := schema.ReadFile("schema.sql")
	if err != nil {
		return err
	}
	if _, err = db.Exec(string(ddl)); err != nil {
		return err
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	hasCategoryID, err := hasColumn(tx, "entities", "category_id")
	if err != nil {
		return err
	}
	if err := ensureCategoryColumns(tx); err != nil {
		return err
	}
	stamp := time.Now().UTC().Format(time.RFC3339Nano)
	for _, item := range defaultCategories {
		if _, err := tx.Exec(`INSERT OR IGNORE INTO categories
			(id, legacy_key, name, description, icon, icon_key, color, marker_style, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, item.id, item.key, item.name, item.description,
			item.icon, item.icon, item.color, item.markerStyle, stamp, stamp); err != nil {
			return err
		}
	}
	if !hasCategoryID {
		if err := migrateEntityCategories(tx); err != nil {
			return err
		}
	}
	for _, version := range []int{2, 3} {
		if _, err := tx.Exec(`INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)`, version, stamp); err != nil {
			return err
		}
	}
	for _, index := range []string{
		`CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status)`,
		`CREATE INDEX IF NOT EXISTS idx_entities_category_id ON entities(category_id)`,
	} {
		if _, err := tx.Exec(index); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func ensureCategoryColumns(tx *sql.Tx) error {
	hasIconKey, err := hasColumn(tx, "categories", "icon_key")
	if err != nil {
		return err
	}
	if !hasIconKey {
		if _, err := tx.Exec(`ALTER TABLE categories ADD COLUMN icon_key TEXT NOT NULL DEFAULT 'truck'`); err != nil {
			return err
		}
		if hasLegacyIcon, err := hasColumn(tx, "categories", "icon"); err != nil {
			return err
		} else if hasLegacyIcon {
			if _, err := tx.Exec(`UPDATE categories SET icon_key = icon`); err != nil {
				return err
			}
		}
	}
	hasMarkerStyle, err := hasColumn(tx, "categories", "marker_style")
	if err != nil {
		return err
	}
	if !hasMarkerStyle {
		if _, err := tx.Exec(`ALTER TABLE categories ADD COLUMN marker_style TEXT NOT NULL DEFAULT 'pin'`); err != nil {
			return err
		}
		if _, err := tx.Exec(`UPDATE categories SET marker_style = CASE legacy_key
			WHEN 'iot_device' THEN 'circle' WHEN 'facility' THEN 'rounded-square' ELSE 'pin' END`); err != nil {
			return err
		}
	}
	return nil
}

func hasColumn(tx *sql.Tx, table, column string) (bool, error) {
	rows, err := tx.Query(`PRAGMA table_info(` + table + `)`)
	if err != nil {
		return false, err
	}
	defer rows.Close()
	for rows.Next() {
		var cid, notNull, primaryKey int
		var name, dataType string
		var defaultValue sql.NullString
		if err := rows.Scan(&cid, &name, &dataType, &notNull, &defaultValue, &primaryKey); err != nil {
			return false, err
		}
		if name == column {
			return true, nil
		}
	}
	return false, rows.Err()
}

func migrateEntityCategories(tx *sql.Tx) error {
	var before int
	if err := tx.QueryRow(`SELECT count(*) FROM entities`).Scan(&before); err != nil {
		return err
	}
	if _, err := tx.Exec(`DROP TABLE IF EXISTS entities_migrated;
		CREATE TABLE entities_migrated (
		id TEXT PRIMARY KEY,
		code TEXT NOT NULL COLLATE NOCASE UNIQUE,
		name TEXT NOT NULL,
		category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
		status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance')),
		latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
		longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
		description TEXT NOT NULL DEFAULT '',
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL
	)`); err != nil {
		return err
	}
	if _, err := tx.Exec(`INSERT INTO entities_migrated
		(id, code, name, category_id, status, latitude, longitude, description, created_at, updated_at)
		SELECT e.id, e.code, e.name, c.id, e.status, e.latitude, e.longitude, e.description, e.created_at, e.updated_at
		FROM entities e JOIN categories c ON c.legacy_key = e.category`); err != nil {
		return err
	}
	var copied int
	if err := tx.QueryRow(`SELECT count(*) FROM entities_migrated`).Scan(&copied); err != nil {
		return err
	}
	if copied != before {
		return fmt.Errorf("category migration copied %d of %d entities", copied, before)
	}
	if _, err := tx.Exec(`DROP TABLE entities; ALTER TABLE entities_migrated RENAME TO entities`); err != nil {
		return err
	}
	return nil
}
