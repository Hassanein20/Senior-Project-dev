package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	models "HabitBite/backend/Models"

	"github.com/jmoiron/sqlx"
)

// FoodEntryRepository defines the interface for food entry data access
type FoodEntryRepository interface {
	CreateFoodEntry(ctx context.Context, entry *models.FoodEntry) error
	GetDailyEntries(ctx context.Context, userID int, date time.Time) ([]*models.FoodEntry, error)
	DeleteFoodEntry(ctx context.Context, entryID int) error
	GetDailyNutrition(ctx context.Context, userID int, date time.Time) (*models.DailyNutrition, error)
	GetNutritionHistory(ctx context.Context, userID int, startDate, endDate time.Time) ([]*models.DailyNutrition, error)
}

// foodEntryRepository implements FoodEntryRepository
type foodEntryRepository struct {
	db *sqlx.DB
}

// NewFoodEntryRepository creates a new FoodEntryRepository
func NewFoodEntryRepository(db *sqlx.DB) FoodEntryRepository {
	return &foodEntryRepository{db: db}
}

// CreateFoodEntry creates a new food entry in the database
func (r *foodEntryRepository) CreateFoodEntry(ctx context.Context, entry *models.FoodEntry) error {
	query := `
		INSERT INTO consumed_foods (
			user_id, food_id, food_name, quantity, calories, protein, carbs, fats,
			entry_date, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	result, err := r.db.ExecContext(ctx, query,
		entry.UserID,
		entry.FoodID,
		entry.Name,
		entry.Amount,
		entry.Calories,
		entry.Protein,
		entry.Carbs,
		entry.Fat,
		entry.Date,
		now,
		now,
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	entry.ID = int(id)
	return nil
}

// GetDailyEntries retrieves all food entries for a user on a specific date
func (r *foodEntryRepository) GetDailyEntries(ctx context.Context, userID int, date time.Time) ([]*models.FoodEntry, error) {
	// Basic logging for debugging
	fmt.Printf("[DEBUG GetDailyEntries] Repository call: userID=%d, date=%s\n",
		userID, date.Format("2006-01-02"))

	// First try the standard query with DATE function
	query := `
		SELECT id, user_id, food_id, food_name, quantity, calories, protein, carbs, fats,
			   entry_date, created_at, updated_at
		FROM consumed_foods
		WHERE user_id = ? AND DATE(entry_date) = DATE(?)
		ORDER BY entry_date DESC
	`

	fmt.Printf("[DEBUG GetDailyEntries] Running query with DATE() function\n")
	rows, err := r.db.QueryContext(ctx, query, userID, date)
	if err != nil {
		fmt.Printf("[ERROR GetDailyEntries] Query error: %v\n", err)
		return nil, fmt.Errorf("database query error: %v", err)
	}

	entries, err := scanEntries(rows)
	if err != nil {
		return nil, err
	}

	// If no entries found, try an alternative query using BETWEEN for the entire day
	if len(entries) == 0 {
		fmt.Printf("[DEBUG GetDailyEntries] No entries found with DATE(), trying with date range\n")

		startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
		endOfDay := startOfDay.Add(24 * time.Hour).Add(-time.Second)

		query = `
			SELECT id, user_id, food_id, food_name, quantity, calories, protein, carbs, fats,
				   entry_date, created_at, updated_at
			FROM consumed_foods
			WHERE user_id = ? AND entry_date BETWEEN ? AND ?
			ORDER BY entry_date DESC
		`

		rows, err = r.db.QueryContext(ctx, query, userID, startOfDay, endOfDay)
		if err != nil {
			fmt.Printf("[ERROR GetDailyEntries] Alternative query error: %v\n", err)
			return nil, fmt.Errorf("database alternative query error: %v", err)
		}

		entries, err = scanEntries(rows)
		if err != nil {
			return nil, err
		}
	}

	// If still no entries, do a final debug query to see if the user has any entries at all
	if len(entries) == 0 {
		fmt.Printf("[DEBUG GetDailyEntries] No entries found for date range, checking if user has ANY entries\n")

		debugQuery := `
			SELECT id, user_id, food_id, food_name, quantity, calories, protein, carbs, fats,
				   entry_date, created_at, updated_at
			FROM consumed_foods
			WHERE user_id = ?
			ORDER BY entry_date DESC
			LIMIT 5
		`

		rows, err = r.db.QueryContext(ctx, debugQuery, userID)
		if err != nil {
			fmt.Printf("[ERROR GetDailyEntries] Debug query error: %v\n", err)
			return nil, fmt.Errorf("database debug query error: %v", err)
		}

		debugEntries, err := scanEntries(rows)
		if err != nil {
			return nil, err
		}

		if len(debugEntries) > 0 {
			fmt.Printf("[DEBUG GetDailyEntries] Found %d entries for user but none for requested date.\n", len(debugEntries))
			for i, e := range debugEntries {
				fmt.Printf("[DEBUG UserEntry %d] ID=%d, Name=%s, Date=%s\n",
					i, e.ID, e.Name, e.Date.Format("2006-01-02 15:04:05"))
			}
		} else {
			fmt.Printf("[DEBUG GetDailyEntries] User has NO entries in the database.\n")
		}
	}

	fmt.Printf("[DEBUG GetDailyEntries] Returning %d entries\n", len(entries))
	return entries, nil
}

// Helper function to scan rows into food entry models
func scanEntries(rows *sql.Rows) ([]*models.FoodEntry, error) {
	defer rows.Close()

	var entries []*models.FoodEntry
	for rows.Next() {
		entry := &models.FoodEntry{}
		err := rows.Scan(
			&entry.ID,
			&entry.UserID,
			&entry.FoodID,
			&entry.Name,
			&entry.Amount,
			&entry.Calories,
			&entry.Protein,
			&entry.Carbs,
			&entry.Fat,
			&entry.Date,
			&entry.CreatedAt,
			&entry.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan food entry: %v", err)
		}
		entries = append(entries, entry)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %v", err)
	}

	return entries, nil
}

// DeleteFoodEntry deletes a food entry by ID
func (r *foodEntryRepository) DeleteFoodEntry(ctx context.Context, entryID int) error {
	query := `DELETE FROM consumed_foods WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, entryID)
	return err
}

