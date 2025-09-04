package services

import (
	"encoding/json"
	"errors"
	"log"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
	"github.com/syndtr/goleveldb/leveldb/util"
)

const secretKey = "radar-hub-manager"

type UserService struct {
	db     *DB
	lastID int
}

func NewUserService(db *DB) *UserService {
	sv := &UserService{db: db}
	lastID, err := sv.LastIDFromDB()
	if err == nil {
		sv.lastID = lastID
	}
	log.Println("Last user ID:", sv.lastID)
	return sv
}

func (s *UserService) NextID() int {
	s.lastID++
	return s.lastID
}

// Create inserts a new user if username not exists.
func (s *UserService) Create(u *models.User) error {
	key := "user:" + u.Username
	exists, err := s.db.Exists(key)
	if err != nil {
		return err
	}
	if exists {
		return errors.New("username already exists")
	}

	// Generate a simple incremental ID (in production, use UUID or proper ID generation)
	u.ID = (s.NextID())
	u.CreatedAt = time.Now().Unix()
	u.UpdatedAt = u.CreatedAt

	// Store by both username and ID
	userKey := "user:" + u.Username
	userIDKey := "user_id:" + strconv.Itoa(u.ID)

	err = s.db.PutJSON(userKey, u)
	if err != nil {
		return err
	}

	err = s.db.PutJSON(userIDKey, u)
	if err != nil {
		return err
	}

	return nil
}

// Delete removes a user by username.
func (s *UserService) Delete(username string) error {
	return s.db.Delete("user:" + username)
}

// Update modifies an existing user.
func (s *UserService) Update(u *models.User) error {
	key := "user:" + u.Username
	var existingUser models.User
	if err := s.db.GetJSON(key, &existingUser); err != nil {
		return err
	}
	u.CreatedAt = existingUser.CreatedAt // Preserve creation time
	u.UpdatedAt = time.Now().Unix()
	return s.db.PutJSON(key, u)
}

// VerifyPassword performs a naive comparison (plaintext demo).
func (s *UserService) VerifyPassword(username, pwd string) (*models.User, error) {
	var u models.User
	err := s.db.GetJSON("user:"+username, &u)
	if err != nil {
		return nil, err
	}
	if u.Password != pwd {
		return nil, errors.New("wrong password")
	}
	return &u, nil
}

