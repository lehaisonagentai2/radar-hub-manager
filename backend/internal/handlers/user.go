package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/services"
)

type UserHandler struct {
	userService *services.UserService
}

func NewUserHandler(userService *services.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

// CreateUserRequest represents the create user request payload
type CreateUserRequest struct {
	Username  string          `json:"username" binding:"required" example:"johndoe"`
	Password  string          `json:"password" binding:"required" example:"password123"`
	FullName  string          `json:"full_name" binding:"required" example:"John Doe"`
	RoleID    models.RoleName `json:"role_id" binding:"required" example:"OPERATOR"`
	StationID *uint           `json:"station_id,omitempty" example:"1"`
}

// UpdateUserRequest represents the update user request payload
type UpdateUserRequest struct {
	Password  *string          `json:"password,omitempty" example:"newpassword123"`
	FullName  *string          `json:"full_name,omitempty" example:"John Smith"`
	RoleID    *models.RoleName `json:"role_id,omitempty" example:"ADMIN"`
	StationID *uint            `json:"station_id,omitempty" example:"2"`
}

// CreateUser godoc
// @Summary Create a new user (Admin only)
// @Description Create a new user account. Only users with ADMIN role can perform this action.
// @Tags users
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body CreateUserRequest true "User creation data"
// @Success 201 {object} models.User "User created successfully"
// @Failure 400 {object} ErrorResponse "Bad request"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden - Admin access required"
// @Failure 409 {object} ErrorResponse "Conflict - Username already exists"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /users [post]
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request format"})
		return
	}

	// Create user model
	user := &models.User{
		Username:  req.Username,
		Password:  req.Password,
		FullName:  req.FullName,
		RoleID:    req.RoleID,
		StationID: req.StationID,
	}

	// Create user using service
	err := h.userService.Create(user)
	if err != nil {
		if err.Error() == "username already exists" {
			c.JSON(http.StatusConflict, ErrorResponse{Error: "Username already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create user"})
		return
	}

	// Remove password from response
	user.Password = ""

	c.JSON(http.StatusCreated, user)
}

// UpdateUser godoc
// @Summary Update an existing user (Admin only)
// @Description Update user information. Only users with ADMIN role can perform this action.
// @Tags users
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param username path string true "Username"
// @Param request body UpdateUserRequest true "User update data"
// @Success 200 {object} models.User "User updated successfully"
// @Failure 400 {object} ErrorResponse "Bad request"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden - Admin access required"
// @Failure 404 {object} ErrorResponse "User not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /users/{username} [put]
func (h *UserHandler) UpdateUser(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Username is required"})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request format"})
		return
	}

	// Update user using service
	updateMap := make(map[string]interface{})
	if req.Password != nil {
		updateMap["password"] = *req.Password
	}
	if req.FullName != nil {
		updateMap["full_name"] = *req.FullName
	}
	if req.RoleID != nil {
		updateMap["role_id"] = *req.RoleID
	}
	if req.StationID != nil {
		updateMap["station_id"] = req.StationID
	}

	user, err := h.userService.UpdateByUsername(username, updateMap)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update user"})
		return
	}

	// Remove password from response
	user.Password = ""

	c.JSON(http.StatusOK, user)
}

// DeleteUser godoc
// @Summary Delete a user (Admin only)
// @Description Delete a user account. Only users with ADMIN role can perform this action.
// @Tags users
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param username path string true "Username"
// @Success 200 {object} map[string]string "User deleted successfully"
// @Failure 400 {object} ErrorResponse "Bad request"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden - Admin access required"
// @Failure 404 {object} ErrorResponse "User not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /users/{username} [delete]
func (h *UserHandler) DeleteUser(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Username is required"})
		return
	}

	// Delete user using service
	err := h.userService.DeleteByUsername(username)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// GetUser godoc
// @Summary Get user by username (Admin only)
// @Description Get user information by username. Only users with ADMIN role can perform this action.
// @Tags users
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param username path string true "Username"
// @Success 200 {object} models.User "User information"
// @Failure 400 {object} ErrorResponse "Bad request"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden - Admin access required"
// @Failure 404 {object} ErrorResponse "User not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /users/{username} [get]
func (h *UserHandler) GetUser(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Username is required"})
		return
	}

	// Get user using service
	user, err := h.userService.GetByUsername(username)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to get user"})
		return
	}

	// Remove password from response
	user.Password = ""

	c.JSON(http.StatusOK, user)
}

// ListUsers godoc
// @Summary List all users (Admin only)
// @Description Get a list of all users. Only users with ADMIN role can perform this action.
// @Tags users
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {array} models.User "List of users"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden - Admin access required"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /users [get]
func (h *UserHandler) ListUsers(c *gin.Context) {
	// List all users using service
	users, err := h.userService.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to list users"})
		return
	}

	// Remove passwords from response
	for i := range users {
		users[i].Password = ""
	}

	c.JSON(http.StatusOK, users)
}
