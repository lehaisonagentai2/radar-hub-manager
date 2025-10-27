package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
)

type DocumentService struct {
	db *DB
}

func NewDocumentService(db *DB) *DocumentService {
	return &DocumentService{db: db}
}

func (s *DocumentService) Create(document *models.Document) error {
	// Get next ID
	id, err := s.getNextID()
	if err != nil {
		return fmt.Errorf("failed to generate ID: %w", err)
	}

	document.ID = id
	document.CreatedAt = time.Now().Unix()
	document.UpdatedAt = document.CreatedAt

	// Store document
	key := fmt.Sprintf("document:%d", document.ID)
	return s.db.PutJSON(key, document)
}

func (s *DocumentService) GetByID(id uint) (*models.Document, error) {
	key := fmt.Sprintf("document:%d", id)
	var document models.Document

	if err := s.db.GetJSON(key, &document); err != nil {
		if errors.Is(err, ErrNotFound) {
			return nil, errors.New("document not found")
		}
		return nil, fmt.Errorf("failed to get document: %w", err)
	}

	return &document, nil
}

func (s *DocumentService) List() ([]*models.Document, error) {
	var documents []*models.Document

	err := s.db.IteratePrefix("document:", func(key string, val []byte) error {
		var document models.Document
		if err := s.db.GetJSON(key, &document); err != nil {
			return nil // Skip invalid records
		}
		documents = append(documents, &document)
		return nil
	})

	return documents, err
}

func (s *DocumentService) Update(document *models.Document) error {
	// Check if document exists
	_, err := s.GetByID(document.ID)
	if err != nil {
		return err
	}

	document.UpdatedAt = time.Now().Unix()

	key := fmt.Sprintf("document:%d", document.ID)
	return s.db.PutJSON(key, document)
}

func (s *DocumentService) Delete(id uint) error {
	// Check if document exists
	_, err := s.GetByID(id)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("document:%d", id)
	return s.db.Delete(key)
}

func (s *DocumentService) getNextID() (uint, error) {
	key := "document_counter"
	var counter int

	if err := s.db.GetJSON(key, &counter); err != nil {
		if errors.Is(err, ErrNotFound) {
			// Initialize counter
			counter = 1
			if err := s.db.PutJSON(key, counter); err != nil {
				return 0, err
			}
			return 1, nil
		}
		return 0, err
	}

	nextID := counter + 1
	if err := s.db.PutJSON(key, nextID); err != nil {
		return 0, err
	}

	return uint(nextID), nil
}
