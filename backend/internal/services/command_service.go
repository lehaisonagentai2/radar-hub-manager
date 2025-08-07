package services

import (
	"encoding/json"
	"fmt"
	"sync/atomic"
	"time"

	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
)

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

// Create creates a new command
func (s *CommandService) Create(cmd *models.Command) error {
	cmd.ID = s.NextID()
	cmd.CreatedAt = time.Now().Unix()
	cmd.SentAt = cmd.CreatedAt
	key := fmt.Sprintf("command:%d", cmd.ID)
	return s.db.PutJSON(key, cmd)
}

// GetByID retrieves a command by ID
func (s *CommandService) GetByID(id uint) (*models.Command, error) {
	var cmd models.Command
	key := fmt.Sprintf("command:%d", id)
	if err := s.db.GetJSON(key, &cmd); err != nil {
		return nil, fmt.Errorf("command not found")
	}
	return &cmd, nil
}

// ListByStation lists all commands for a specific station
func (s *CommandService) ListByStation(stationID uint) ([]models.Command, error) {
	var commands []models.Command
	err := s.db.IteratePrefix("command:", func(_ string, val []byte) error {
		var cmd models.Command
		if err := json.Unmarshal(val, &cmd); err != nil {
			return err
		}
		if cmd.ToStationID == stationID {
			commands = append(commands, cmd)
		}
		return nil
	})
	return commands, err
}

// ListAll lists all commands
func (s *CommandService) ListAll() ([]models.Command, error) {
	var commands []models.Command
	err := s.db.IteratePrefix("command:", func(_ string, val []byte) error {
		var cmd models.Command
		if err := json.Unmarshal(val, &cmd); err != nil {
			return err
		}
		commands = append(commands, cmd)
		return nil
	})
	return commands, err
}

func (s *CommandService) Acknowledge(id uint, ts int64) error {
	key := fmt.Sprintf("command:%d", id)
	var cmd models.Command
	if err := s.db.GetJSON(key, &cmd); err != nil {
		return fmt.Errorf("command not found")
	}
	cmd.AcknowledgedAt = &ts
	return s.db.PutJSON(key, &cmd)
}

// AcknowledgeCommand acknowledges a command with current timestamp
func (s *CommandService) AcknowledgeCommand(id uint) error {
	ts := time.Now().Unix()
	return s.Acknowledge(id, ts)
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
