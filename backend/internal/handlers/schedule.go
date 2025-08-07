package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/services"
)

type ScheduleHandler struct {
	scheduleService *services.ScheduleService
	stationService  *services.StationService
}

func NewScheduleHandler(scheduleService *services.ScheduleService, stationService *services.StationService) *ScheduleHandler {
	return &ScheduleHandler{
		scheduleService: scheduleService,
		stationService:  stationService,
	}
}

// CreateScheduleRequest represents the request for creating a schedule
type CreateScheduleRequest struct {
	StartHHMM string `json:"start_hhmm" binding:"required"`
	EndHHMM   string `json:"end_hhmm" binding:"required"`
	Commander string `json:"commander"`
	Crew      string `json:"crew"`
	Phone     string `json:"phone"`
}

// UpdateScheduleRequest represents the request for updating a schedule
type UpdateScheduleRequest struct {
	StartHHMM string `json:"start_hhmm"`
	EndHHMM   string `json:"end_hhmm"`
	Commander string `json:"commander"`
	Crew      string `json:"crew"`
	Phone     string `json:"phone"`
}

// CreateSchedule creates a new schedule
// @Summary Create a new schedule
// @Description Create a new schedule for a station (Operator only)
// @Tags schedules
// @Accept json
// @Produce json
// @Param station_id path int true "Station ID"
// @Param schedule body CreateScheduleRequest true "Schedule data"
// @Security BearerAuth
// @Success 201 {object} models.Schedule
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /station-schedules/station/{station_id} [post]
func (h *ScheduleHandler) CreateSchedule(c *gin.Context) {
	stationIDStr := c.Param("station_id")
	stationID, err := strconv.ParseUint(stationIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid station ID"})
		return
	}

	var req CreateScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request format"})
		return
	}

	// Validate that the station exists
	_, err = h.stationService.GetByID(uint(stationID))
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Station not found"})
		return
	}

	// Validate time format (HHMM)
	if !isValidHHMM(req.StartHHMM) || !isValidHHMM(req.EndHHMM) {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid time format. Use HHMM format (e.g., 0130, 1445)"})
		return
	}

	schedule := &models.Schedule{
		StationID: uint(stationID),
		StartHHMM: req.StartHHMM,
		EndHHMM:   req.EndHHMM,
		Commander: req.Commander,
		Crew:      req.Crew,
		Phone:     req.Phone,
	}

	if err := h.scheduleService.Create(schedule); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create schedule"})
		return
	}

	c.JSON(http.StatusCreated, schedule)
}

// ListSchedules lists all schedules for a station
// @Summary List schedules for a station
// @Description Get all schedules for a specific station (Operator only)
// @Tags schedules
// @Produce json
// @Param station_id path int true "Station ID"
// @Security BearerAuth
// @Success 200 {array} models.Schedule
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /station-schedules/station/{station_id} [get]
func (h *ScheduleHandler) ListSchedules(c *gin.Context) {
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

	schedules, err := h.scheduleService.ListByStation(uint(stationID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to retrieve schedules"})
		return
	}

	c.JSON(http.StatusOK, schedules)
}

// GetSchedule retrieves a specific schedule
// @Summary Get a schedule by ID
// @Description Get a specific schedule by station ID and schedule ID (Operator only)
// @Tags schedules
// @Produce json
// @Param station_id path int true "Station ID"
// @Param schedule_id path int true "Schedule ID"
// @Security BearerAuth
// @Success 200 {object} models.Schedule
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /station-schedules/station/{station_id}/{schedule_id} [get]
func (h *ScheduleHandler) GetSchedule(c *gin.Context) {
	stationIDStr := c.Param("station_id")
	scheduleIDStr := c.Param("schedule_id")

	stationID, err := strconv.ParseUint(stationIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid station ID"})
		return
	}

	scheduleID, err := strconv.ParseUint(scheduleIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid schedule ID"})
		return
	}

	schedule, err := h.scheduleService.GetByID(uint(stationID), uint(scheduleID))
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Schedule not found"})
		return
	}

	c.JSON(http.StatusOK, schedule)
}

