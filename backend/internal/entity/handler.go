package entity

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type Handler struct{ repo *Repository }

func NewHandler(repo *Repository) *Handler { return &Handler{repo: repo} }

type apiError struct {
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Fields  map[string]string `json:"fields,omitempty"`
}

func fail(c *gin.Context, status int, code, message string, fields map[string]string) {
	c.JSON(status, gin.H{"error": apiError{Code: code, Message: message, Fields: fields}})
}

func (h *Handler) Register(routes *gin.RouterGroup) {
	routes.GET("", h.list)
	routes.POST("", h.create)
	routes.GET("/:id", h.get)
	routes.PUT("/:id", h.update)
	routes.DELETE("/:id", h.delete)
}

func (h *Handler) list(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	category := c.Query("category")
	status := c.Query("status")
	fields := make(map[string]string)
	if category != "" && category != "vehicle" && category != "iot_device" && category != "facility" {
		fields["category"] = "Choose a valid category"
	}
	if status != "" && status != "active" && status != "inactive" && status != "maintenance" {
		fields["status"] = "Choose a valid status"
	}
	if len(fields) > 0 {
		fail(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid filters", fields)
		return
	}
	items, err := h.repo.List(c.Request.Context(), q, category, status)
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not load entities", nil)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func (h *Handler) get(c *gin.Context) {
	item, err := h.repo.Get(c.Request.Context(), c.Param("id"))
	if errors.Is(err, ErrNotFound) {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Entity not found", nil)
		return
	}
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not load entity", nil)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": item})
}

func (h *Handler) create(c *gin.Context) {
	input, ok := readInput(c)
	if !ok {
		return
	}
	input, fields := Validate(input)
	if len(fields) > 0 {
		fail(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid entity data", fields)
		return
	}
	item, err := h.repo.Create(c.Request.Context(), input)
	if IsDuplicateCode(err) {
		fail(c, http.StatusConflict, "DUPLICATE_CODE", "Code already exists", map[string]string{"code": "This code is already in use"})
		return
	}
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not create entity", nil)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": item})
}

func (h *Handler) update(c *gin.Context) {
	input, ok := readInput(c)
	if !ok {
		return
	}
	input, fields := Validate(input)
	if len(fields) > 0 {
		fail(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid entity data", fields)
		return
	}
	item, err := h.repo.Update(c.Request.Context(), c.Param("id"), input)
	if IsDuplicateCode(err) {
		fail(c, http.StatusConflict, "DUPLICATE_CODE", "Code already exists", map[string]string{"code": "This code is already in use"})
		return
	}
	if errors.Is(err, ErrNotFound) {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Entity not found", nil)
		return
	}
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not update entity", nil)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": item})
}

func (h *Handler) delete(c *gin.Context) {
	err := h.repo.Delete(c.Request.Context(), c.Param("id"))
	if errors.Is(err, ErrNotFound) {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Entity not found", nil)
		return
	}
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not delete entity", nil)
		return
	}
	c.Status(http.StatusNoContent)
}

func readInput(c *gin.Context) (Input, bool) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 1<<20)
	decoder := json.NewDecoder(c.Request.Body)
	decoder.DisallowUnknownFields()
	var input Input
	if err := decoder.Decode(&input); err != nil {
		fail(c, http.StatusBadRequest, "MALFORMED_JSON", "Request body must be a valid entity JSON object", nil)
		return Input{}, false
	}
	var extra any
	if err := decoder.Decode(&extra); !errors.Is(err, io.EOF) {
		fail(c, http.StatusBadRequest, "MALFORMED_JSON", "Request body must contain one JSON object", nil)
		return Input{}, false
	}
	return input, true
}
