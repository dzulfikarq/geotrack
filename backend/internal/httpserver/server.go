package httpserver

import (
	"net/http"

	"geotrack/backend/internal/entity"
	"github.com/gin-gonic/gin"
)

func New(repo *entity.Repository, corsOrigin string) http.Handler {
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery(), cors(corsOrigin))
	router.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })
	api := router.Group("/api/v1/entities")
	entity.NewHandler(repo).Register(api)
	return router
}

func cors(origin string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if origin != "" && c.GetHeader("Origin") == origin {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Vary", "Origin")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		}
		if c.Request.Method == http.MethodOptions {
			c.Status(http.StatusNoContent)
			c.Abort()
			return
		}
		c.Next()
	}
}
