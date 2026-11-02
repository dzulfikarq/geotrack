package database

import (
	"database/sql"
	"path/filepath"
	"testing"
)

func TestOpenMigratesLegacyEntitiesWithoutDataLoss(t *testing.T) {
	path := filepath.Join(t.TempDir(), "legacy.db")
	legacy, err := sql.Open("sqlite", path)
	if err != nil {
		t.Fatal(err)
	}
	_, err = legacy.Exec(`CREATE TABLE entities (
		id TEXT PRIMARY KEY,
		code TEXT NOT NULL COLLATE NOCASE UNIQUE,
		name TEXT NOT NULL,
		category TEXT NOT NULL CHECK (category IN ('vehicle', 'iot_device', 'facility')),
		status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance')),
		latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
		longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
		description TEXT NOT NULL DEFAULT '',
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL
	);
	CREATE INDEX idx_entities_category ON entities(category);
	CREATE INDEX idx_entities_status ON entities(status);
	INSERT INTO entities VALUES
		('entity-1', 'VEH-001', 'North truck', 'vehicle', 'active', 0, 0, 'legacy data', 'created', 'updated'),
		('entity-2', 'IOT-001', 'Sensor', 'iot_device', 'maintenance', -6.2, 106.8, '', 'created', 'updated'),
		('entity-3', 'FAC-001', 'Depot', 'facility', 'inactive', 1, 2, '', 'created', 'updated');`)
	if err != nil {
		t.Fatal(err)
	}
	if err := legacy.Close(); err != nil {
		t.Fatal(err)
	}

	db, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	var count int
	if err := db.QueryRow(`SELECT count(*) FROM entities`).Scan(&count); err != nil || count != 3 {
		t.Fatalf("entity count = %d, err = %v", count, err)
	}
	var key, name, description string
	if err := db.QueryRow(`SELECT c.legacy_key, c.name, e.description FROM entities e JOIN categories c ON c.id = e.category_id WHERE e.id = 'entity-1'`).Scan(&key, &name, &description); err != nil {
		t.Fatal(err)
	}
	if key != "vehicle" || name != "Vehicle" || description != "legacy data" {
		t.Fatalf("migrated relation/data = %q, %q, %q", key, name, description)
	}
	for _, categoryKey := range []string{"vehicle", "iot_device", "facility"} {
		var matched int
		if err := db.QueryRow(`SELECT count(*) FROM entities e JOIN categories c ON c.id = e.category_id WHERE c.legacy_key = ?`, categoryKey).Scan(&matched); err != nil || matched != 1 {
			t.Fatalf("migrated %s entity count = %d, err = %v", categoryKey, matched, err)
		}
	}
	for _, index := range []string{"idx_entities_status", "idx_entities_category_id"} {
		var found string
		if err := db.QueryRow(`SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?`, index).Scan(&found); err != nil {
			t.Fatalf("missing index %q: %v", index, err)
		}
	}

	reopened, err := Open(path)
	if err != nil {
		t.Fatalf("reopen migrated database: %v", err)
	}
	reopened.Close()
	if err := db.QueryRow(`SELECT count(*) FROM categories`).Scan(&count); err != nil || count != 3 {
		t.Fatalf("category count after repeat migration = %d, err = %v", count, err)
	}
}
