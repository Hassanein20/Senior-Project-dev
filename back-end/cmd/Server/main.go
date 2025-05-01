package main

import (
	"log"

	config "HabitBite/backend/Config"
	controllers "HabitBite/backend/Controllers"
	middleware "HabitBite/backend/Middleware"
	repositories "HabitBite/backend/Repositories"
	routes "HabitBite/backend/Routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal("Error loading config:", err)
	}

	// Database connection
	db, err := config.NewMySQLDB(cfg)
	if err != nil {
		log.Fatal("Database connection failed:", err)
	}
	defer db.Close()

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)

	// Initialize controllers
	authController := controllers.NewAuthController(userRepo, cfg)

	// Create Gin router
	router := gin.Default()
	router.Use(middleware.CORSMiddleware())

	// Register routes
	routes.RegisterAuthRoutes(router, authController)

	// Protected route example
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware(cfg))
	{
		protected.GET("/profile", func(c *gin.Context) {
			// Profile handler
		})
	}

	// Start server
	log.Printf("Server running on port %s", cfg.ServerPort)
	router.Run(":" + cfg.ServerPort)
}
