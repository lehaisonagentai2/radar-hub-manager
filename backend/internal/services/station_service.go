package services

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
)

type StationService struct {
	db       *DB
	schedSvc *ScheduleService
}

func NewStationService(db *DB, sched *ScheduleService) *StationService {
	return &StationService{db: db, schedSvc: sched}
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
	station.CreatedAt = time.Now().Unix()
	station.UpdatedAt = station.CreatedAt
	key := fmt.Sprintf("station:%d", station.ID)
	return s.db.PutJSON(key, station)
}

func (s *StationService) Update(station *models.Station) error {
	key := fmt.Sprintf("station:%d", station.ID)
	var existingStation models.Station
	if err := s.db.GetJSON(key, &existingStation); err != nil {
		return err
	}

	station.CreatedAt = existingStation.CreatedAt
	station.UpdatedAt = time.Now().Unix()
	return s.db.PutJSON(key, station)
}

func (s *StationService) Delete(id uint) error {
	key := fmt.Sprintf("station:%d", id)
	return s.db.Delete(key)
}

func (s *StationService) GetByID(id uint) (*models.Station, error) {
	var station models.Station
	key := fmt.Sprintf("station:%d", id)
	if err := s.db.GetJSON(key, &station); err != nil {
		return nil, err
	}
	return &station, nil
}
