package services

import (
	"encoding/json"
	"fmt"
	"sync/atomic"

	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
)

// ──────────────────────────────────────────────────────────────────────────────
// UserService
// ──────────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────────
// StationService
// ──────────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────────
// ScheduleService
// ──────────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────────
// CommandService
// ──────────────────────────────────────────────────────────────────────────────

type CommandService struct {
	db  *DB
	seq uint64
}

func NewCommandService(db *DB) *CommandService { return &CommandService{db: db} }

func (s *CommandService) NextID() uint { return uint(atomic.AddUint64(&s.seq, 1)) }

func (s *CommandService) Save(cmd *models.Command) error {
	key := fmt.Sprintf("command:%d", cmd.ID)
	return s.db.PutJSON(key, cmd)
}

func (s *CommandService) Acknowledge(id uint, ts int64) error {
	key := fmt.Sprintf("command:%d", id)
	var cmd models.Command
	if err := s.db.GetJSON(key, &cmd); err != nil {
		return err
	}
	cmd.AcknowledgedAt = &ts
	return s.db.PutJSON(key, &cmd)
}

func (s *CommandService) ListUnack(stID uint) ([]models.Command, error) {
	var out []models.Command
	err := s.db.IteratePrefix("command:", func(_ string, val []byte) error {
		var cmd models.Command
		if err := json.Unmarshal(val, &cmd); err != nil {
			return err
		}
		if cmd.ToStationID == stID && cmd.AcknowledgedAt == nil {
			out = append(out, cmd)
		}
		return nil
	})
	return out, err
}
