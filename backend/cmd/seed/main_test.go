package main

import (
	"context"
	"testing"

	"geotrack/backend/internal/category"
	"geotrack/backend/internal/database"
	"geotrack/backend/internal/entity"
)

func TestSeedCreatesTwentyFiveEntitiesAndIsIdempotent(t *testing.T) {
	db, err := database.Open(":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	ctx := context.Background()
	for run := 0; run < 2; run++ {
		if err := seed(ctx, db); err != nil {
			t.Fatal(err)
		}
	}

	entities, err := entity.NewRepository(db).List(ctx, "", "", "", "")
	if err != nil {
		t.Fatal(err)
	}
	if len(entities) != 25 {
		t.Fatalf("seeded entities = %d, want 25", len(entities))
	}

	categories, err := category.NewRepository(db).List(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if len(categories) != 8 {
		t.Fatalf("seeded categories = %d, want 8", len(categories))
	}
}
