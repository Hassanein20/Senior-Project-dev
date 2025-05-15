package Controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	models "HabitBite/backend/Models"
	repositories "HabitBite/backend/Repositories"

	"github.com/gin-gonic/gin"
)

// FoodEntryController handles food entry-related operations
type FoodEntryController struct {
	foodEntryRepo repositories.FoodEntryRepository
}

// NewFoodEntryController creates a new FoodEntryController
func NewFoodEntryController(repo repositories.FoodEntryRepository) *FoodEntryController {
	return &FoodEntryController{
		foodEntryRepo: repo,
	}
}

// AddFoodEntry adds a new food entry for the current user
func (c *FoodEntryController) AddFoodEntry(ctx *gin.Context) {
	// Get user ID from context (set by AuthMiddleware)
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	var req models.FoodEntryRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Create food entry with provided nutrition values
	entry := &models.FoodEntry{
		UserID:   int(userID.(float64)),
		FoodID:   req.FoodID,
		Name:     req.Name,
		Amount:   req.Amount,
		Calories: req.Calories,
		Protein:  req.Protein,
		Carbs:    req.Carbs,
		Fat:      req.Fat,
		Date:     req.Date,
	}

	if err := c.foodEntryRepo.CreateFoodEntry(ctx.Request.Context(), entry); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add food entry"})
		return
	}

	ctx.JSON(http.StatusCreated, entry)
}

// GetDailyEntries retrieves all food entries for a user on a specific date
func (c *FoodEntryController) GetDailyEntries(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	dateStr := ctx.Query("date")
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}

	// Debug log
	fmt.Printf("[DEBUG GetDailyEntries] Request from user_id=%v, date=%s\n", userID, dateStr)

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		fmt.Printf("[ERROR GetDailyEntries] Invalid date format: %v\n", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}

	// Show date in UTC to avoid timezone issues
	fmt.Printf("[DEBUG GetDailyEntries] Parsed date in UTC: %s\n", date.UTC().Format("2006-01-02"))

	entries, err := c.foodEntryRepo.GetDailyEntries(ctx.Request.Context(), int(userID.(float64)), date)
	if err != nil {
		fmt.Printf("[ERROR GetDailyEntries] Error fetching entries: %v\n", err)
		ctx.JSON(http.StatusOK, []interface{}{})
		return
	}

	fmt.Printf("[DEBUG GetDailyEntries] Found %d entries for user %v on date %s\n",
		len(entries), userID, date.Format("2006-01-02"))
	for i, e := range entries {
		fmt.Printf("[DEBUG Entry %d] ID=%d, Name=%s, Date=%s\n",
			i, e.ID, e.Name, e.Date.Format("2006-01-02 15:04:05"))
	}

	// Transform entries to match frontend expectations
	type EntryResponse struct {
		ID        int       `json:"id"`
		FoodName  string    `json:"food_name"`
		Quantity  float64   `json:"quantity"`
		Calories  float64   `json:"calories"`
		Protein   float64   `json:"protein"`
		Carbs     float64   `json:"carbs"`
		Fat       float64   `json:"fat"`
		EntryDate time.Time `json:"entry_date"`
	}

	var response []EntryResponse
	for _, e := range entries {
		response = append(response, EntryResponse{
			ID:        e.ID,
			FoodName:  e.Name,
			Quantity:  e.Amount,
			Calories:  e.Calories,
			Protein:   e.Protein,
			Carbs:     e.Carbs,
			Fat:       e.Fat,
			EntryDate: e.Date,
		})
	}

	ctx.JSON(http.StatusOK, response)
}

// GetDailyNutrition retrieves the total nutrition for a user on a specific date
func (c *FoodEntryController) GetDailyNutrition(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	dateStr := ctx.Query("date")
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}

	nutrition, err := c.foodEntryRepo.GetDailyNutrition(ctx.Request.Context(), int(userID.(float64)), date)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get nutrition data"})
		return
	}

	ctx.JSON(http.StatusOK, nutrition)
}

// DeleteFoodEntry deletes a food entry
func (c *FoodEntryController) DeleteFoodEntry(ctx *gin.Context) {
	// Verify user is authenticated
	if _, exists := ctx.Get("userID"); !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	entryID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid entry ID"})
		return
	}

	if err := c.foodEntryRepo.DeleteFoodEntry(ctx.Request.Context(), entryID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete food entry"})
		return
	}

	ctx.Status(http.StatusNoContent)
}

// GetNutritionHistory retrieves nutrition data for a date range
func (c *FoodEntryController) GetNutritionHistory(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	startDateStr := ctx.Query("startDate")
	endDateStr := ctx.Query("endDate")

	fmt.Printf("[DEBUG GetNutritionHistory] Raw date parameters: startDate=%s, endDate=%s\n",
		startDateStr, endDateStr)

	if startDateStr == "" || endDateStr == "" {
		// Default to last 7 days if dates not provided
		endDate := time.Now()
		startDate := endDate.AddDate(0, 0, -6)
		startDateStr = startDate.Format("2006-01-02")
		endDateStr = endDate.Format("2006-01-02")
		fmt.Printf("[DEBUG GetNutritionHistory] Using default date range: %s to %s\n",
			startDateStr, endDateStr)
	}

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		fmt.Printf("[ERROR GetNutritionHistory] Invalid start date format: %v\n", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start date format. Use YYYY-MM-DD"})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		fmt.Printf("[ERROR GetNutritionHistory] Invalid end date format: %v\n", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end date format. Use YYYY-MM-DD"})
		return
	}

	// Validate date range
	if endDate.Before(startDate) {
		fmt.Printf("[ERROR GetNutritionHistory] End date %s is before start date %s\n",
			endDate.Format("2006-01-02"), startDate.Format("2006-01-02"))
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "End date must be after start date"})
		return
	}

	// Limit date range to 30 days
	if endDate.Sub(startDate) > 30*24*time.Hour {
		fmt.Printf("[WARN GetNutritionHistory] Date range too large: %s to %s\n",
			startDate.Format("2006-01-02"), endDate.Format("2006-01-02"))
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Date range cannot exceed 30 days"})
		return
	}

	// Make sure we get data for the entire day
	startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, time.UTC)
	endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, time.UTC)

	fmt.Printf("[DEBUG GetNutritionHistory] Fetching history for user_id=%v from %s to %s\n",
		userID, startDate.Format("2006-01-02 15:04:05"), endDate.Format("2006-01-02 15:04:05"))

	history, err := c.foodEntryRepo.GetNutritionHistory(ctx.Request.Context(), int(userID.(float64)), startDate, endDate)
	if err != nil {
		// Add detailed logging for debugging
		fmt.Printf("[ERROR GetNutritionHistory] Error: %v\n", err)
		ctx.JSON(http.StatusOK, []interface{}{}) // Return empty array instead of 500 error
		return
	}

	// Log the results before sending
	fmt.Printf("[DEBUG GetNutritionHistory] Returning %d days of nutrition data\n", len(history))
	for i, day := range history {
		fmt.Printf("[DEBUG GetNutritionHistory] Day %d: %s - Cal: %.2f, P: %.2f, C: %.2f, F: %.2f\n",
			i, day.Date.Format("2006-01-02"),
			day.TotalCalories, day.TotalProtein, day.TotalCarbs, day.TotalFats)
	}

	ctx.JSON(http.StatusOK, history)
}
