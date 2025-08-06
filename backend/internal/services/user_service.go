package services

import (
	"errors"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
)

const secretKey = "radar-hub-manager"

type UserService struct{ db *DB }

func NewUserService(db *DB) *UserService { return &UserService{db} }

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
	u.CreatedAt = time.Now().Unix()
	u.UpdatedAt = u.CreatedAt
	return s.db.PutJSON(key, u)
}

// Delete removes a user by username.
func (s *UserService) Delete(username string) error {
	return s.db.Delete("user:" + username)
}

// VerifyPassword performs a naive comparison (plaintext demo).
func (s *UserService) VerifyPassword(username, pwd string) (*models.User, error) {
	var u models.User
	err := s.db.GetJSON("user:"+username, &u)
	if err != nil {
		return nil, err
	}
	if u.PasswordHash != pwd {
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
