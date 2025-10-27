package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
)

type VesselService struct {
	db *DB
}

func NewVesselService(db *DB) *VesselService {
	return &VesselService{db: db}
}

func (s *VesselService) Create(vessel *models.Vessel) error {
	// Validate required fields
	if vessel.Name == "" {
		return errors.New("vessel name is required")
	}
	if vessel.MMSI == "" {
		return errors.New("vessel MMSI is required")
	}

	// Check if MMSI already exists
	if exists, err := s.ExistsByMMSI(vessel.MMSI); err != nil {
		return fmt.Errorf("failed to check MMSI existence: %w", err)
	} else if exists {
		return errors.New("vessel with this MMSI already exists")
	}

	// Get next ID
	id, err := s.getNextID()
	if err != nil {
		return fmt.Errorf("failed to generate ID: %w", err)
	}

	vessel.ID = id
	vessel.CreatedAt = time.Now().Unix()
	vessel.UpdatedAt = vessel.CreatedAt

	// Store vessel
	key := fmt.Sprintf("vessel:%d", vessel.ID)
	if err := s.db.PutJSON(key, vessel); err != nil {
		return fmt.Errorf("failed to store vessel: %w", err)
	}

	// Create MMSI index
	mmsiKey := fmt.Sprintf("vessel_mmsi:%s", vessel.MMSI)
	if err := s.db.PutJSON(mmsiKey, vessel.ID); err != nil {
		return fmt.Errorf("failed to create MMSI index: %w", err)
	}

	// Create name index (lowercase for case-insensitive search)
	nameKey := fmt.Sprintf("vessel_name:%s", strings.ToLower(vessel.Name))
	if err := s.db.PutJSON(nameKey, vessel.ID); err != nil {
		return fmt.Errorf("failed to create name index: %w", err)
	}

	return nil
}

func (s *VesselService) GetByID(id uint) (*models.Vessel, error) {
	key := fmt.Sprintf("vessel:%d", id)
	var vessel models.Vessel

	if err := s.db.GetJSON(key, &vessel); err != nil {
		if errors.Is(err, ErrNotFound) {
			return nil, errors.New("vessel not found")
		}
		return nil, fmt.Errorf("failed to get vessel: %w", err)
	}

	return &vessel, nil
}

func (s *VesselService) GetByMMSI(mmsi string) (*models.Vessel, error) {
	mmsiKey := fmt.Sprintf("vessel_mmsi:%s", mmsi)
	var vesselID uint

	if err := s.db.GetJSON(mmsiKey, &vesselID); err != nil {
		if errors.Is(err, ErrNotFound) {
			return nil, errors.New("vessel not found")
		}
		return nil, fmt.Errorf("failed to get vessel by MMSI: %w", err)
	}

	return s.GetByID(vesselID)
}

func (s *VesselService) SearchByName(name string) ([]*models.Vessel, error) {
	var vessels []*models.Vessel
	searchName := strings.ToLower(name)

	err := s.db.IteratePrefix("vessel_name:", func(key string, val []byte) error {
		// Extract the name from the key
		keyName := strings.TrimPrefix(key, "vessel_name:")

		// Check if the name contains the search term
		if strings.Contains(keyName, searchName) {
			var vesselID uint
			if err := s.db.GetJSON(key, &vesselID); err != nil {
				return nil // Skip invalid records
			}

			vessel, err := s.GetByID(vesselID)
			if err != nil {
				return nil // Skip if vessel not found
			}

			vessels = append(vessels, vessel)
		}

		return nil
	})

	return vessels, err
}

func (s *VesselService) List() ([]*models.Vessel, error) {
	var vessels []*models.Vessel

	err := s.db.IteratePrefix("vessel:", func(key string, val []byte) error {
		var vessel models.Vessel
		if err := s.db.GetJSON(key, &vessel); err != nil {
			return nil // Skip invalid records
		}
		vessels = append(vessels, &vessel)
		return nil
	})

	return vessels, err
}

func (s *VesselService) Update(vessel *models.Vessel) error {
	// Validate required fields
	if vessel.Name == "" {
		return errors.New("vessel name is required")
	}
	if vessel.MMSI == "" {
		return errors.New("vessel MMSI is required")
	}

	// Get existing vessel
	existing, err := s.GetByID(vessel.ID)
	if err != nil {
		return err
	}

	// Check if MMSI changed and if new MMSI already exists
	if existing.MMSI != vessel.MMSI {
		if exists, err := s.ExistsByMMSI(vessel.MMSI); err != nil {
			return fmt.Errorf("failed to check MMSI existence: %w", err)
		} else if exists {
			return errors.New("vessel with this MMSI already exists")
		}

		// Remove old MMSI index
		oldMMSIKey := fmt.Sprintf("vessel_mmsi:%s", existing.MMSI)
		s.db.Delete(oldMMSIKey) // Ignore error

		// Create new MMSI index
		newMMSIKey := fmt.Sprintf("vessel_mmsi:%s", vessel.MMSI)
		if err := s.db.PutJSON(newMMSIKey, vessel.ID); err != nil {
			return fmt.Errorf("failed to create new MMSI index: %w", err)
		}
	}

	// Update name index if name changed
	if !strings.EqualFold(existing.Name, vessel.Name) {
		// Remove old name index
		oldNameKey := fmt.Sprintf("vessel_name:%s", strings.ToLower(existing.Name))
		s.db.Delete(oldNameKey) // Ignore error

		// Create new name index
		newNameKey := fmt.Sprintf("vessel_name:%s", strings.ToLower(vessel.Name))
		if err := s.db.PutJSON(newNameKey, vessel.ID); err != nil {
			return fmt.Errorf("failed to create new name index: %w", err)
		}
	}

	vessel.UpdatedAt = time.Now().Unix()

	key := fmt.Sprintf("vessel:%d", vessel.ID)
	return s.db.PutJSON(key, vessel)
}

func (s *VesselService) Delete(id uint) error {
	// Get existing vessel to clean up indexes
	vessel, err := s.GetByID(id)
	if err != nil {
		return err
	}

	// Delete vessel
	key := fmt.Sprintf("vessel:%d", id)
	if err := s.db.Delete(key); err != nil {
		return fmt.Errorf("failed to delete vessel: %w", err)
	}

	// Clean up MMSI index
	mmsiKey := fmt.Sprintf("vessel_mmsi:%s", vessel.MMSI)
	s.db.Delete(mmsiKey) // Ignore error

	// Clean up name index
	nameKey := fmt.Sprintf("vessel_name:%s", strings.ToLower(vessel.Name))
	s.db.Delete(nameKey) // Ignore error

	return nil
}

func (s *VesselService) ExistsByMMSI(mmsi string) (bool, error) {
	mmsiKey := fmt.Sprintf("vessel_mmsi:%s", mmsi)
	return s.db.Exists(mmsiKey)
}

func (s *VesselService) getNextID() (uint, error) {
	key := "vessel_counter"
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
