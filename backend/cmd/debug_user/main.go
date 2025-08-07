package main

import (
	"fmt"
	"log"

	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/models"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/services"
)

func main() {
	db, err := services.OpenDB("./data")
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	var u models.User
	err = db.GetJSON("user:admin", &u)
	if err != nil {
		fmt.Printf("Error getting user: %v\n", err)
	} else {
		fmt.Printf("User found: %+v\n", u)
	}
}
