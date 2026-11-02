package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"geotrack/backend/internal/database"
	"geotrack/backend/internal/category"
	"geotrack/backend/internal/entity"
	"geotrack/backend/internal/httpserver"
)

func main() {
	port := env("PORT", "8080")
	db, err := database.Open(env("DB_PATH", "./data/geotrack.db"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           httpserver.New(entity.NewRepository(db), category.NewRepository(db), env("CORS_ORIGIN", "http://localhost:5173")),
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Printf("GeoTrack API listening on http://localhost:%s", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
