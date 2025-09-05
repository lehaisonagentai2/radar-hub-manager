package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/services"
)

type TestData struct {
	Roles     []models.Role
	Users     []models.User
	Stations  []models.Station
	Schedules []models.Schedule
}

func main() {
	var testData TestData

	dataBytes, err := os.ReadFile("seed_test_data.json")
	if err != nil {
		panic(err)
	}

	if err := json.Unmarshal(dataBytes, &testData); err != nil {
		panic(err)
	}
	fmt.Printf("Loaded %d roles, %d users, %d stations, %d schedules\n",
		len(testData.Roles), len(testData.Users), len(testData.Stations), len(testData.Schedules))
	db, err := services.OpenDB("/Users/maianhnguyen/go/src/github.com/lehaisonagentai2/radar-hub-manager/backend/cmd/server/data")
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	roleService := services.NewRoleService(db)

	for _, role := range testData.Roles {
		if err := roleService.Create(&role); err != nil {
			log.Println("Failed to create role:", err)
		}
	}
	// Create users
	userService := services.NewUserService(db)
	for _, user := range testData.Users {
		if err := userService.Create(&user); err != nil {
			log.Println("Failed to create user:", err)
		}
	}
	scheduleService := services.NewScheduleService(db)
	for _, schedule := range testData.Schedules {
		if err := scheduleService.Create(&schedule); err != nil {
			log.Println("Failed to create schedule:", err)
		}
	}

	// Create stations
	stationService := services.NewStationService(db, scheduleService)
	for _, station := range testData.Stations {
		if err := stationService.Create(&station); err != nil {
			log.Println("Failed to create station:", err)
		}
	}
	fmt.Println("Data seeding completed successfully.")
}
