package routes

import (
	config "HabitBite/backend/Config"
	controllers "HabitBite/backend/Controllers"
	middleware "HabitBite/backend/Middleware"

	"github.com/gin-gonic/gin"
)

// SetupFoodEntryRoutes configures the food entry routes
func SetupFoodEntryRoutes(router *gin.Engine, foodEntryController *controllers.FoodEntryController, config *config.Config) {
	// Group all food entry routes under /api/food-entries
	foodEntries := router.Group("/api/food-entries")
	{
		// Apply authentication middleware to all food entry routes
		foodEntries.Use(middleware.AuthMiddleware(config))

		// Add a new food entry
		foodEntries.POST("", foodEntryController.AddFoodEntry)

		// Get food entries for a specific date
		foodEntries.GET("/daily", foodEntryController.GetDailyEntries)

		// Get daily nutrition summary
		foodEntries.GET("/nutrition", foodEntryController.GetDailyNutrition)

		// Delete a food entry
		foodEntries.DELETE("/:id", foodEntryController.DeleteFoodEntry)

		// Get nutrition history for a date range
		foodEntries.GET("/history", foodEntryController.GetNutritionHistory)
	}
}