func (s *UserService) GenerateToken(u *models.User) (string, error) {
	// Create claims with user ID, username, and standard claims
	claims := jwt.MapClaims{
		"user_id":  u.ID,
		"username": u.Username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
		"iat":      time.Now().Unix(),                     // Issued at time
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// TODO: Use a proper secret key from configuration
	secretKey := []byte(secretKey)

	// Sign and get the complete encoded token as a string
	tokenString, err := token.SignedString(secretKey)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// GetUserFromToken extracts user information from a JWT token
func (s *UserService) GetUserFromToken(tokenString string) (*models.User, error) {
	// Parse the token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid token signing method")
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	// Check if the token is valid
	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	// Extract claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	// Extract username from claims
	username, ok := claims["username"].(string)
	if !ok {
		return nil, errors.New("username not found in token")
	}

	// Get user from database
	var user models.User
	err = s.db.GetJSON("user:"+username, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *UserService) Login(username, password string) (*models.User, string, error) {
	user, err := s.VerifyPassword(username, password)
	if err != nil {
		return nil, "", err
	}

	token, err := s.GenerateToken(user)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

// GetByID retrieves a user by their ID
func (s *UserService) GetByID(id int) (*models.User, error) {
	key := "user_id:" + strconv.Itoa(id)
	var user models.User
	err := s.db.GetJSON(key, &user)
	if err != nil {
		return nil, errors.New("user not found")
	}
	return &user, nil
}

// GetByUsername retrieves a user by their username
func (s *UserService) GetByUsername(username string) (*models.User, error) {
	key := "user:" + username
	var user models.User
	err := s.db.GetJSON(key, &user)
	if err != nil {
		return nil, errors.New("user not found")
	}
	return &user, nil
}

// UpdateUser updates an existing user with partial data
func (s *UserService) UpdateUser(id int, updates map[string]interface{}) (*models.User, error) {
	// Get existing user
	user, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Apply updates
	if password, ok := updates["password"].(string); ok && password != "" {
		user.Password = password
	}
	if fullName, ok := updates["full_name"].(string); ok && fullName != "" {
		user.FullName = fullName
	}
	if roleID, ok := updates["role_id"].(models.RoleName); ok {
		user.RoleID = roleID
	}
	if stationID, ok := updates["station_id"].(*uint); ok {
		user.StationID = stationID
	}

	user.UpdatedAt = time.Now().Unix()

	// Save updated user
	userKey := "user:" + user.Username
	userIDKey := "user_id:" + strconv.Itoa(user.ID)

	err = s.db.PutJSON(userKey, user)
	if err != nil {
		return nil, err
	}

	err = s.db.PutJSON(userIDKey, user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// DeleteByID deletes a user by their ID
func (s *UserService) DeleteByID(id int) error {
	// Get user first to get username
	user, err := s.GetByID(id)
	if err != nil {
		return err
	}

	// Delete by both username and ID keys
	userKey := "user:" + user.Username
	userIDKey := "user_id:" + strconv.Itoa(id)

	err = s.db.Delete(userKey)
	if err != nil {
		return err
	}

	err = s.db.Delete(userIDKey)
	if err != nil {
		return err
	}

	return nil
}

// List retrieves all users
func (s *UserService) List() ([]*models.User, error) {
	var users []*models.User

	// This is a simplified implementation - in a real system you'd want pagination
	// For now, we'll iterate through user keys
	iter := s.db.NewIterator(util.BytesPrefix([]byte("user:")), nil)
	defer iter.Release()

	for iter.Next() {
		var user models.User
		err := json.Unmarshal(iter.Value(), &user)
		if err != nil {
			continue // Skip invalid entries
		}
		users = append(users, &user)
	}

	return users, nil
}

// UpdateByUsername updates an existing user by username with partial data
func (s *UserService) UpdateByUsername(username string, updates map[string]interface{}) (*models.User, error) {
	// Get existing user
	user, err := s.GetByUsername(username)
	if err != nil {
		return nil, err
	}

	// Apply updates
	if password, ok := updates["password"].(string); ok && password != "" {
		user.Password = password
	}
	if fullName, ok := updates["full_name"].(string); ok && fullName != "" {
		user.FullName = fullName
	}
	if roleID, ok := updates["role_id"].(models.RoleName); ok {
		user.RoleID = roleID
	}
	if stationID, ok := updates["station_id"].(*uint); ok {
		user.StationID = stationID
	}

	user.UpdatedAt = time.Now().Unix()

	// Save updated user
	userKey := "user:" + user.Username
	userIDKey := "user_id:" + strconv.Itoa(user.ID)

	err = s.db.PutJSON(userKey, user)
	if err != nil {
		return nil, err
	}

	err = s.db.PutJSON(userIDKey, user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// DeleteByUsername deletes a user by their username
func (s *UserService) DeleteByUsername(username string) error {
	// Get user first to get ID
	user, err := s.GetByUsername(username)
	if err != nil {
		return err
	}

	// Delete by both username and ID keys
	userKey := "user:" + username
	userIDKey := "user_id:" + strconv.Itoa(user.ID)

	err = s.db.Delete(userKey)
	if err != nil {
		return err
	}

	err = s.db.Delete(userIDKey)
	if err != nil {
		return err
	}

	return nil
}

func (s *UserService) LastIDFromDB() (int, error) {
	var lastID int
	iter := s.db.NewIterator(util.BytesPrefix([]byte("user:")), nil)
	defer iter.Release()

	for iter.Next() {
		var user models.User
		err := json.Unmarshal(iter.Value(), &user)
		if err != nil {
			continue // Skip invalid entries
		}
		if user.ID > lastID {
			lastID = user.ID
		}
	}

	if lastID == 0 {
		return 0, errors.New("no users found")
	}
	return lastID, nil
}
