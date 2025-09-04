package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"sync/atomic"
	"time"

	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
	"github.com/syndtr/goleveldb/leveldb/util"
)

type ScheduleService struct {
	db  *DB
	seq uint64
}

func NewScheduleService(db *DB) *ScheduleService {
	sv := &ScheduleService{db: db}
	lastID, err := sv.LastIDFromDB()
	if err == nil {
		sv.seq = uint64(lastID)
	}
	return sv
}

func (s *ScheduleService) nextID() uint {
	return uint(atomic.AddUint64(&s.seq, 1))
}

func (s *ScheduleService) CreateOrUpdate(sc *models.Schedule) error {
	if sc.ID == 0 {
		sc.ID = s.nextID()
		sc.CreatedAt = time.Now().Unix()
	}
	key := fmt.Sprintf("schedule:%d:%d", sc.StationID, sc.ID)
	sc.UpdatedAt = time.Now().Unix()
	return s.db.PutJSON(key, sc)
}

// Create creates a new schedule
func (s *ScheduleService) Create(sc *models.Schedule) error {
	sc.ID = s.nextID()
	sc.CreatedAt = time.Now().Unix()
	sc.UpdatedAt = sc.CreatedAt
	key := fmt.Sprintf("schedule:%d:%d", sc.StationID, sc.ID)
	return s.db.PutJSON(key, sc)
}

// GetByID retrieves a schedule by station ID and schedule ID
func (s *ScheduleService) GetByID(stationID, scheduleID uint) (*models.Schedule, error) {
	var schedule models.Schedule
	key := fmt.Sprintf("schedule:%d:%d", stationID, scheduleID)
	if err := s.db.GetJSON(key, &schedule); err != nil {
		return nil, fmt.Errorf("schedule not found")
	}
	return &schedule, nil
}

// Update updates an existing schedule
func (s *ScheduleService) Update(sc *models.Schedule) error {
	// Check if schedule exists
	existing, err := s.GetByID(sc.StationID, sc.ID)
	if err != nil {
		return fmt.Errorf("schedule not found")
	}

	// Preserve creation time
	sc.CreatedAt = existing.CreatedAt
	sc.UpdatedAt = time.Now().Unix()

	key := fmt.Sprintf("schedule:%d:%d", sc.StationID, sc.ID)
	return s.db.PutJSON(key, sc)
}

// UpdatePartial updates a schedule with partial data
func (s *ScheduleService) UpdatePartial(stationID, scheduleID uint, updates map[string]interface{}) (*models.Schedule, error) {
	// Get existing schedule
	schedule, err := s.GetByID(stationID, scheduleID)
	if err != nil {
		return nil, fmt.Errorf("schedule not found")
	}

	// Apply updates
	if startHHMM, ok := updates["start_hhmm"].(string); ok && startHHMM != "" {
		schedule.StartHHMM = startHHMM
	}
	if endHHMM, ok := updates["end_hhmm"].(string); ok && endHHMM != "" {
		schedule.EndHHMM = endHHMM
	}
	if commander, ok := updates["commander"].(string); ok {
		schedule.Commander = commander
	}
	if crew, ok := updates["crew"].(string); ok {
		schedule.Crew = crew
	}
	if phone, ok := updates["phone"].(string); ok {
		schedule.Phone = phone
	}

	schedule.UpdatedAt = time.Now().Unix()

	// Save updated schedule
	key := fmt.Sprintf("schedule:%d:%d", schedule.StationID, schedule.ID)
	err = s.db.PutJSON(key, schedule)
	if err != nil {
		return nil, err
	}

	return schedule, nil
}

func (s *ScheduleService) Delete(stationID, scheduleID uint) error {
	key := fmt.Sprintf("schedule:%d:%d", stationID, scheduleID)
	return s.db.Delete(key)
}

func (s *ScheduleService) ListByStation(stID uint) ([]models.Schedule, error) {
	prefix := fmt.Sprintf("schedule:%d:", stID)
	var list []models.Schedule
	err := s.db.IteratePrefix(prefix, func(_ string, val []byte) error {
		var sc models.Schedule
		if err := json.Unmarshal(val, &sc); err != nil {
			return err
		}
		list = append(list, sc)
		return nil
	})
	return list, err
}

// IsStationActiveNow returns true if current local time UTC+7 within any interval.
func (s *ScheduleService) IsStationActiveNow(stID uint) (bool, error) {
	list, err := s.ListByStation(stID)
	if err != nil {
		return false, err
	}
	now := time.Now().In(time.FixedZone("UTC+7", 7*3600))
	hhmm := now.Format("1504")
	for _, sc := range list {
		if betweenHHMM(hhmm, sc.StartHHMM, sc.EndHHMM) {
			return true, nil
		}
	}
	return false, nil
}

func betweenHHMM(t, start, end string) bool {
	if start <= end {
		return t >= start && t < end
	}
	return t >= start || t < end // overnight
}

func (s *ScheduleService) LastIDFromDB() (uint, error) {
	var lastID uint
	iter := s.db.NewIterator(util.BytesPrefix([]byte("schedule:")), nil)
	defer iter.Release()

	for iter.Next() {
		var schedule models.Schedule
		err := json.Unmarshal(iter.Value(), &schedule)
		if err != nil {
			continue // Skip invalid entries
		}
		if schedule.ID > lastID {
			lastID = schedule.ID
		}
	}

	if lastID == 0 {
		return 0, errors.New("no schedules found")
	}
	return lastID, nil
}
