package entity

import (
	"math"
	"regexp"
	"strings"
	"unicode/utf8"
)

var codePattern = regexp.MustCompile(`^[A-Z0-9-]{3,32}$`)

func Validate(input Input) (Input, map[string]string) {
	fields := make(map[string]string)
	input.Code = strings.ToUpper(strings.TrimSpace(input.Code))
	input.Name = strings.TrimSpace(input.Name)
	input.Category = strings.TrimSpace(input.Category)
	input.CategoryID = strings.TrimSpace(input.CategoryID)
	input.Status = strings.TrimSpace(input.Status)
	input.Description = strings.TrimSpace(input.Description)

	if !codePattern.MatchString(input.Code) {
		fields["code"] = "Use 3–32 uppercase letters, numbers, or hyphens"
	}
	if size := utf8.RuneCountInString(input.Name); size < 2 || size > 100 {
		fields["name"] = "Use 2–100 characters"
	}
	if input.CategoryID == "" && input.Category == "" {
		fields["category_id"] = "Choose a category"
	} else if input.CategoryID != "" && input.Category != "" {
		fields["category_id"] = "Provide category_id or legacy category, not both"
	}
	if input.Status != "active" && input.Status != "inactive" && input.Status != "maintenance" {
		fields["status"] = "Choose a valid status"
	}
	if input.Latitude == nil {
		fields["latitude"] = "Required"
	} else if math.IsNaN(*input.Latitude) || math.IsInf(*input.Latitude, 0) || *input.Latitude < -90 || *input.Latitude > 90 {
		fields["latitude"] = "Must be between -90 and 90"
	}
	if input.Longitude == nil {
		fields["longitude"] = "Required"
	} else if math.IsNaN(*input.Longitude) || math.IsInf(*input.Longitude, 0) || *input.Longitude < -180 || *input.Longitude > 180 {
		fields["longitude"] = "Must be between -180 and 180"
	}
	if utf8.RuneCountInString(input.Description) > 500 {
		fields["description"] = "Must be 500 characters or fewer"
	}
	return input, fields
}
