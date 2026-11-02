package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"

	"geotrack/backend/internal/category"
	"geotrack/backend/internal/database"
	"geotrack/backend/internal/entity"
)

var customCategories = []category.Input{
	{Name: "Warehouse", Description: "Distribution hubs and storage locations.", IconKey: "warehouse", Color: "blue", MarkerStyle: "rounded-square"},
	{Name: "Medical Center", Description: "Clinics and healthcare facilities.", IconKey: "hospital", Color: "green", MarkerStyle: "circle"},
	{Name: "Port Terminal", Description: "Ports, harbors, and freight terminals.", IconKey: "ship", Color: "teal", MarkerStyle: "pin"},
	{Name: "Retail Outlet", Description: "Customer-facing stores and service outlets.", IconKey: "building-2", Color: "slate", MarkerStyle: "rounded-square"},
	{Name: "Utility Site", Description: "Utility plants and infrastructure sites.", IconKey: "factory", Color: "rose", MarkerStyle: "circle"},
}

type demoEntity struct {
	code, name, category, status, description string
	latitude, longitude                       float64
}

var demoEntities = []demoEntity{
	{"FAC-001", "Operations Center", "Facility", "maintenance", "Central operations site.", -6.2088, 106.8456},
	{"IOT-001", "Temperature Sensor", "IoT Device", "active", "Zero coordinates demonstrate valid location data.", 0, 0},
	{"TRCK-001", "Mobil Dinas Innova Reborn Hitam", "Vehicle", "active", "Regional field service vehicle.", -7.7450, 112.4738},
	{"VEH-001", "Service Vehicle", "Vehicle", "active", "Service vehicle based in Malang.", -7.9666, 112.6326},
	{"VEH-911", "North Hub Updated", "Facility", "active", "North operations hub.", -8.0375, 112.5879},
	{"VEH-002", "Surabaya Delivery Truck", "Vehicle", "active", "Daily delivery fleet vehicle.", -7.2504, 112.7688},
	{"VEH-003", "City Rescue Ambulance", "Vehicle", "maintenance", "Emergency response vehicle.", -7.9797, 112.6304},
	{"VEH-004", "Bandung Shuttle Bus", "Vehicle", "inactive", "Staff shuttle currently out of service.", -6.9147, 107.6098},
	{"IOT-002", "Humidity Sensor", "IoT Device", "active", "Humidity monitor at the Surabaya depot.", -7.2575, 112.7521},
	{"IOT-003", "Cold Room Monitor", "IoT Device", "maintenance", "Temperature monitor awaiting calibration.", -7.9666, 112.6326},
	{"IOT-004", "Water Level Sensor", "IoT Device", "inactive", "Reservoir sensor temporarily offline.", -7.8014, 110.3647},
	{"IOT-005", "Air Quality Node", "IoT Device", "active", "Air quality readings for the operations campus.", -6.2088, 106.8456},
	{"FAC-002", "West Operations Office", "Facility", "active", "Regional office in Bandung.", -6.9175, 107.6191},
	{"FAC-003", "Central Workshop", "Facility", "maintenance", "Vehicle maintenance workshop.", -7.9666, 112.6326},
	{"WH-001", "Malang Distribution Hub", "Warehouse", "active", "Primary distribution warehouse.", -7.9609, 112.6276},
	{"WH-002", "Surabaya Warehouse", "Warehouse", "inactive", "Secondary warehouse currently closed.", -7.2690, 112.7508},
	{"WH-003", "Semarang Cold Storage", "Warehouse", "maintenance", "Cold storage facility undergoing maintenance.", -6.9667, 110.4167},
	{"MED-001", "City Medical Center", "Medical Center", "active", "Partner healthcare facility.", -7.9839, 112.6214},
	{"MED-002", "North District Clinic", "Medical Center", "maintenance", "Clinic scheduled for equipment service.", -6.2000, 106.8300},
	{"PORT-001", "Tanjung Perak Terminal", "Port Terminal", "active", "Freight handling terminal in Surabaya.", -7.2024, 112.7378},
	{"PORT-002", "Benoa Harbor", "Port Terminal", "inactive", "Seasonal harbor operations site.", -8.7464, 115.2123},
	{"RET-001", "Malang Service Outlet", "Retail Outlet", "active", "Customer service and pickup point.", -7.9790, 112.6303},
	{"RET-002", "Bandung Customer Center", "Retail Outlet", "active", "Regional customer support center.", -6.9147, 107.6098},
	{"UTIL-001", "East Java Utility Station", "Utility Site", "maintenance", "Electrical infrastructure site.", -7.5300, 112.2380},
	{"UTIL-002", "Solo Utility Station", "Utility Site", "active", "Utility monitoring station near Solo.", -7.5755, 110.8243},
}

func main() {
	db, err := database.Open(env("DB_PATH", "./data/geotrack.db"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	if err := seed(context.Background(), db); err != nil {
		log.Fatal(err)
	}
}

func seed(ctx context.Context, db *sql.DB) error {
	categoryRepo := category.NewRepository(db)
	entityRepo := entity.NewRepository(db)
	categoryIDs, err := ensureCategories(ctx, categoryRepo)
	if err != nil {
		return err
	}

	for _, item := range demoEntities {
		categoryID, ok := categoryIDs[strings.ToLower(item.category)]
		if !ok {
			return fmt.Errorf("seed category %q not found", item.category)
		}
		input, fields := entity.Validate(entity.Input{
			Code: item.code, Name: item.name, CategoryID: categoryID, Status: item.status,
			Latitude: ptr(item.latitude), Longitude: ptr(item.longitude), Description: item.description,
		})
		if len(fields) > 0 {
			return fmt.Errorf("invalid seed data for %s: %v", item.code, fields)
		}
		if _, err := entityRepo.Create(ctx, input); entity.IsDuplicateCode(err) {
			fmt.Printf("Skipped existing %s\n", input.Code)
		} else if err != nil {
			return fmt.Errorf("create %s: %w", input.Code, err)
		} else {
			fmt.Printf("Added %s\n", input.Code)
		}
	}
	return nil
}

func ensureCategories(ctx context.Context, repo *category.Repository) (map[string]string, error) {
	items, err := repo.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("list categories: %w", err)
	}
	ids := make(map[string]string, len(items)+len(customCategories))
	for _, item := range items {
		ids[strings.ToLower(item.Name)] = item.ID
	}

	for _, input := range customCategories {
		key := strings.ToLower(input.Name)
		if _, exists := ids[key]; exists {
			fmt.Printf("Skipped existing category %s\n", input.Name)
			continue
		}
		input, fields := category.Validate(input)
		if len(fields) > 0 {
			return nil, fmt.Errorf("invalid seed category %q: %v", input.Name, fields)
		}
		created, err := repo.Create(ctx, input)
		if errors.Is(err, category.ErrDuplicateName) {
			items, err = repo.List(ctx)
			if err != nil {
				return nil, fmt.Errorf("reload categories: %w", err)
			}
			for _, item := range items {
				if strings.EqualFold(item.Name, input.Name) {
					ids[key] = item.ID
					break
				}
			}
			if _, exists := ids[key]; !exists {
				return nil, fmt.Errorf("category %q exists but could not be loaded", input.Name)
			}
			fmt.Printf("Skipped existing category %s\n", input.Name)
			continue
		}
		if err != nil {
			return nil, fmt.Errorf("create category %s: %w", input.Name, err)
		}
		ids[key] = created.ID
		fmt.Printf("Added category %s\n", input.Name)
	}
	return ids, nil
}

func ptr(value float64) *float64 { return &value }

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
