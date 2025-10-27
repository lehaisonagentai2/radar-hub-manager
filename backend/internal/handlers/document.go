package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/services"
)

type DocumentHandler struct {
	documentService   *services.DocumentService
	fileUploadService *services.FileUploadService
}

func NewDocumentHandler(documentService *services.DocumentService, fileUploadService *services.FileUploadService) *DocumentHandler {
	return &DocumentHandler{
		documentService:   documentService,
		fileUploadService: fileUploadService,
	}
}

// UploadFile godoc
// @Summary Upload a file
// @Description Upload a file and return the file URL
// @Tags files
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "File to upload"
// @Success 200 {object} services.UploadResult
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security ApiKeyAuth
// @Router /files/upload [post]
func (h *DocumentHandler) UploadFile(c *gin.Context) {
	// Get the file from the request
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "No file provided",
		})
		return
	}

	// Upload the file
	result, err := h.fileUploadService.UploadFile(file)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Upload Failed",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "File uploaded successfully",
		"data":    result,
	})
}

// CreateDocument godoc
// @Summary Create a new document
// @Description Create a new document record
// @Tags documents
// @Accept json
// @Produce json
// @Param document body CreateDocumentRequest true "Document data"
// @Success 201 {object} models.Document
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security ApiKeyAuth
// @Router /documents [post]
func (h *DocumentHandler) CreateDocument(c *gin.Context) {
	var req CreateDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	// Get user ID from context (set by JWT middleware)
	userIF, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "User ID not found in context",
		})
		return
	}

	user, ok := userIF.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Invalid user ID format",
		})
		return
	}

	document := &models.Document{
		Title:       req.Title,
		Description: req.Description,
		FileUrl:     req.FileUrl,
		FileName:    req.FileName,
		FileSize:    req.FileSize,
		FileType:    req.FileType,
		UploadedBy:  user.ID,
	}

	if err := h.documentService.Create(document); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to create document",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Document created successfully",
		"data":    document,
	})
}

// ListDocuments godoc
// @Summary Get all documents
// @Description Get a list of all documents
// @Tags documents
// @Produce json
// @Success 200 {array} models.Document
// @Failure 500 {object} map[string]interface{}
// @Security ApiKeyAuth
// @Router /documents [get]
func (h *DocumentHandler) ListDocuments(c *gin.Context) {
	documents, err := h.documentService.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to retrieve documents",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Documents retrieved successfully",
		"data":    documents,
	})
}

// GetDocument godoc
// @Summary Get a document by ID
// @Description Get a document by its ID
// @Tags documents
// @Produce json
// @Param id path int true "Document ID"
// @Success 200 {object} models.Document
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security ApiKeyAuth
// @Router /documents/{id} [get]
func (h *DocumentHandler) GetDocument(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Invalid document ID",
		})
		return
	}

	document, err := h.documentService.GetByID(uint(id))
	if err != nil {
		if err.Error() == "document not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Not Found",
				"message": "Document not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to retrieve document",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Document retrieved successfully",
		"data":    document,
	})
}

// UpdateDocument godoc
// @Summary Update a document
// @Description Update a document by ID
// @Tags documents
// @Accept json
// @Produce json
// @Param id path int true "Document ID"
// @Param document body UpdateDocumentRequest true "Document data"
// @Success 200 {object} models.Document
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security ApiKeyAuth
// @Router /documents/{id} [put]
func (h *DocumentHandler) UpdateDocument(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Invalid document ID",
		})
		return
	}

	var req UpdateDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	// Get existing document
	document, err := h.documentService.GetByID(uint(id))
	if err != nil {
		if err.Error() == "document not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Not Found",
				"message": "Document not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to retrieve document",
		})
		return
	}

	// Update fields
	if req.Title != "" {
		document.Title = req.Title
	}
	if req.Description != nil {
		document.Description = *req.Description
	}
	if req.FileUrl != "" {
		document.FileUrl = req.FileUrl
	}
	if req.FileName != "" {
		document.FileName = req.FileName
	}
	if req.FileSize > 0 {
		document.FileSize = req.FileSize
	}
	if req.FileType != "" {
		document.FileType = req.FileType
	}

	if err := h.documentService.Update(document); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to update document",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Document updated successfully",
		"data":    document,
	})
}

// DeleteDocument godoc
// @Summary Delete a document
// @Description Delete a document by ID
// @Tags documents
// @Produce json
// @Param id path int true "Document ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security ApiKeyAuth
// @Router /documents/{id} [delete]
func (h *DocumentHandler) DeleteDocument(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Invalid document ID",
		})
		return
	}

	// Get document to delete associated file
	document, err := h.documentService.GetByID(uint(id))
	if err != nil {
		if err.Error() == "document not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Not Found",
				"message": "Document not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to retrieve document",
		})
		return
	}

	// Delete from database
	if err := h.documentService.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to delete document",
		})
		return
	}

	// Delete associated file (optional - log error but don't fail the request)
	if document.FileUrl != "" {
		if err := h.fileUploadService.DeleteFile(document.FileUrl); err != nil {
			// Log error but don't fail the request
			// In a real application, you might want to use a proper logger
			// log.Printf("Failed to delete file %s: %v", document.FileUrl, err)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Document deleted successfully",
	})
}

// Request/Response models
type CreateDocumentRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	FileUrl     string `json:"file_url" binding:"required"`
	FileName    string `json:"file_name" binding:"required"`
	FileSize    int64  `json:"file_size" binding:"required"`
	FileType    string `json:"file_type" binding:"required"`
}

type UpdateDocumentRequest struct {
	Title       string  `json:"title"`
	Description *string `json:"description"`
	FileUrl     string  `json:"file_url"`
	FileName    string  `json:"file_name"`
	FileSize    int64   `json:"file_size"`
	FileType    string  `json:"file_type"`
}
