package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/services"
)

type StationHandler struct {
	stationService *services.StationService
}

func NewStationHandler(stationService *services.StationService) *StationHandler {
	return &StationHandler{stationService: stationService}
}

// CreateStationRequest represents the create station request payload
type CreateStationRequest struct {
	ID              *uint   `json:"id,omitempty" example:"1"`
	Name            string  `json:"name" binding:"required" example:"Station Alpha"`
	Latitude        float64 `json:"latitude" binding:"required" example:"21.0285"`
	Longitude       float64 `json:"longitude" binding:"required" example:"105.8542"`
	Elevation       float64 `json:"elevation" example:"10.5"`
	DistanceToCoast float64 `json:"distance_to_coast" example:"15.2"`
	Status          string  `json:"status" example:"ACTIVE"`
	Note            string  `json:"note,omitempty" example:"Main radar station"`
}

// UpdateStationRequest represents the update station request payload
type UpdateStationRequest struct {
	Name            *string  `json:"name,omitempty" example:"Updated Station Alpha"`
	Latitude        *float64 `json:"latitude,omitempty" example:"21.0290"`
	Longitude       *float64 `json:"longitude,omitempty" example:"105.8550"`
	Elevation       *float64 `json:"elevation,omitempty" example:"12.0"`
	DistanceToCoast *float64 `json:"distance_to_coast,omitempty" example:"16.0"`
	Status          *string  `json:"status,omitempty" example:"INACTIVE"`
	Note            *string  `json:"note,omitempty" example:"Updated radar station"`
}

// CreateStation godoc
// @Summary Create a new station (Admin only)
// @Description Create a new radar station. Only users with ADMIN role can perform this action.
// @Tags stations
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body CreateStationRequest true "Station creation data"
// @Success 201 {object} models.Station "Station created successfully"
// @Failure 400 {object} ErrorResponse "Bad request"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden - Admin access required"
// @Failure 409 {object} ErrorResponse "Conflict - Station already exists"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stations [post]
func (h *StationHandler) CreateStation(c *gin.Context) {
	var req CreateStationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request format"})
		return
	}

	// Create station model
	station := &models.Station{
		Name:            req.Name,
		Latitude:        req.Latitude,
		Longitude:       req.Longitude,
		Elevation:       req.Elevation,
		DistanceToCoast: req.DistanceToCoast,
		Status:          req.Status,
		Note:            req.Note,
	}

	// Set ID if provided
	if req.ID != nil {
		station.ID = *req.ID
	}

	// Set default status if not provided
	if station.Status == "" {
		station.Status = "ACTIVE"
	}

	// Create station using service
	err := h.stationService.Create(station)
	if err != nil {
		if err.Error() == "station with this ID already exists" {
			c.JSON(http.StatusConflict, ErrorResponse{Error: "Station with this ID already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create station"})
		return
	}

	c.JSON(http.StatusCreated, station)
}

// UpdateStation godoc
// @Summary Update an existing station (Admin only)
// @Description Update station information. Only users with ADMIN role can perform this action.
// @Tags stations
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path int true "Station ID"
// @Param request body UpdateStationRequest true "Station update data"
// @Success 200 {object} models.Station "Station updated successfully"
// @Failure 400 {object} ErrorResponse "Bad request"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden - Admin access required"
// @Failure 404 {object} ErrorResponse "Station not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stations/{id} [put]
func (h *StationHandler) UpdateStation(c *gin.Context) {
	stationIDStr := c.Param("id")
	stationID, err := strconv.ParseUint(stationIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid station ID"})
		return
	}

	var req UpdateStationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request format"})
		return
	}

	// Update station using service
	updateMap := make(map[string]interface{})
	if req.Name != nil {
		updateMap["name"] = *req.Name
	}
	if req.Latitude != nil {
		updateMap["latitude"] = *req.Latitude
	}
	if req.Longitude != nil {
		updateMap["longitude"] = *req.Longitude
	}
	if req.Elevation != nil {
		updateMap["elevation"] = *req.Elevation
	}
	if req.DistanceToCoast != nil {
		updateMap["distance_to_coast"] = *req.DistanceToCoast
	}
	if req.Status != nil {
		updateMap["status"] = *req.Status
	}
	if req.Note != nil {
		updateMap["note"] = *req.Note
	}

	station, err := h.stationService.UpdatePartial(uint(stationID), updateMap)
	if err != nil {
		if err.Error() == "station not found" {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Station not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update station"})
		return
	}

	c.JSON(http.StatusOK, station)
}

// DeleteStation godoc
// @Summary Delete a station (Admin only)
// @Description Delete a radar station. Only users with ADMIN role can perform this action.
// @Tags stations
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path int true "Station ID"
// @Success 200 {object} map[string]string "Station deleted successfully"
// @Failure 400 {object} ErrorResponse "Bad request"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden - Admin access required"
// @Failure 404 {object} ErrorResponse "Station not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stations/{id} [delete]
func (h *StationHandler) DeleteStation(c *gin.Context) {
	stationIDStr := c.Param("id")
	stationID, err := strconv.ParseUint(stationIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid station ID"})
		return
	}

	// Delete station using service
	err = h.stationService.Delete(uint(stationID))
	if err != nil {
		if err.Error() == "station not found" {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Station not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete station"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Station deleted successfully"})
}

// GetStation godoc
// @Summary Get station by ID (Admin only)
// @Description Get station information by ID. Only users with ADMIN role can perform this action.
// @Tags stations
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path int true "Station ID"
// @Success 200 {object} models.Station "Station information"
// @Failure 400 {object} ErrorResponse "Bad request"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden - Admin access required"
// @Failure 404 {object} ErrorResponse "Station not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stations/{id} [get]
func (h *StationHandler) GetStation(c *gin.Context) {
	stationIDStr := c.Param("id")
	stationID, err := strconv.ParseUint(stationIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid station ID"})
		return
	}

	// Get station using service
	station, err := h.stationService.GetByID(uint(stationID))
	if err != nil {
		if err.Error() == "station not found" {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Station not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to get station"})
		return
	}

	c.JSON(http.StatusOK, station)
}

// ListStations godoc
// @Summary List all stations (Admin only)
// @Description Get a list of all radar stations. Only users with ADMIN role can perform this action.
// @Tags stations
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {array} models.Station "List of stations"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden - Admin access required"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stations [get]
func (h *StationHandler) ListStations(c *gin.Context) {
	// List all stations using service
	stations, err := h.stationService.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to list stations"})
		return
	}

	c.JSON(http.StatusOK, stations)
}
