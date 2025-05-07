package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	config "HabitBite/backend/Config"
	controllers "HabitBite/backend/Controllers"
	middleware "HabitBite/backend/Middleware"
	repositories "HabitBite/backend/Repositories"
	routes "HabitBite/backend/Routes"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	csrf "github.com/utrack/gin-csrf"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Set up logging
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal("Error loading config:", err)
	}

	// Set Gin mode based on environment
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
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

	// Session store setup
	store := cookie.NewStore([]byte(cfg.JWTSecret))
	store.Options(sessions.Options{
		Path:     "/",
		Domain:   cfg.CookieDomain,
		MaxAge:   86400, // 1 day in seconds
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})
	router.Use(sessions.Sessions("habitbite-session", store))

	// Middleware chain
	router.Use(
		middleware.CORSMiddleware(cfg.CORSAllowedOrigins),
		middleware.SecurityHeaders(),
		middleware.RateLimiter(5, 10), // 5 requests per second, burst of 10
		csrf.Middleware(csrf.Options{
			Secret: cfg.JWTSecret,
			ErrorFunc: func(c *gin.Context) {
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "CSRF token invalid"})
			},
		}),
	)

	// Register routes
	routes.RegisterRoutes(router, authController, cfg)

	// Create server with timeouts
	srv := &http.Server{
		Addr:         ":" + cfg.ServerPort,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting server on port %s", cfg.ServerPort)

		// HTTPS setup
		certFile := os.Getenv("SSL_CERT_PATH")
		keyFile := os.Getenv("SSL_KEY_PATH")

		var err error
		if certFile != "" && keyFile != "" {
			// Start HTTP server for redirects
			go startRedirectServer()

			// Start HTTPS server
			log.Printf("Starting HTTPS server on port %s", cfg.ServerPort)
			err = srv.ListenAndServeTLS(certFile, keyFile)
		} else {
			log.Printf("Starting HTTP server on port %s", cfg.ServerPort)
			err = srv.ListenAndServe()
		}

		if err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Create a deadline to wait for
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exiting")
}

// startRedirectServer starts an HTTP server that redirects all traffic to HTTPS
func startRedirectServer() {
	redirectServer := &http.Server{
		Addr:    ":80",
		Handler: http.HandlerFunc(redirectToHTTPS),
	}

	if err := redirectServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Printf("HTTP redirect server error: %v", err)
	}
}

// redirectToHTTPS redirects HTTP requests to HTTPS
func redirectToHTTPS(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r,
		"https://"+r.Host+r.URL.String(),
		http.StatusMovedPermanently,
	)
}
