package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/services"
)

type CommandHandler struct {
	commandService *services.CommandService
	stationService *services.StationService
}

func NewCommandHandler(commandService *services.CommandService, stationService *services.StationService) *CommandHandler {
	return &CommandHandler{
		commandService: commandService,
		stationService: stationService,
	}
}

// CreateCommandRequest represents the request for creating a command
type CreateCommandRequest struct {
	ToStationID uint   `json:"to_station_id" binding:"required"`
	Content     string `json:"content" binding:"required"`
}

// AcknowledgeCommandRequest represents the request for acknowledging a command
type AcknowledgeCommandRequest struct {
	CommandID uint `json:"command_id" binding:"required"`
}

// CreateCommand creates a new command
// @Summary Create a new command
// @Description Create a new command to send to a station (HQ only)
// @Tags commands
// @Accept json
// @Produce json
// @Param command body CreateCommandRequest true "Command data"
// @Security BearerAuth
// @Success 201 {object} models.Command
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /commands [post]
func (h *CommandHandler) CreateCommand(c *gin.Context) {
	var req CreateCommandRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request format"})
		return
	}

	// Get user from context
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "User not found in context"})
		return
	}

	user, ok := userInterface.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Invalid user data"})
		return
	}

	// Validate that the station exists
	_, err := h.stationService.GetByID(req.ToStationID)
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Station not found"})
		return
	}

	command := &models.Command{
		ToStationID: req.ToStationID,
		Content:     req.Content,
		FromUserID:  strconv.Itoa(user.ID),
	}

	if err := h.commandService.Create(command); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create command"})
		return
	}

	c.JSON(http.StatusCreated, command)
}

// ListCommands lists commands
// @Summary List commands
// @Description List all commands or commands for a specific station
// @Tags commands
// @Produce json
// @Param station_id query int false "Station ID to filter commands"
// @Security BearerAuth
// @Success 200 {array} models.Command
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /commands [get]
func (h *CommandHandler) ListCommands(c *gin.Context) {
	stationIDStr := c.Query("station_id")

	var commands []models.Command
	var err error

	if stationIDStr != "" {
		stationID, parseErr := strconv.ParseUint(stationIDStr, 10, 32)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid station ID"})
			return
		}
		commands, err = h.commandService.ListByStation(uint(stationID))
	} else {
		commands, err = h.commandService.ListAll()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to retrieve commands"})
		return
	}

	c.JSON(http.StatusOK, commands)
}

// GetCommand retrieves a specific command
// @Summary Get a command by ID
// @Description Get a specific command by ID
// @Tags commands
// @Produce json
// @Param id path int true "Command ID"
// @Security BearerAuth
// @Success 200 {object} models.Command
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /commands/{id} [get]
func (h *CommandHandler) GetCommand(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid command ID"})
		return
	}

	command, err := h.commandService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Command not found"})
		return
	}

	c.JSON(http.StatusOK, command)
}

// AcknowledgeCommand acknowledges a command
// @Summary Acknowledge a command
// @Description Acknowledge a command by ID (Operator only)
// @Tags commands
// @Accept json
// @Produce json
// @Param id path int true "Command ID"
// @Security BearerAuth
// @Success 200 {object} models.Command
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /commands/{id}/acknowledge [put]
func (h *CommandHandler) AcknowledgeCommand(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid command ID"})
		return
	}

	// Check if command exists first
	command, err := h.commandService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Command not found"})
		return
	}

	// Check if command is already acknowledged
	if command.AcknowledgedAt != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Command already acknowledged"})
		return
	}

	// Acknowledge the command
	if err := h.commandService.AcknowledgeCommand(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to acknowledge command"})
		return
	}

	// Get updated command to return
	updatedCommand, err := h.commandService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to retrieve updated command"})
		return
	}

	c.JSON(http.StatusOK, updatedCommand)
}

// ListUnacknowledgedCommands lists unacknowledged commands for a station
// @Summary List unacknowledged commands
// @Description List unacknowledged commands for a specific station (Operator only)
// @Tags commands
// @Produce json
// @Param station_id path int true "Station ID"
// @Security BearerAuth
// @Success 200 {array} models.Command
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /station-commands/station/{station_id}/unacknowledged [get]
func (h *CommandHandler) ListUnacknowledgedCommands(c *gin.Context) {
	stationIDStr := c.Param("station_id")
	stationID, err := strconv.ParseUint(stationIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid station ID"})
		return
	}

	// Validate that the station exists
	_, err = h.stationService.GetByID(uint(stationID))
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Station not found"})
		return
	}

	commands, err := h.commandService.ListUnack(uint(stationID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to retrieve unacknowledged commands"})
		return
	}

	c.JSON(http.StatusOK, commands)
}
