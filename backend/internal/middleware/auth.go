package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/services"
)

// JWTMiddleware creates a middleware for JWT authentication
func JWTMiddleware(userService *services.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Check if the header starts with "Bearer "
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := tokenParts[1]

		// Validate token and get user
		user, err := userService.GetUserFromToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Set user in context for use in handlers
		c.Set("user", user)
		c.Next()
	}
}

// AdminMiddleware ensures only users with ADMIN role can access the endpoint
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user from context (should be set by JWTMiddleware)
		userInterface, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
			c.Abort()
			return
		}

		user, ok := userInterface.(*models.User)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user data"})
			c.Abort()
			return
		}

		// Check if user has admin role
		if user.RoleID != models.RoleAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// StationAccessMiddleware allows ADMIN, OPERATOR, and HQ roles to access station endpoints
func StationAccessMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user from context (should be set by JWTMiddleware)
		userInterface, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
			c.Abort()
			return
		}

		user, ok := userInterface.(*models.User)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user data"})
			c.Abort()
			return
		}

		// Check if user has allowed role (ADMIN, OPERATOR, or HQ)
		if user.RoleID != models.RoleAdmin && user.RoleID != models.RoleOperator && user.RoleID != models.RoleHQ {
			c.JSON(http.StatusForbidden, gin.H{"error": "Station access requires ADMIN, OPERATOR, or HQ role"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// OperatorMiddleware ensures only users with OPERATOR role can access the endpoint
func OperatorMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user from context (should be set by JWTMiddleware)
		userInterface, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
			c.Abort()
			return
		}

		user, ok := userInterface.(*models.User)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user data"})
			c.Abort()
			return
		}

		// Check if user has operator role
		if user.RoleID != models.RoleOperator {
			c.JSON(http.StatusForbidden, gin.H{"error": "Operator access required"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// HQMiddleware ensures only users with HQ role can access the endpoint
func HQMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user from context (should be set by JWTMiddleware)
		userInterface, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
			c.Abort()
			return
		}

		user, ok := userInterface.(*models.User)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user data"})
			c.Abort()
			return
		}

		// Check if user has HQ role
		if user.RoleID != models.RoleHQ {
			c.JSON(http.StatusForbidden, gin.H{"error": "HQ access required"})
			c.Abort()
			return
		}

		c.Next()
	}
}
