package category_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"geotrack/backend/internal/category"
	"geotrack/backend/internal/database"
	"geotrack/backend/internal/entity"
	"geotrack/backend/internal/httpserver"
)

func TestCategoryCRUDKeepsEntityRelationsStable(t *testing.T) {
	db, err := database.Open(":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	handler := httpserver.New(entity.NewRepository(db), category.NewRepository(db), "")

	created := categoryRequest(t, handler, http.MethodPost, "/api/v1/categories", map[string]any{
		"name": "  Warehouse ", "description": "Storage", "icon_key": "warehouse", "color": "blue", "marker_style": "rounded-square",
	})
	if created.Code != http.StatusCreated {
		t.Fatalf("create category = %d %s", created.Code, created.Body)
	}
	var categoryResult struct {
		Data category.Category `json:"data"`
	}
	if err := json.Unmarshal(created.Body.Bytes(), &categoryResult); err != nil {
		t.Fatal(err)
	}
	if categoryResult.Data.Name != "Warehouse" || categoryResult.Data.ID == "" {
		t.Fatalf("created category = %+v", categoryResult.Data)
	}
	if categoryResult.Data.BuiltIn || categoryResult.Data.MarkerStyle != "rounded-square" || categoryResult.Data.IconKey != "warehouse" {
		t.Fatalf("custom category metadata = %+v", categoryResult.Data)
	}
	entityBody := map[string]any{
		"code": "WH-001", "name": "West warehouse", "category_id": categoryResult.Data.ID,
		"status": "active", "latitude": 0, "longitude": 0,
	}
	createdEntity := categoryRequest(t, handler, http.MethodPost, "/api/v1/entities", entityBody)
	if createdEntity.Code != http.StatusCreated {
		t.Fatalf("create entity = %d %s", createdEntity.Code, createdEntity.Body)
	}
	var entityResult struct {
		Data entity.Entity `json:"data"`
	}
	if err := json.Unmarshal(createdEntity.Body.Bytes(), &entityResult); err != nil {
		t.Fatal(err)
	}
	if entityResult.Data.CategoryID != categoryResult.Data.ID || entityResult.Data.CategoryName != "Warehouse" {
		t.Fatalf("entity category relation = %+v", entityResult.Data)
	}

	updated := categoryRequest(t, handler, http.MethodPut, "/api/v1/categories/"+categoryResult.Data.ID, map[string]any{
		"name": "Distribution Hub", "description": "Renamed", "icon_key": "factory", "color": "green", "marker_style": "pin",
	})
	if updated.Code != http.StatusOK {
		t.Fatalf("rename category = %d %s", updated.Code, updated.Body)
	}
	entityAfterRename := categoryRequest(t, handler, http.MethodGet, "/api/v1/entities/"+entityResult.Data.ID, nil)
	if !bytes.Contains(entityAfterRename.Body.Bytes(), []byte(`"category_id":"`+categoryResult.Data.ID+`"`)) ||
		!bytes.Contains(entityAfterRename.Body.Bytes(), []byte(`"category_name":"Distribution Hub"`)) ||
		!bytes.Contains(entityAfterRename.Body.Bytes(), []byte(`"category_icon_key":"factory"`)) ||
		!bytes.Contains(entityAfterRename.Body.Bytes(), []byte(`"category_color":"green"`)) {
		t.Fatalf("renamed entity relation not preserved: %s", entityAfterRename.Body)
	}
	blocked := categoryRequest(t, handler, http.MethodDelete, "/api/v1/categories/"+categoryResult.Data.ID, nil)
	if blocked.Code != http.StatusConflict || !bytes.Contains(blocked.Body.Bytes(), []byte(`"code":"CATEGORY_IN_USE"`)) {
		t.Fatalf("in-use category delete = %d %s", blocked.Code, blocked.Body)
	}
	filtered := categoryRequest(t, handler, http.MethodGet, "/api/v1/entities?category_id="+categoryResult.Data.ID, nil)
	if filtered.Code != http.StatusOK || !bytes.Contains(filtered.Body.Bytes(), []byte(`"code":"WH-001"`)) {
		t.Fatalf("category_id filter = %d %s", filtered.Code, filtered.Body)
	}
	if deleted := categoryRequest(t, handler, http.MethodDelete, "/api/v1/entities/"+entityResult.Data.ID, nil); deleted.Code != http.StatusNoContent {
		t.Fatalf("delete entity = %d %s", deleted.Code, deleted.Body)
	}
	if deleted := categoryRequest(t, handler, http.MethodDelete, "/api/v1/categories/"+categoryResult.Data.ID, nil); deleted.Code != http.StatusNoContent {
		t.Fatalf("delete unused category = %d %s", deleted.Code, deleted.Body)
	}
}

func TestBuiltInCategoriesCannotBeDeleted(t *testing.T) {
	db, err := database.Open(":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	handler := httpserver.New(entity.NewRepository(db), category.NewRepository(db), "")
	res := categoryRequest(t, handler, http.MethodDelete, "/api/v1/categories/00000000-0000-4000-8000-000000000001", nil)
	if res.Code != http.StatusConflict {
		t.Fatalf("delete built-in category = %d %s", res.Code, res.Body)
	}
}

func TestCategoryNameAndFieldsValidation(t *testing.T) {
	db, err := database.Open(":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	handler := httpserver.New(entity.NewRepository(db), category.NewRepository(db), "")
	body := map[string]any{"name": "Vehicle", "icon_key": "truck", "color": "orange", "marker_style": "pin"}
	duplicate := categoryRequest(t, handler, http.MethodPost, "/api/v1/categories", body)
	if duplicate.Code != http.StatusConflict {
		t.Fatalf("duplicate category status = %d %s", duplicate.Code, duplicate.Body)
	}
	invalid := categoryRequest(t, handler, http.MethodPost, "/api/v1/categories", map[string]any{
		"name": " ", "icon_key": "<script>", "color": "#fff", "marker_style": "svg",
	})
	if invalid.Code != http.StatusBadRequest || !bytes.Contains(invalid.Body.Bytes(), []byte(`"code":"VALIDATION_ERROR"`)) {
		t.Fatalf("invalid category status = %d %s", invalid.Code, invalid.Body)
	}
}

func categoryRequest(t *testing.T, handler http.Handler, method, path string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var data []byte
	if body != nil {
		var err error
		data, err = json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
	}
	req := httptest.NewRequest(method, path, bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)
	return res
}
