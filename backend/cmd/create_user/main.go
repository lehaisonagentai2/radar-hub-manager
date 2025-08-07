package main

import (
	"log"

	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/services"
)

func main() {
	// Initialize database
	db, err := services.OpenDB("./data")
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// Initialize user service
	userService := services.NewUserService(db)

	// Create a test admin user
	testUser := &models.User{
		Username: "admin",
		Password: "admin123", // In a real app, this should be hashed
		FullName: "Administrator",
		RoleID:   models.RoleAdmin,
	}

	err = userService.Create(testUser)
	if err != nil {
		log.Printf("Error creating admin user (might already exist): %v", err)
	} else {
		log.Println("Admin user created successfully!")
		log.Printf("ID: %d", testUser.ID)
		log.Println("Username: admin")
		log.Println("Password: admin123")
		log.Println("Role: ADMIN")
	}

	// Create a test operator user
	operatorUser := &models.User{
		Username: "operator",
		Password: "operator123",
		FullName: "Station Operator",
		RoleID:   models.RoleOperator,
	}

	err = userService.Create(operatorUser)
	if err != nil {
		log.Printf("Error creating operator user (might already exist): %v", err)
	} else {
		log.Println("Operator user created successfully!")
		log.Printf("ID: %d", operatorUser.ID)
		log.Println("Username: operator")
		log.Println("Password: operator123")
		log.Println("Role: OPERATOR")
	}
}
