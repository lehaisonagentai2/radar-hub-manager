package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"sync/atomic"
	"time"

	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
	"github.com/syndtr/goleveldb/leveldb/util"
)

type RoleService struct {
	db  *DB
	seq uint64
}

func NewRoleService(db *DB) *RoleService {
	sv := &RoleService{db: db}
	lastID, err := sv.LastIDFromDB()
	if err == nil {
		sv.seq = uint64(lastID)
	}
	log.Println("Last role ID:", sv.seq)
	return sv
}

func (s *RoleService) NextID() uint {
	return uint(atomic.AddUint64(&s.seq, 1))
}

func (s *RoleService) Create(role *models.Role) error {
	role.ID = s.NextID()
	role.CreatedAt = time.Now().Unix()
	role.UpdatedAt = role.CreatedAt
	key := fmt.Sprintf("role:%d", role.ID)
	return s.db.PutJSON(key, role)
}

func (s *RoleService) Get(id uint) (*models.Role, error) {
	key := fmt.Sprintf("role:%d", id)
	var role models.Role
	if err := s.db.GetJSON(key, &role); err != nil {
		return nil, err
	}
	return &role, nil
}

func (s *RoleService) Update(role *models.Role) error {
	key := fmt.Sprintf("role:%d", role.ID)
	role.UpdatedAt = time.Now().Unix()
	return s.db.PutJSON(key, role)
}

func (s *RoleService) Delete(id uint) error {
	key := fmt.Sprintf("role:%d", id)
	return s.db.Delete(key)
}

func (s *RoleService) ListAll() ([]*models.Role, error) {
	var roles []*models.Role
	err := s.db.IteratePrefix("role:", func(_ string, val []byte) error {
		var role models.Role
		if err := json.Unmarshal(val, &role); err != nil {
			return err
		}
		roles = append(roles, &role)
		return nil
	})
	return roles, err
}

func (s *RoleService) LastIDFromDB() (uint64, error) {
	var lastID uint64
	iter := s.db.NewIterator(util.BytesPrefix([]byte("role:")), nil)
	defer iter.Release()

	for iter.Next() {
		var role models.Role
		err := json.Unmarshal(iter.Value(), &role)
		if err != nil {
			continue // Skip invalid entries
		}
		if role.ID > uint(lastID) {
			lastID = uint64(role.ID)
		}
	}

	if lastID == 0 {
		return 0, errors.New("no roles found")
	}
	return lastID, nil
}
