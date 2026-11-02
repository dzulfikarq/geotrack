package entity_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"geotrack/backend/internal/category"
	"geotrack/backend/internal/database"
	"geotrack/backend/internal/entity"
	"geotrack/backend/internal/httpserver"
)

func newTestServer(t *testing.T, path string) (http.Handler, func()) {
	t.Helper()
	db, err := database.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	return httpserver.New(entity.NewRepository(db), category.NewRepository(db), "http://localhost:5173"), func() { db.Close() }
}

func request(t *testing.T, handler http.Handler, method, path string, body any) *httptest.ResponseRecorder {
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

func validBody() map[string]any {
	return map[string]any{
		"code": "IOT-001", "name": "Temperature Sensor", "category": "iot_device", "status": "active",
		"latitude": 0, "longitude": 0, "description": "Test sensor",
	}
}

func TestCreateZeroCoordinatesDuplicateAndPersistence(t *testing.T) {
	path := filepath.Join(t.TempDir(), "geotrack.db")
	handler, closeDB := newTestServer(t, path)
	created := request(t, handler, http.MethodPost, "/api/v1/entities", validBody())
	if created.Code != http.StatusCreated {
		t.Fatalf("create status = %d; body = %s", created.Code, created.Body)
	}
	var response struct {
		Data entity.Entity `json:"data"`
	}
	if err := json.Unmarshal(created.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	if len(response.Data.ID) != 36 {
		t.Fatalf("server-generated ID is not UUID-shaped: %q", response.Data.ID)
	}
	if response.Data.Latitude != 0 || response.Data.Longitude != 0 {
		t.Fatalf("zero coordinates not preserved: %+v", response.Data)
	}
	closeDB()

	handler, closeDB = newTestServer(t, path)
	defer closeDB()
	list := request(t, handler, http.MethodGet, "/api/v1/entities", nil)
	if list.Code != http.StatusOK || !bytes.Contains(list.Body.Bytes(), []byte(`"code":"IOT-001"`)) {
		t.Fatalf("persisted entity missing: %d %s", list.Code, list.Body)
	}
	duplicate := validBody()
	duplicate["code"] = "iot-001"
	res := request(t, handler, http.MethodPost, "/api/v1/entities", duplicate)
	if res.Code != http.StatusConflict || !bytes.Contains(res.Body.Bytes(), []byte(`"code":"DUPLICATE_CODE"`)) {
		t.Fatalf("duplicate code response = %d %s", res.Code, res.Body)
	}
}

func TestValidationRejectsBadInputs(t *testing.T) {
	handler, closeDB := newTestServer(t, ":memory:")
	defer closeDB()
	cases := []struct {
		name   string
		change func(map[string]any)
	}{
		{name: "missing latitude", change: func(body map[string]any) { delete(body, "latitude") }},
		{name: "out of range", change: func(body map[string]any) { body["latitude"] = 91 }},
		{name: "bad category", change: func(body map[string]any) { body["category"] = "ship" }},
		{name: "short name", change: func(body map[string]any) { body["name"] = "x" }},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			body := validBody()
			tc.change(body)
			res := request(t, handler, http.MethodPost, "/api/v1/entities", body)
			if res.Code != http.StatusBadRequest || !bytes.Contains(res.Body.Bytes(), []byte(`"code":"VALIDATION_ERROR"`)) {
				t.Fatalf("validation response = %d %s", res.Code, res.Body)
			}
		})
	}
	malformed := httptest.NewRequest(http.MethodPost, "/api/v1/entities", bytes.NewBufferString(`{"latitude":`))
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, malformed)
	if res.Code != http.StatusBadRequest {
		t.Fatalf("malformed JSON status = %d", res.Code)
	}
}

func TestUpdateDeleteAndCombinedFilters(t *testing.T) {
	handler, closeDB := newTestServer(t, ":memory:")
	defer closeDB()
	created := request(t, handler, http.MethodPost, "/api/v1/entities", validBody())
	var response struct {
		Data entity.Entity `json:"data"`
	}
	if err := json.Unmarshal(created.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	filtered := request(t, handler, http.MethodGet, "/api/v1/entities?q=sensor&category=iot_device&status=active", nil)
	if filtered.Code != http.StatusOK || bytes.Count(filtered.Body.Bytes(), []byte(`"id"`)) != 1 {
		t.Fatalf("combined filters failed: %d %s", filtered.Code, filtered.Body)
	}
	updatedBody := validBody()
	updatedBody["latitude"] = -7.2
	updated := request(t, handler, http.MethodPut, "/api/v1/entities/"+response.Data.ID, updatedBody)
	if updated.Code != http.StatusOK || !bytes.Contains(updated.Body.Bytes(), []byte(`"latitude":-7.2`)) {
		t.Fatalf("update failed: %d %s", updated.Code, updated.Body)
	}
	deleted := request(t, handler, http.MethodDelete, "/api/v1/entities/"+response.Data.ID, nil)
	if deleted.Code != http.StatusNoContent {
		t.Fatalf("delete status = %d; body = %s", deleted.Code, deleted.Body)
	}
	missing := request(t, handler, http.MethodGet, "/api/v1/entities/"+response.Data.ID, nil)
	if missing.Code != http.StatusNotFound {
		t.Fatalf("missing entity status = %d", missing.Code)
	}
}
