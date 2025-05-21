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
	// Start a transaction
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %v", err)
	}

	// Rollback is safe to call even if the tx is already closed
	defer tx.Rollback()

	// 1. First insert the food entry
	query := `
		INSERT INTO consumed_foods (
			user_id, food_id, food_name, quantity, calories, protein, carbs, fats,
			entry_date, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	result, err := tx.ExecContext(ctx, query,
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
		return fmt.Errorf("failed to insert food entry: %v", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("failed to get last insert ID: %v", err)
	}
	entry.ID = int(id)

	// 2. Now get the total nutrition for the date
	entryDate := time.Date(entry.Date.Year(), entry.Date.Month(), entry.Date.Day(), 0, 0, 0, 0, time.UTC)

	nutritionQuery := `
		SELECT 
			IFNULL(SUM(calories), 0) as total_calories,
			IFNULL(SUM(protein), 0) as total_protein,
			IFNULL(SUM(carbs), 0) as total_carbs,
			IFNULL(SUM(fats), 0) as total_fats
		FROM consumed_foods
		WHERE user_id = ? AND DATE(entry_date) = DATE(?)
	`

	var totalCalories, totalProtein, totalCarbs, totalFats float64
	err = tx.QueryRowContext(ctx, nutritionQuery, entry.UserID, entryDate).Scan(
		&totalCalories,
		&totalProtein,
		&totalCarbs,
		&totalFats,
	)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to calculate daily totals: %v", err)
	}

	// 3. Check if a daily entry already exists for this date
	var entryID int
	checkQuery := `
		SELECT id FROM daily_entries
		WHERE user_id = ? AND entry_date = DATE(?)
	`

	err = tx.QueryRowContext(ctx, checkQuery, entry.UserID, entryDate).Scan(&entryID)

	if err == sql.ErrNoRows {
		// No entry exists, insert a new one
		insertQuery := `
			INSERT INTO daily_entries (
				user_id, entry_date, total_calories, total_protein, total_carbs, total_fats
			) VALUES (?, ?, ?, ?, ?, ?)
		`

		_, err = tx.ExecContext(ctx, insertQuery,
			entry.UserID,
			entryDate,
			totalCalories,
			totalProtein,
			totalCarbs,
			totalFats,
		)
		if err != nil {
			return fmt.Errorf("failed to insert daily entry: %v", err)
		}
	} else if err == nil {
		// Entry exists, update it
		updateQuery := `
			UPDATE daily_entries SET
				total_calories = ?,
				total_protein = ?,
				total_carbs = ?,
				total_fats = ?
			WHERE id = ?
		`

		_, err = tx.ExecContext(ctx, updateQuery,
			totalCalories,
			totalProtein,
			totalCarbs,
			totalFats,
			entryID,
		)
		if err != nil {
			return fmt.Errorf("failed to update daily entry: %v", err)
		}
	} else {
		// Some other error occurred
		return fmt.Errorf("failed to check for existing daily entry: %v", err)
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

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
	// Start a transaction
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %v", err)
	}

	// Rollback is safe to call even if the tx is already closed
	defer tx.Rollback()

	// 1. First, get the entry details (we need user_id and date) before deleting
	query := `SELECT user_id, entry_date FROM consumed_foods WHERE id = ?`
	var userID int
	var entryDate time.Time

	err = tx.QueryRowContext(ctx, query, entryID).Scan(&userID, &entryDate)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("food entry not found")
		}
		return fmt.Errorf("failed to fetch food entry: %v", err)
	}

	// 2. Delete the food entry
	deleteQuery := `DELETE FROM consumed_foods WHERE id = ?`
	_, err = tx.ExecContext(ctx, deleteQuery, entryID)
	if err != nil {
		return fmt.Errorf("failed to delete food entry: %v", err)
	}

	// 3. Get the new total nutrition for the day (after deletion)
	dateOnly := time.Date(entryDate.Year(), entryDate.Month(), entryDate.Day(), 0, 0, 0, 0, time.UTC)

	nutritionQuery := `
		SELECT 
			IFNULL(SUM(calories), 0) as total_calories,
			IFNULL(SUM(protein), 0) as total_protein,
			IFNULL(SUM(carbs), 0) as total_carbs,
			IFNULL(SUM(fats), 0) as total_fats
		FROM consumed_foods
		WHERE user_id = ? AND DATE(entry_date) = DATE(?)
	`

	var totalCalories, totalProtein, totalCarbs, totalFats float64
	err = tx.QueryRowContext(ctx, nutritionQuery, userID, dateOnly).Scan(
		&totalCalories,
		&totalProtein,
		&totalCarbs,
		&totalFats,
	)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to calculate daily totals: %v", err)
	}

	// 4. Check if a daily entry exists for this date
	var dailyEntryID int
	checkQuery := `
		SELECT id FROM daily_entries
		WHERE user_id = ? AND entry_date = DATE(?)
	`

	err = tx.QueryRowContext(ctx, checkQuery, userID, dateOnly).Scan(&dailyEntryID)

	if err == sql.ErrNoRows {
		// No entry exists, create one if there are still entries for this day
		if totalCalories > 0 || totalProtein > 0 || totalCarbs > 0 || totalFats > 0 {
			insertQuery := `
				INSERT INTO daily_entries (
					user_id, entry_date, total_calories, total_protein, total_carbs, total_fats
				) VALUES (?, ?, ?, ?, ?, ?)
			`

			_, err = tx.ExecContext(ctx, insertQuery,
				userID,
				dateOnly,
				totalCalories,
				totalProtein,
				totalCarbs,
				totalFats,
			)
			if err != nil {
				return fmt.Errorf("failed to insert daily entry: %v", err)
			}
		}
	} else if err == nil {
		// Entry exists, update it or delete if no more entries
		if totalCalories > 0 || totalProtein > 0 || totalCarbs > 0 || totalFats > 0 {
			// Update with new totals
			updateQuery := `
				UPDATE daily_entries SET
					total_calories = ?,
					total_protein = ?,
					total_carbs = ?,
					total_fats = ?
				WHERE id = ?
			`

			_, err = tx.ExecContext(ctx, updateQuery,
				totalCalories,
				totalProtein,
				totalCarbs,
				totalFats,
				dailyEntryID,
			)
			if err != nil {
				return fmt.Errorf("failed to update daily entry: %v", err)
			}
		} else {
			// No more entries for this day, delete the daily entry
			deleteEntryQuery := `DELETE FROM daily_entries WHERE id = ?`
			_, err = tx.ExecContext(ctx, deleteEntryQuery, dailyEntryID)
			if err != nil {
				return fmt.Errorf("failed to delete daily entry: %v", err)
			}
		}
	} else {
		// Some other error occurred
		return fmt.Errorf("failed to check for existing daily entry: %v", err)
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
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

	// First, get all dates in the range to ensure we have a complete series
	datesQuery := `
		WITH RECURSIVE dates(date) AS (
			SELECT DATE(?)
			UNION ALL
			SELECT DATE_ADD(date, INTERVAL 1 DAY)
			FROM dates
			WHERE date < DATE(?)
		)
		SELECT DATE_FORMAT(date, '%Y-%m-%d') as date
		FROM dates
		ORDER BY date ASC
	`

	dateRows, err := r.db.QueryContext(ctx, datesQuery, startDate, endDate)
	if err != nil {
		fmt.Printf("[ERROR GetNutritionHistory] Dates query error: %v\n", err)
		return nil, fmt.Errorf("failed to query date range: %v", err)
	}
	defer dateRows.Close()

	// Create a map to store nutrition by date string
	nutritionByDate := make(map[string]*models.DailyNutrition)

	// Pre-populate with all dates in the range
	for dateRows.Next() {
		var dateStr string
		if err := dateRows.Scan(&dateStr); err != nil {
			return nil, fmt.Errorf("failed to scan date: %v", err)
		}

		date, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			return nil, fmt.Errorf("failed to parse date %s: %v", dateStr, err)
		}

		nutritionByDate[dateStr] = &models.DailyNutrition{
			Date:          date,
			TotalCalories: 0,
			TotalProtein:  0,
			TotalCarbs:    0,
			TotalFats:     0,
		}
	}

	// Next, get nutrition data from the daily_entries table (historical data)
	entriesQuery := `
		SELECT 
			DATE_FORMAT(entry_date, '%Y-%m-%d') as date,
			total_calories,
			total_protein,
			total_carbs,
			total_fats
		FROM daily_entries
		WHERE user_id = ? AND DATE(entry_date) BETWEEN DATE(?) AND DATE(?)
		ORDER BY entry_date ASC
	`

	entryRows, err := r.db.QueryContext(ctx, entriesQuery, userID, startDate, endDate)
	if err != nil {
		fmt.Printf("[ERROR GetNutritionHistory] Daily entries query error: %v\n", err)
		return nil, fmt.Errorf("failed to query daily entries: %v", err)
	}
	defer entryRows.Close()

	// Process entries from daily_entries table
	for entryRows.Next() {
		var nutrition models.DailyNutrition
		var dateStr string
		err := entryRows.Scan(
			&dateStr,
			&nutrition.TotalCalories,
			&nutrition.TotalProtein,
			&nutrition.TotalCarbs,
			&nutrition.TotalFats,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan daily entry row: %v", err)
		}

		// Parse the date string
		date, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			return nil, fmt.Errorf("failed to parse date %s: %v", dateStr, err)
		}
		nutrition.Date = date

		// Store in the map (overwrite any existing dates)
		fmt.Printf("[DEBUG GetNutritionHistory] Found historic entry for %s: Cal=%.2f, P=%.2f, C=%.2f, F=%.2f\n",
			dateStr, nutrition.TotalCalories, nutrition.TotalProtein, nutrition.TotalCarbs, nutrition.TotalFats)
		nutritionByDate[dateStr] = &nutrition
	}

	// Now, get data from consumed_foods for today (or any dates not in daily_entries)
	// This ensures we have the latest data for today
	todayStr := time.Now().Format("2006-01-02")
	fmt.Printf("[DEBUG GetNutritionHistory] Today's date is %s, retrieving fresh data for it\n", todayStr)

	// Query to get aggregated data from consumed_foods
	consumedFoodsQuery := `
		SELECT 
			DATE_FORMAT(DATE(entry_date), '%Y-%m-%d') as date,
			IFNULL(SUM(calories), 0) as total_calories,
			IFNULL(SUM(protein), 0) as total_protein,
			IFNULL(SUM(carbs), 0) as total_carbs,
			IFNULL(SUM(fats), 0) as total_fats
		FROM consumed_foods
		WHERE user_id = ? AND DATE(entry_date) = DATE(?)
		GROUP BY DATE(entry_date)
	`

	// Get today's data from consumed_foods
	var todayNutrition models.DailyNutrition
	err = r.db.QueryRowContext(ctx, consumedFoodsQuery, userID, todayStr).Scan(
		&todayStr,
		&todayNutrition.TotalCalories,
		&todayNutrition.TotalProtein,
		&todayNutrition.TotalCarbs,
		&todayNutrition.TotalFats,
	)

	if err != nil && err != sql.ErrNoRows {
		fmt.Printf("[ERROR GetNutritionHistory] Error getting today's data: %v\n", err)
	} else if err == nil {
		// If we successfully got today's data, use it
		todayDate, _ := time.Parse("2006-01-02", todayStr)
		todayNutrition.Date = todayDate

		fmt.Printf("[DEBUG GetNutritionHistory] Using today's data from consumed_foods: Cal=%.2f, P=%.2f, C=%.2f, F=%.2f\n",
			todayNutrition.TotalCalories, todayNutrition.TotalProtein, todayNutrition.TotalCarbs, todayNutrition.TotalFats)

		// Only add if today is in our date range
		if _, exists := nutritionByDate[todayStr]; exists {
			nutritionByDate[todayStr] = &todayNutrition
		}
	}

	// Convert the map to a slice in order of dates
	var history []*models.DailyNutrition
	currentDate := startDate
	for !currentDate.After(endDate) {
		dateStr := currentDate.Format("2006-01-02")
		if nutrition, exists := nutritionByDate[dateStr]; exists {
			history = append(history, nutrition)
			fmt.Printf("[DEBUG GetNutritionHistory] Adding %s to history: Cal=%.2f, P=%.2f, C=%.2f, F=%.2f\n",
				dateStr, nutrition.TotalCalories, nutrition.TotalProtein, nutrition.TotalCarbs, nutrition.TotalFats)
		}
		currentDate = currentDate.AddDate(0, 0, 1)
	}

	fmt.Printf("[DEBUG GetNutritionHistory] Returning %d days of nutrition data\n", len(history))
	return history, nil
}