// GetDailyNutrition retrieves the total nutrition for a user on a specific date
func (r *foodEntryRepository) GetDailyNutrition(ctx context.Context, userID int, date time.Time) (*models.DailyNutrition, error) {
	query := `
		SELECT 
			IFNULL(SUM(calories), 0) as total_calories,
			IFNULL(SUM(protein), 0) as total_protein,
			IFNULL(SUM(carbs), 0) as total_carbs,
			IFNULL(SUM(fats), 0) as total_fats
		FROM consumed_foods
		WHERE user_id = ? AND DATE(entry_date) = DATE(?)
	`

	var nutrition models.DailyNutrition
	err := r.db.QueryRowContext(ctx, query, userID, date).Scan(
		&nutrition.TotalCalories,
		&nutrition.TotalProtein,
		&nutrition.TotalCarbs,
		&nutrition.TotalFats,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to get daily nutrition: %v", err)
	}

	nutrition.Date = date
	return &nutrition, nil
}

// GetNutritionHistory retrieves nutrition data for a date range
func (r *foodEntryRepository) GetNutritionHistory(ctx context.Context, userID int, startDate, endDate time.Time) ([]*models.DailyNutrition, error) {
	fmt.Printf("[DEBUG GetNutritionHistory] Fetching history for userID=%d from %s to %s\n",
		userID, startDate.Format("2006-01-02"), endDate.Format("2006-01-02"))

	// Use a recursive CTE to generate all dates in the range
	query := `
		WITH RECURSIVE dates(date) AS (
			SELECT DATE(?)
			UNION ALL
			SELECT DATE_ADD(date, INTERVAL 1 DAY)
			FROM dates
			WHERE date < DATE(?)
		)
		SELECT 
			DATE_FORMAT(dates.date, '%Y-%m-%d') as date,
			IFNULL(SUM(cf.calories), 0) as total_calories,
			IFNULL(SUM(cf.protein), 0) as total_protein,
			IFNULL(SUM(cf.carbs), 0) as total_carbs,
			IFNULL(SUM(cf.fats), 0) as total_fats
		FROM dates
		LEFT JOIN consumed_foods cf ON DATE(cf.entry_date) = dates.date AND cf.user_id = ?
		GROUP BY dates.date
		ORDER BY dates.date ASC
	`

	rows, err := r.db.QueryContext(ctx, query, startDate, endDate, userID)
	if err != nil {
		fmt.Printf("[ERROR GetNutritionHistory] Query error: %v\n", err)
		return nil, fmt.Errorf("failed to query nutrition history: %v", err)
	}
	defer rows.Close()

	// Create a map to store nutrition by date string
	nutritionByDate := make(map[string]*models.DailyNutrition)

	// Pre-populate the map with all dates in the range
	currentDate := startDate
	for !currentDate.After(endDate) {
		dateStr := currentDate.Format("2006-01-02")
		nutritionByDate[dateStr] = &models.DailyNutrition{
			Date:          currentDate,
			TotalCalories: 0,
			TotalProtein:  0,
			TotalCarbs:    0,
			TotalFats:     0,
		}
		currentDate = currentDate.AddDate(0, 0, 1)
	}

	// Process the query results
	for rows.Next() {
		var nutrition models.DailyNutrition
		var dateStr string
		err := rows.Scan(
			&dateStr,
			&nutrition.TotalCalories,
			&nutrition.TotalProtein,
			&nutrition.TotalCarbs,
			&nutrition.TotalFats,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan nutrition history row: %v", err)
		}

		// Parse the date string
		date, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			return nil, fmt.Errorf("failed to parse date %s: %v", dateStr, err)
		}
		nutrition.Date = date

		// Store in the map
		nutritionByDate[dateStr] = &nutrition
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating nutrition history rows: %v", err)
	}

	// Convert the map to a slice, ensuring all dates are included
	var history []*models.DailyNutrition
	currentDate = startDate
	for !currentDate.After(endDate) {
		dateStr := currentDate.Format("2006-01-02")
		if nutrition, exists := nutritionByDate[dateStr]; exists {
			history = append(history, nutrition)
		}
		currentDate = currentDate.AddDate(0, 0, 1)
	}

	fmt.Printf("[DEBUG GetNutritionHistory] Returning %d days of nutrition data\n", len(history))
	return history, nil
}
