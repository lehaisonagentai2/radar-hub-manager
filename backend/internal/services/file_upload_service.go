package services

import (
	"crypto/md5"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type FileUploadService struct {
	uploadDir string
	baseURL   string
}

func NewFileUploadService(uploadDir string, baseURL string) *FileUploadService {
	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		panic(fmt.Sprintf("Failed to create upload directory: %v", err))
	}

	return &FileUploadService{
		uploadDir: uploadDir,
		baseURL:   baseURL,
	}
}

type UploadResult struct {
	FileURL  string `json:"file_url"`
	FileName string `json:"file_name"`
	FileSize int64  `json:"file_size"`
	FileType string `json:"file_type"`
}

func (s *FileUploadService) UploadFile(file *multipart.FileHeader) (*UploadResult, error) {
	// Open the uploaded file
	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer src.Close()

	// Validate file size (max 50MB)
	const maxFileSize = 50 * 1024 * 1024 // 50MB
	if file.Size > maxFileSize {
		return nil, fmt.Errorf("file size exceeds maximum allowed size of 50MB")
	}

	// Validate file type
	if !s.isAllowedFileType(file.Filename) {
		return nil, fmt.Errorf("file type not allowed")
	}

	// Generate unique filename
	uniqueFilename, err := s.generateUniqueFilename(file.Filename)
	if err != nil {
		return nil, fmt.Errorf("failed to generate unique filename: %w", err)
	}

	// Create the destination file
	destPath := filepath.Join(s.uploadDir, uniqueFilename)
	dst, err := os.Create(destPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create destination file: %w", err)
	}
	defer dst.Close()

	// Copy the uploaded file to the destination
	fileSize, err := io.Copy(dst, src)
	if err != nil {
		return nil, fmt.Errorf("failed to copy file: %w", err)
	}

	// Generate file URL
	fileURL := fmt.Sprintf("%s/uploads/%s", strings.TrimRight(s.baseURL, "/"), uniqueFilename)

	return &UploadResult{
		FileURL:  fileURL,
		FileName: file.Filename,
		FileSize: fileSize,
		FileType: s.getContentType(file.Filename),
	}, nil
}

func (s *FileUploadService) DeleteFile(fileURL string) error {
	// Extract filename from URL
	parts := strings.Split(fileURL, "/")
	if len(parts) == 0 {
		return fmt.Errorf("invalid file URL")
	}

	filename := parts[len(parts)-1]
	filePath := filepath.Join(s.uploadDir, filename)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return fmt.Errorf("file not found")
	}

	// Delete the file
	return os.Remove(filePath)
}

func (s *FileUploadService) generateUniqueFilename(originalFilename string) (string, error) {
	ext := filepath.Ext(originalFilename)
	baseName := strings.TrimSuffix(originalFilename, ext)

	// Create a hash based on current time and original filename
	hash := md5.New()
	timestamp := time.Now().UnixNano()

	_, err := hash.Write([]byte(fmt.Sprintf("%s_%d", baseName, timestamp)))
	if err != nil {
		return "", err
	}

	hashString := fmt.Sprintf("%x", hash.Sum(nil))
	return fmt.Sprintf("%s_%s%s", baseName, hashString[:8], ext), nil
}

func (s *FileUploadService) isAllowedFileType(filename string) bool {
	allowedExtensions := []string{
		".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
		".txt", ".rtf", ".csv",
		".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff",
		".zip", ".rar", ".7z",
		".mp4", ".avi", ".mov", ".wmv", ".flv",
		".mp3", ".wav", ".flac", ".aac",
	}

	ext := strings.ToLower(filepath.Ext(filename))
	for _, allowedExt := range allowedExtensions {
		if ext == allowedExt {
			return true
		}
	}
	return false
}

func (s *FileUploadService) getContentType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))

	contentTypes := map[string]string{
		".pdf":  "application/pdf",
		".doc":  "application/msword",
		".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		".xls":  "application/vnd.ms-excel",
		".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		".ppt":  "application/vnd.ms-powerpoint",
		".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		".txt":  "text/plain",
		".rtf":  "application/rtf",
		".csv":  "text/csv",
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".png":  "image/png",
		".gif":  "image/gif",
		".bmp":  "image/bmp",
		".tiff": "image/tiff",
		".zip":  "application/zip",
		".rar":  "application/x-rar-compressed",
		".7z":   "application/x-7z-compressed",
		".mp4":  "video/mp4",
		".avi":  "video/x-msvideo",
		".mov":  "video/quicktime",
		".wmv":  "video/x-ms-wmv",
		".flv":  "video/x-flv",
		".mp3":  "audio/mpeg",
		".wav":  "audio/wav",
		".flac": "audio/flac",
		".aac":  "audio/aac",
	}

	if contentType, ok := contentTypes[ext]; ok {
		return contentType
	}

	return "application/octet-stream"
}
