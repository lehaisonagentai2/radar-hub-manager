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

	// Delete existing admin user first
	err = userService.Delete("admin")
	log.Printf("Delete admin result: %v", err)

	// Create a fresh admin user
	adminUser := &models.User{
		Username: "admin",
		Password: "admin123",
		FullName: "Administrator",
		RoleID:   models.RoleAdmin,
	}

	err = userService.Create(adminUser)
	if err != nil {
		log.Printf("Error creating admin user: %v", err)
	} else {
		log.Println("Fresh admin user created successfully!")
		log.Printf("ID: %d", adminUser.ID)
		log.Println("Username: admin")
		log.Println("Password: admin123")
		log.Println("Role: ADMIN")
	}
}
