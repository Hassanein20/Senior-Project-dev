package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"

	config "HabitBite/backend/Config"
	controllers "HabitBite/backend/Controllers"
	middleware "HabitBite/backend/Middleware"
	repositories "HabitBite/backend/Repositories"
)

// SetupRoutes configures all the routes for the application
func SetupRoutes(router *gin.Engine, db *sqlx.DB, cfg *config.Config) {
	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	foodEntryRepo := repositories.NewFoodEntryRepository(db)

	// Initialize controllers
	authController := controllers.NewAuthController(userRepo, cfg)
	foodEntryController := controllers.NewFoodEntryController(foodEntryRepo)

	// Public routes
	public := router.Group("/api")
	{
		public.POST("/register", authController.Register)
		public.POST("/login", authController.Login)
		public.POST("/logout", authController.Logout)
	}

	// Protected routes
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware(cfg))
	protected.Use(middleware.CSRFMiddleware())
	{
		// User routes
		protected.GET("/profile", authController.GetCurrentUser)
		protected.POST("/auth/refresh", authController.RefreshToken)
		protected.GET("/user/goals", authController.GetUserGoals)
		protected.PUT("/user/goals", authController.UpdateUserGoals)
		protected.POST("/admin/recalculate-goals", authController.RecalculateAllUserGoals)

		// Food entry routes
		protected.POST("/food-entries", foodEntryController.AddFoodEntry)
		protected.GET("/food-entries/daily", foodEntryController.GetDailyEntries)
		protected.GET("/food-entries/nutrition", foodEntryController.GetDailyNutrition)
		protected.DELETE("/food-entries/:id", foodEntryController.DeleteFoodEntry)
		protected.GET("/food-entries/history", foodEntryController.GetNutritionHistory)
	}
}
