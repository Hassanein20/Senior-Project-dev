package routes

import (
	"net/http"

	config "HabitBite/backend/Config"
	controllers "HabitBite/backend/Controllers"
	middleware "HabitBite/backend/Middleware"

	"github.com/gin-gonic/gin"
)

// RegisterRoutes registers all API routes
func RegisterRoutes(r *gin.Engine, authController *controllers.AuthController, cfg *config.Config) {
	// API base path
	api := r.Group("/api")

	// Health check endpoint
	api.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
		})
	})

	// Version info endpoint
	api.GET("/version", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"version": "1.0.0", // Consider using build-time variables for this
			"env":     cfg.Environment,
		})
	})

	// Register authentication routes
	RegisterAuthRoutes(api, authController, cfg)

	// Add more route groups as needed:
	// RegisterUserRoutes(api, userController, cfg)
	// RegisterNutritionRoutes(api, nutritionController, cfg)
	// RegisterWorkoutRoutes(api, workoutController, cfg)
	// etc.
}

// RegisterAuthRoutes registers authentication routes
func RegisterAuthRoutes(router *gin.RouterGroup, controller *controllers.AuthController, cfg *config.Config) {
	auth := router.Group("/auth")
	{
		// Public routes (no authentication required)
		auth.POST("/register", controller.Register)
		auth.POST("/login", controller.Login)

		// Protected routes (authentication required)
		authRequired := auth.Group("/")
		authRequired.Use(middleware.AuthMiddleware(cfg))
		{
			authRequired.GET("/me", controller.GetCurrentUser)
			authRequired.POST("/refresh", controller.RefreshToken)
			authRequired.POST("/logout", controller.Logout)
		}
	}
}
