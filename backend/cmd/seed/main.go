package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"geotrack/backend/internal/database"
	"geotrack/backend/internal/entity"
)

func main() {
	db, err := database.Open(env("DB_PATH", "./data/geotrack.db"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	repo := entity.NewRepository(db)
	zero, lon := 0.0, 112.6326
	items := []entity.Input{
		{Code: "VEH-001", Name: "Service Vehicle", Category: "vehicle", Status: "active", Latitude: ptr(-7.9666), Longitude: &lon},
		{Code: "IOT-001", Name: "Temperature Sensor", Category: "iot_device", Status: "active", Latitude: ptr(zero), Longitude: ptr(zero), Description: "Zero coordinates demonstrate valid location data."},
		{Code: "FAC-001", Name: "Operations Center", Category: "facility", Status: "maintenance", Latitude: ptr(-6.2088), Longitude: ptr(106.8456)},
	}
	for _, input := range items {
		input, fields := entity.Validate(input)
		if len(fields) > 0 {
			log.Fatalf("invalid seed data: %v", fields)
		}
		if _, err := repo.Create(context.Background(), input); entity.IsDuplicateCode(err) {
			fmt.Printf("Skipped existing %s\n", input.Code)
		} else if err != nil {
			log.Fatal(err)
		} else {
			fmt.Printf("Added %s\n", input.Code)
		}
	}
}

func ptr(value float64) *float64 { return &value }

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
