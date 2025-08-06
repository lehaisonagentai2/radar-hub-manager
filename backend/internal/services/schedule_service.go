package services

import (
	"encoding/json"
	"fmt"
	"sync/atomic"
	"time"

	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
)

type ScheduleService struct {
	db  *DB
	seq uint64
}

func NewScheduleService(db *DB) *ScheduleService { return &ScheduleService{db: db} }

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
