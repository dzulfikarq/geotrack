package category

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

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
	routes.PUT("/:id", h.update)
	routes.DELETE("/:id", h.delete)
}

func (h *Handler) list(c *gin.Context) {
	items, err := h.repo.List(c.Request.Context())
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not load categories", nil)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func (h *Handler) create(c *gin.Context) {
	input, ok := readInput(c)
	if !ok {
		return
	}
	input, fields := Validate(input)
	if len(fields) != 0 {
		fail(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid category data", fields)
		return
	}
	item, err := h.repo.Create(c.Request.Context(), input)
	if errors.Is(err, ErrDuplicateName) {
		fail(c, http.StatusConflict, "CATEGORY_NAME_EXISTS", "A category with this name already exists", map[string]string{"name": "Name is already in use"})
		return
	}
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not create category", nil)
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
	if len(fields) != 0 {
		fail(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid category data", fields)
		return
	}
	item, err := h.repo.Update(c.Request.Context(), c.Param("id"), input)
	if errors.Is(err, ErrNotFound) {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Category not found", nil)
		return
	}
	if errors.Is(err, ErrDuplicateName) {
		fail(c, http.StatusConflict, "CATEGORY_NAME_EXISTS", "A category with this name already exists", map[string]string{"name": "Name is already in use"})
		return
	}
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not update category", nil)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": item})
}

func (h *Handler) delete(c *gin.Context) {
	err := h.repo.Delete(c.Request.Context(), c.Param("id"))
	if errors.Is(err, ErrNotFound) {
		fail(c, http.StatusNotFound, "NOT_FOUND", "Category not found", nil)
		return
	}
	if errors.Is(err, ErrInUse) {
		fail(c, http.StatusConflict, "CATEGORY_IN_USE", "This category is assigned to existing entities and cannot be deleted", nil)
		return
	}
	if errors.Is(err, ErrBuiltIn) {
		fail(c, http.StatusConflict, "CATEGORY_BUILT_IN", "Built-in categories cannot be deleted", nil)
		return
	}
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not delete category", nil)
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
		fail(c, http.StatusBadRequest, "MALFORMED_JSON", "Request body must be a valid category JSON object", nil)
		return Input{}, false
	}
	var extra any
	if err := decoder.Decode(&extra); !errors.Is(err, io.EOF) {
		fail(c, http.StatusBadRequest, "MALFORMED_JSON", "Request body must contain one JSON object", nil)
		return Input{}, false
	}
	return input, true
}
