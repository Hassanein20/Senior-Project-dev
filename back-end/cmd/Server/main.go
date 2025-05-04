package main

import (
	"log"
	"net/http"
	"os"

	config "HabitBite/backend/Config"
	middleware "HabitBite/backend/Middleware"
	repositories "HabitBite/backend/Repositories"
	routes "HabitBite/backend/Routes"
	controllers "HabitBite/backend/controllers"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	csrf "github.com/utrack/gin-csrf"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

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

	// Initialize components
	userRepo := repositories.NewUserRepository(db)
	authController := controllers.NewAuthController(userRepo, cfg)

	// Create Gin router
	router := gin.Default()

	// Session store setup
	store := cookie.NewStore([]byte(cfg.JWTSecret))
	router.Use(sessions.Sessions("mysession", store))

	// Middleware chain
	router.Use(
		middleware.CORSMiddleware(),
		middleware.SecurityHeaders(),
		csrf.Middleware(csrf.Options{
			Secret: cfg.JWTSecret,
			ErrorFunc: func(c *gin.Context) {
				c.AbortWithStatusJSON(400, gin.H{"error": "CSRF token invalid"})
			},
		}),
	)

	// Register routes
	routes.RegisterAuthRoutes(router, authController)

	// HTTPS setup
	certFile := os.Getenv("SSL_CERT_PATH")
	keyFile := os.Getenv("SSL_KEY_PATH")

	if certFile != "" && keyFile != "" {
		go func() {
			if err := http.ListenAndServe(":80", http.HandlerFunc(redirectToHTTPS)); err != nil {
				log.Printf("HTTP server error: %v", err)
			}
		}()

		log.Printf("Starting HTTPS server on :%s", cfg.ServerPort)
		if err := router.RunTLS(":"+cfg.ServerPort, certFile, keyFile); err != nil {
			log.Fatal("Failed to start HTTPS server:", err)
		}
	} else {
		log.Printf("Starting HTTP server on :%s", cfg.ServerPort)
		if err := router.Run(":" + cfg.ServerPort); err != nil {
			log.Fatal("Failed to start server:", err)
		}
	}
}

func redirectToHTTPS(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r,
		"https://"+r.Host+r.URL.String(),
		http.StatusMovedPermanently,
	)
}
