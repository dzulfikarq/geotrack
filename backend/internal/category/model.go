package category

import (
	"crypto/rand"
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	ErrNotFound      = errors.New("category not found")
	ErrInUse         = errors.New("category is used by existing entities")
	ErrBuiltIn       = errors.New("built-in category cannot be deleted")
	ErrDuplicateName = errors.New("category name already exists")
)

var icons = map[string]bool{
	"truck": true, "car-front": true, "bus-front": true, "bike": true, "ship": true, "train-front": true,
	"cpu": true, "radio": true, "router": true, "wifi": true, "satellite-dish": true, "thermometer": true,
	"building-2": true, "warehouse": true, "factory": true, "hospital": true, "school": true, "landmark": true,
	"map-pin": true, "map-pinned": true, "package": true, "box": true, "briefcase": true, "database": true,
}

var colors = map[string]bool{
	"orange": true, "teal": true, "violet": true, "blue": true, "green": true, "rose": true, "slate": true, "amber": true,
}

var markerStyles = map[string]bool{"pin": true, "circle": true, "rounded-square": true}

func isBuiltIn(key string) bool {
	return key == "vehicle" || key == "iot_device" || key == "facility"
}

type Category struct {
	ID          string `json:"id"`
	LegacyKey   string `json:"-"`
	BuiltIn     bool   `json:"is_builtin"`
	Name        string `json:"name"`
	Description string `json:"description"`
	IconKey     string `json:"icon_key"`
	Color       string `json:"color"`
	MarkerStyle string `json:"marker_style"`
	EntityCount int    `json:"entity_count"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type Input struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	IconKey     string `json:"icon_key"`
	Color       string `json:"color"`
	MarkerStyle string `json:"marker_style"`
}

func Validate(input Input) (Input, map[string]string) {
	fields := make(map[string]string)
	input.Name = strings.TrimSpace(input.Name)
	input.Description = strings.TrimSpace(input.Description)
	input.IconKey = strings.TrimSpace(input.IconKey)
	input.Color = strings.TrimSpace(input.Color)
	input.MarkerStyle = strings.TrimSpace(input.MarkerStyle)
	if input.Name == "" {
		fields["name"] = "Category name is required"
	} else if len([]rune(input.Name)) > 60 {
		fields["name"] = "Use 60 characters or fewer"
	}
	if len([]rune(input.Description)) > 500 {
		fields["description"] = "Use 500 characters or fewer"
	}
	if !icons[input.IconKey] {
		fields["icon_key"] = "Choose an available icon"
	}
	if !colors[input.Color] {
		fields["color"] = "Choose a palette color"
	}
	if !markerStyles[input.MarkerStyle] {
		fields["marker_style"] = "Choose a marker style"
	}
	return input, fields
}

func newID() (string, error) {
	var id [16]byte
	if _, err := rand.Read(id[:]); err != nil {
		return "", err
	}
	id[6] = (id[6] & 0x0f) | 0x40
	id[8] = (id[8] & 0x3f) | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", id[0:4], id[4:6], id[6:8], id[8:10], id[10:16]), nil
}

func now() string { return time.Now().UTC().Format(time.RFC3339Nano) }
