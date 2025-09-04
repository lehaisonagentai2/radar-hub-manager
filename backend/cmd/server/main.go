// Package main provides the main entry point for the radar hub manager API server
package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lehaisonagentai2/radar-hub-manager/backend/docs" // swagger docs
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/handlers"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/middleware"
	"github.com/lehaisonagentai2/radar-hub-manager/backend/internal/services"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title Radar Hub Manager API
// @version 1.0
// @description This is the API server for the Radar Hub Manager system
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8998
// @BasePath /v1/api/radar-hub-manager

// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

func main() {
	// Initialize database
	db, err := services.OpenDB("./data")
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// Initialize services
	userService := services.NewUserService(db)
	scheduleService := services.NewScheduleService(db)
	commandService := services.NewCommandService(db)
	stationService := services.NewStationService(db, scheduleService)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userService)
	userHandler := handlers.NewUserHandler(userService)
	stationHandler := handlers.NewStationHandler(stationService)
	scheduleHandler := handlers.NewScheduleHandler(scheduleService, stationService)
	commandHandler := handlers.NewCommandHandler(commandService, stationService)

	// Initialize Gin router
	r := gin.Default()

	// Configure CORS (Cross-Origin Resource Sharing)
	// This allows frontend applications from different domains to access the API
	config := cors.DefaultConfig()

	// Check if we're in development mode
	isDevelopment := os.Getenv("GIN_MODE") != "release"

	if isDevelopment {
		// Development: Allow all origins for easier testing
		// WARNING: Do not use this in production!
		config.AllowAllOrigins = true
		log.Println("CORS: Development mode - allowing all origins")
	} else {
		// Production: Restrict to specific origins for security
		// TODO: Replace with your actual frontend domain(s)
		config.AllowOrigins = []string{
			"http://localhost:3000", // Replace with your production frontend domain
			// "https://www.your-frontend-domain.com", // Replace with your production frontend domain
			"http://localhost:8998", // Allow same origin for Swagger UI
		}
		log.Println("CORS: Production mode - restricted origins")
	}

	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"}
	config.AllowHeaders = []string{
		"Origin",
		"Content-Type",
		"Accept",
		"Authorization",
		"X-Requested-With",
		"X-CSRF-Token",
		"Cache-Control",
		"X-File-Name",
	}
	config.ExposeHeaders = []string{
		"Content-Length",
		"Content-Type",
		"Authorization",
	}
	config.AllowCredentials = true
	config.MaxAge = 12 * 3600 // 12 hours

	// Apply CORS middleware
	r.Use(cors.New(config))

	// Swagger endpoint
	r.GET("/v1/api/radar-hub-manager/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// API routes
	api := r.Group("/v1/api/radar-hub-manager")
	{
		// Authentication routes (no middleware required)
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)

			// Protected routes (require JWT token)
			auth.GET("/me", middleware.JWTMiddleware(userService), authHandler.GetUserInfo)
		}

		// User management routes (Admin only)
		users := api.Group("/users")
		users.Use(middleware.JWTMiddleware(userService), middleware.AdminMiddleware())
		{
			users.POST("", userHandler.CreateUser)             // POST /users
			users.GET("", userHandler.ListUsers)               // GET /users
			users.GET("/:username", userHandler.GetUser)       // GET /users/:username
			users.PUT("/:username", userHandler.UpdateUser)    // PUT /users/:username
			users.DELETE("/:username", userHandler.DeleteUser) // DELETE /users/:username
		}

		// Station management routes
		// Admin-only operations (Create, Delete)
		stationsAdmin := api.Group("/stations")
		stationsAdmin.Use(middleware.JWTMiddleware(userService), middleware.AdminMiddleware())
		{
			stationsAdmin.POST("", stationHandler.CreateStation)       // POST /stations (Admin only)
			stationsAdmin.DELETE("/:id", stationHandler.DeleteStation) // DELETE /stations/:id (Admin only)
		}

		// Station operations for ADMIN, OPERATOR, and HQ (Read, Update)
		stations := api.Group("/stations")
		stations.Use(middleware.JWTMiddleware(userService), middleware.StationAccessMiddleware())
		{
			stations.GET("", stationHandler.ListStations)      // GET /stations
			stations.GET("/:id", stationHandler.GetStation)    // GET /stations/:id
			stations.PUT("/:id", stationHandler.UpdateStation) // PUT /stations/:id
		}

		// Schedule routes - using different URL pattern to avoid conflicts
		schedules := api.Group("/station-schedules")
		schedules.Use(middleware.JWTMiddleware(userService), middleware.StationAccessMiddleware())
		{
			// Read operations available to all with station access
			schedules.GET("/station/:station_id", scheduleHandler.ListSchedules)            // GET /station-schedules/station/:station_id
			schedules.GET("/station/:station_id/:schedule_id", scheduleHandler.GetSchedule) // GET /station-schedules/station/:station_id/:schedule_id
		}

		// Schedule management routes (Operator only for CUD operations)
		scheduleOperator := api.Group("/station-schedules")
		scheduleOperator.Use(middleware.JWTMiddleware(userService), middleware.OperatorMiddleware())
		{
			scheduleOperator.POST("/station/:station_id", scheduleHandler.CreateSchedule)                // POST /station-schedules/station/:station_id
			scheduleOperator.PUT("/station/:station_id/:schedule_id", scheduleHandler.UpdateSchedule)    // PUT /station-schedules/station/:station_id/:schedule_id
			scheduleOperator.DELETE("/station/:station_id/:schedule_id", scheduleHandler.DeleteSchedule) // DELETE /station-schedules/station/:station_id/:schedule_id
		}

		// Command management routes
		// HQ-only operations (Create commands)
		commandsHQ := api.Group("/commands")
		commandsHQ.Use(middleware.JWTMiddleware(userService), middleware.HQMiddleware())
		{
			commandsHQ.POST("", commandHandler.CreateCommand) // POST /commands (HQ only)
		}

		// Command operations for ADMIN, OPERATOR, and HQ (Read operations)
		commandsAccess := api.Group("/commands")
		commandsAccess.Use(middleware.JWTMiddleware(userService), middleware.StationAccessMiddleware())
		{
			commandsAccess.GET("", commandHandler.ListCommands)   // GET /commands
			commandsAccess.GET("/:id", commandHandler.GetCommand) // GET /commands/:id
		}

		// Command operations for OPERATOR (Acknowledge)
		commandsOperator := api.Group("/commands")
		commandsOperator.Use(middleware.JWTMiddleware(userService), middleware.OperatorMiddleware())
		{
			commandsOperator.PUT("/:id/acknowledge", commandHandler.AcknowledgeCommand) // PUT /commands/:id/acknowledge (Operator only)
		}

		// Unacknowledged commands - using different route structure to avoid conflicts
		stationCommands := api.Group("/station-commands")
		stationCommands.Use(middleware.JWTMiddleware(userService), middleware.OperatorMiddleware())
		{
			stationCommands.GET("/station/:station_id/unacknowledged", commandHandler.ListUnacknowledgedCommands) // GET /station-commands/station/:station_id/unacknowledged
		}
	}

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Radar Hub Manager API is running",
		})
	})

	log.Println("Starting server on :8998")
	log.Println("Swagger documentation available at: http://localhost:8998/v1/api/radar-hub-manager/swagger/index.html")

	if err := r.Run(":8998"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
