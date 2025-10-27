package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/services"
)

type VesselHandler struct {
	vesselService *services.VesselService
}

func NewVesselHandler(vesselService *services.VesselService) *VesselHandler {
	return &VesselHandler{
		vesselService: vesselService,
	}
}

// CreateVessel godoc
// @Summary Create a new vessel
// @Description Create a new vessel record
// @Tags vessels
// @Accept json
// @Produce json
// @Param vessel body CreateVesselRequest true "Vessel data"
// @Success 201 {object} models.Vessel
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security ApiKeyAuth
// @Router /vessels [post]
func (h *VesselHandler) CreateVessel(c *gin.Context) {
	var req CreateVesselRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	vessel := &models.Vessel{
		Name:        req.Name,
		MMSI:        req.MMSI,
		Kind:        req.Kind,
		Size:        req.Size,
		Weight:      req.Weight,
		Class:       req.Class,
		Specs:       req.Specs,
		MaxSpeed:    req.MaxSpeed,
		Description: req.Description,
	}

	if err := h.vesselService.Create(vessel); err != nil {
		if err.Error() == "vessel with this MMSI already exists" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Bad Request",
				"message": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to create vessel",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Vessel created successfully",
		"data":    vessel,
	})
}

// ListVessels godoc
// @Summary Get all vessels or search by name
// @Description Get a list of all vessels or search by name
// @Tags vessels
// @Produce json
// @Param name query string false "Search by vessel name (partial match)"
// @Success 200 {array} models.Vessel
// @Failure 500 {object} map[string]interface{}
// @Security ApiKeyAuth
// @Router /vessels [get]
func (h *VesselHandler) ListVessels(c *gin.Context) {
	name := c.Query("name")

	var vessels []*models.Vessel
	var err error

	if name != "" {
		// Search by name
		vessels, err = h.vesselService.SearchByName(name)
	} else {
		// List all vessels
		vessels, err = h.vesselService.List()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to retrieve vessels",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Vessels retrieved successfully",
		"data":    vessels,
	})
}

// GetVessel godoc
// @Summary Get a vessel by ID
// @Description Get a vessel by its ID
// @Tags vessels
// @Produce json
// @Param id path int true "Vessel ID"
// @Success 200 {object} models.Vessel
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security ApiKeyAuth
// @Router /vessels/{id} [get]
func (h *VesselHandler) GetVessel(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Invalid vessel ID",
		})
		return
	}

	vessel, err := h.vesselService.GetByID(uint(id))
	if err != nil {
		if err.Error() == "vessel not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Not Found",
				"message": "Vessel not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to retrieve vessel",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Vessel retrieved successfully",
		"data":    vessel,
	})
}

// GetVesselByMMSI godoc
// @Summary Get a vessel by MMSI
// @Description Get a vessel by its MMSI (Maritime Mobile Service Identity)
// @Tags vessels
// @Produce json
// @Param mmsi path string true "Vessel MMSI"
// @Success 200 {object} models.Vessel
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security ApiKeyAuth
// @Router /vessels/mmsi/{mmsi} [get]
func (h *VesselHandler) GetVesselByMMSI(c *gin.Context) {
	mmsi := c.Param("mmsi")
	if mmsi == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "MMSI is required",
		})
		return
	}

	vessel, err := h.vesselService.GetByMMSI(mmsi)
	if err != nil {
		if err.Error() == "vessel not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Not Found",
				"message": "Vessel not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to retrieve vessel",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Vessel retrieved successfully",
		"data":    vessel,
	})
}

// UpdateVessel godoc
// @Summary Update a vessel
// @Description Update a vessel by ID
// @Tags vessels
// @Accept json
// @Produce json
// @Param id path int true "Vessel ID"
// @Param vessel body UpdateVesselRequest true "Vessel data"
// @Success 200 {object} models.Vessel
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security ApiKeyAuth
// @Router /vessels/{id} [put]
func (h *VesselHandler) UpdateVessel(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Invalid vessel ID",
		})
		return
	}

	var req UpdateVesselRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	// Get existing vessel
	vessel, err := h.vesselService.GetByID(uint(id))
	if err != nil {
		if err.Error() == "vessel not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Not Found",
				"message": "Vessel not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to retrieve vessel",
		})
		return
	}

	// Update fields
	if req.Name != "" {
		vessel.Name = req.Name
	}
	if req.MMSI != "" {
		vessel.MMSI = req.MMSI
	}
	if req.Kind != nil {
		vessel.Kind = *req.Kind
	}
	if req.Size != nil {
		vessel.Size = *req.Size
	}
	if req.Weight != nil {
		vessel.Weight = *req.Weight
	}
	if req.Class != nil {
		vessel.Class = *req.Class
	}
	if req.Specs != nil {
		vessel.Specs = *req.Specs
	}
	if req.MaxSpeed != nil {
		vessel.MaxSpeed = *req.MaxSpeed
	}
	if req.Description != nil {
		vessel.Description = *req.Description
	}

	if err := h.vesselService.Update(vessel); err != nil {
		if err.Error() == "vessel with this MMSI already exists" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Bad Request",
				"message": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to update vessel",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Vessel updated successfully",
		"data":    vessel,
	})
}

// DeleteVessel godoc
// @Summary Delete a vessel
// @Description Delete a vessel by ID
// @Tags vessels
// @Produce json
// @Param id path int true "Vessel ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security ApiKeyAuth
// @Router /vessels/{id} [delete]
func (h *VesselHandler) DeleteVessel(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Invalid vessel ID",
		})
		return
	}

	if err := h.vesselService.Delete(uint(id)); err != nil {
		if err.Error() == "vessel not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Not Found",
				"message": "Vessel not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to delete vessel",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Vessel deleted successfully",
	})
}

// Request/Response models
type CreateVesselRequest struct {
	Name        string `json:"name" binding:"required"` // Tên tàu
	MMSI        string `json:"mmsi" binding:"required"` // Maritime Mobile Service Identity
	Kind        string `json:"kind"`                    // Loại tàu
	Size        string `json:"size"`                    // Kích cỡ tàu
	Weight      string `json:"weight"`                  // Trọng tải tàu
	Class       string `json:"class"`                   // Lớp tàu
	Specs       string `json:"specs"`                   // Thông số kỹ thuật
	MaxSpeed    string `json:"max_speed"`               // Tốc độ tối đa
	Description string `json:"description"`             // Mô tả thêm về tàu
}

type UpdateVesselRequest struct {
	Name        string  `json:"name"`        // Tên tàu
	MMSI        string  `json:"mmsi"`        // Maritime Mobile Service Identity
	Kind        *string `json:"kind"`        // Loại tàu
	Size        *string `json:"size"`        // Kích cỡ tàu
	Weight      *string `json:"weight"`      // Trọng tải tàu
	Class       *string `json:"class"`       // Lớp tàu
	Specs       *string `json:"specs"`       // Thông số kỹ thuật
	MaxSpeed    *string `json:"max_speed"`   // Tốc độ tối đa
	Description *string `json:"description"` // Mô tả thêm về tàu
}
