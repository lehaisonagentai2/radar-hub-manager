package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
	"github.com/syndtr/goleveldb/leveldb/util"
)

type StationService struct {
	db       *DB
	schedSvc *ScheduleService
	lastID   uint
}

func NewStationService(db *DB, sched *ScheduleService) *StationService {
	sv := &StationService{db: db, schedSvc: sched}
	lastID, err := sv.LastIDFromDB()
	if err == nil {
		sv.lastID = lastID
	}
	log.Println("Last station ID:", sv.lastID)
	return sv
}

func (s *StationService) ListWithStatus() ([]models.Station, error) {
	var out []models.Station
	err := s.db.IteratePrefix("station:", func(_ string, val []byte) error {
		var st models.Station
		if err := json.Unmarshal(val, &st); err != nil {
			return err
		}
		active, _ := s.schedSvc.IsStationActiveNow(st.ID)
		if active {
			st.Status = "ACTIVE"
		} else {
			st.Status = "INACTIVE"
		}
		out = append(out, st)
		return nil
	})
	return out, err
}

func (s *StationService) UpdateNote(id uint, note string) error {
	key := fmt.Sprintf("station:%d", id)
	var st models.Station
	if err := s.db.GetJSON(key, &st); err != nil {
		return err
	}
	st.Note = note
	st.UpdatedAt = time.Now().Unix()
	return s.db.PutJSON(key, &st)
}

func (s *StationService) Create(station *models.Station) error {
	// Generate a simple incremental ID if not provided
	if station.ID == 0 {
		station.ID = s.lastID + 1
		s.lastID = station.ID
		log.Println("Assigned new station ID:", station.ID)
	}

	// Check if station with this ID already exists
	key := fmt.Sprintf("station:%d", station.ID)
	exists, err := s.db.Exists(key)
	if err != nil {
		return err
	}
	if exists {
		return errors.New("station with this ID already exists")
	}

	station.CreatedAt = time.Now().Unix()
	station.UpdatedAt = station.CreatedAt
	return s.db.PutJSON(key, station)
}

func (s *StationService) Update(station *models.Station) error {
	key := fmt.Sprintf("station:%d", station.ID)
	var existingStation models.Station
	if err := s.db.GetJSON(key, &existingStation); err != nil {
		return errors.New("station not found")
	}

	station.CreatedAt = existingStation.CreatedAt
	station.UpdatedAt = time.Now().Unix()
	return s.db.PutJSON(key, station)
}

// UpdatePartial updates a station with partial data
func (s *StationService) UpdatePartial(id uint, updates map[string]interface{}) (*models.Station, error) {
	// Get existing station
	station, err := s.GetByID(id)
	if err != nil {
		return nil, errors.New("station not found")
	}

	// Apply updates
	if name, ok := updates["name"].(string); ok && name != "" {
		station.Name = name
	}
	if latitude, ok := updates["latitude"].(float64); ok {
		station.Latitude = latitude
	}
	if longitude, ok := updates["longitude"].(float64); ok {
		station.Longitude = longitude
	}
	if elevation, ok := updates["elevation"].(float64); ok {
		station.Elevation = elevation
	}
	if distanceToCoast, ok := updates["distance_to_coast"].(float64); ok {
		station.DistanceToCoast = distanceToCoast
	}
	if status, ok := updates["status"].(string); ok && status != "" {
		station.Status = status
	}
	if note, ok := updates["note"].(string); ok {
		station.Note = note
	}

	station.UpdatedAt = time.Now().Unix()

	// Save updated station
	key := fmt.Sprintf("station:%d", station.ID)
	err = s.db.PutJSON(key, station)
	if err != nil {
		return nil, err
	}

	return station, nil
}

func (s *StationService) Delete(id uint) error {
	// Check if station exists
	_, err := s.GetByID(id)
	if err != nil {
		return errors.New("station not found")
	}
	key := fmt.Sprintf("station:%d", id)
	return s.db.Delete(key)
}

func (s *StationService) GetByID(id uint) (*models.Station, error) {
	var station models.Station
	key := fmt.Sprintf("station:%d", id)
	if err := s.db.GetJSON(key, &station); err != nil {
		return nil, errors.New("station not found")
	}
	return &station, nil
}

// List retrieves all stations
func (s *StationService) List() ([]*models.Station, error) {
	var stations []*models.Station

	// Iterate through station keys
	iter := s.db.NewIterator(util.BytesPrefix([]byte("station:")), nil)
	defer iter.Release()

	for iter.Next() {
		var station models.Station
		err := json.Unmarshal(iter.Value(), &station)
		if err != nil {
			continue // Skip invalid entries
		}
		stations = append(stations, &station)
	}

	return stations, nil
}

func (s *StationService) LastIDFromDB() (uint, error) {
	var lastID uint
	iter := s.db.NewIterator(util.BytesPrefix([]byte("station:")), nil)
	defer iter.Release()

	for iter.Next() {
		var station models.Station
		err := json.Unmarshal(iter.Value(), &station)
		if err != nil {
			continue // Skip invalid entries
		}
		if station.ID > lastID {
			lastID = station.ID
		}
	}

	if lastID == 0 {
		return 0, errors.New("no stations found")
	}
	return lastID, nil
}