// UpdateSchedule updates an existing schedule
// @Summary Update a schedule
// @Description Update an existing schedule by station ID and schedule ID (Operator only)
// @Tags schedules
// @Accept json
// @Produce json
// @Param station_id path int true "Station ID"
// @Param schedule_id path int true "Schedule ID"
// @Param schedule body UpdateScheduleRequest true "Updated schedule data"
// @Security BearerAuth
// @Success 200 {object} models.Schedule
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /station-schedules/station/{station_id}/{schedule_id} [put]
func (h *ScheduleHandler) UpdateSchedule(c *gin.Context) {
	stationIDStr := c.Param("station_id")
	scheduleIDStr := c.Param("schedule_id")

	stationID, err := strconv.ParseUint(stationIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid station ID"})
		return
	}

	scheduleID, err := strconv.ParseUint(scheduleIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid schedule ID"})
		return
	}

	var req UpdateScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request format"})
		return
	}

	// Validate time format if provided
	if req.StartHHMM != "" && !isValidHHMM(req.StartHHMM) {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid start time format. Use HHMM format (e.g., 0130, 1445)"})
		return
	}
	if req.EndHHMM != "" && !isValidHHMM(req.EndHHMM) {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid end time format. Use HHMM format (e.g., 0130, 1445)"})
		return
	}

	// Convert request to map for partial update
	updates := make(map[string]interface{})
	if req.StartHHMM != "" {
		updates["start_hhmm"] = req.StartHHMM
	}
	if req.EndHHMM != "" {
		updates["end_hhmm"] = req.EndHHMM
	}
	if req.Commander != "" {
		updates["commander"] = req.Commander
	}
	if req.Crew != "" {
		updates["crew"] = req.Crew
	}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}

	schedule, err := h.scheduleService.UpdatePartial(uint(stationID), uint(scheduleID), updates)
	if err != nil {
		if err.Error() == "schedule not found" {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Schedule not found"})
		} else {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update schedule"})
		}
		return
	}

	c.JSON(http.StatusOK, schedule)
}

// DeleteSchedule deletes a schedule
// @Summary Delete a schedule
// @Description Delete a schedule by station ID and schedule ID (Operator only)
// @Tags schedules
// @Param station_id path int true "Station ID"
// @Param schedule_id path int true "Schedule ID"
// @Security BearerAuth
// @Success 204
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /station-schedules/station/{station_id}/{schedule_id} [delete]
func (h *ScheduleHandler) DeleteSchedule(c *gin.Context) {
	stationIDStr := c.Param("station_id")
	scheduleIDStr := c.Param("schedule_id")

	stationID, err := strconv.ParseUint(stationIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid station ID"})
		return
	}

	scheduleID, err := strconv.ParseUint(scheduleIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid schedule ID"})
		return
	}

	// Check if schedule exists
	_, err = h.scheduleService.GetByID(uint(stationID), uint(scheduleID))
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Schedule not found"})
		return
	}

	if err := h.scheduleService.Delete(uint(stationID), uint(scheduleID)); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete schedule"})
		return
	}

	c.Status(http.StatusNoContent)
}

// isValidHHMM validates HHMM format (e.g., "0130", "1445")
func isValidHHMM(timeStr string) bool {
	if len(timeStr) != 4 {
		return false
	}

	// Check if all characters are digits
	for _, char := range timeStr {
		if char < '0' || char > '9' {
			return false
		}
	}

	// Extract hours and minutes
	hours := timeStr[:2]
	minutes := timeStr[2:]

	// Validate hours (00-23)
	h, err := strconv.Atoi(hours)
	if err != nil || h < 0 || h > 23 {
		return false
	}

	// Validate minutes (00-59)
	m, err := strconv.Atoi(minutes)
	if err != nil || m < 0 || m > 59 {
		return false
	}

	return true
}
