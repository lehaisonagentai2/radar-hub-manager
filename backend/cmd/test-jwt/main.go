package main

import (
	"encoding/json"
	"errors"

	"github.com/golang-jwt/jwt/v5"
)

const secretKey = "radar-hub-manager"

func GetUserFromToken(tokenString string) (string, error) {
	// Parse the token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid token signing method")
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		return "", err
	}

	// Check if the token is valid
	if !token.Valid {
		return "", errors.New("invalid token")
	}

	// Extract claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("invalid token claims")
	}
	userJSON, _ := json.Marshal(claims)
	return string(userJSON), nil
}
func main() {
	jwtToken := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTQ1NTc4MTksImlhdCI6MTc1NDQ3MTQxOSwidXNlcl9pZCI6MSwidXNlcm5hbWUiOiJhZG1pbiJ9.u-6-YFJQk8b4hY1K6nEg1-Dc8tHZYVAvZzIKQToDBiQ"
	user, err := GetUserFromToken(jwtToken)
	if err != nil {
		panic(err)
	}
	println("User found:", user)

}
