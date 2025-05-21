package repositories

import (
	"context"
	"database/sql"
	"errors"
	"time"

	models "HabitBite/backend/Models"

	"github.com/jmoiron/sqlx"
)

// Common errors
var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrDatabaseOperation = errors.New("database operation failed")
)

// UserRepository defines the interface for user data access
type UserRepository interface {
	CreateUser(ctx context.Context, user *models.User) error
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	FindByUsername(ctx context.Context, username string) (*models.User, error)
	FindByID(ctx context.Context, id int) (*models.User, error)
	UpdateUser(ctx context.Context, user *models.User) error
	DeleteUser(ctx context.Context, id int) error

	// User Goals methods
	GetUserGoals(ctx context.Context, userID int) (*models.UserGoals, error)
	UpdateUserGoals(ctx context.Context, goals *models.UserGoals) error
	SyncUserCalorieGoal(ctx context.Context, userID int, calorieGoal int) error
}

// userRepository implements UserRepository
type userRepository struct {
	db *sqlx.DB
}

// NewUserRepository creates a new UserRepository
func NewUserRepository(db *sqlx.DB) UserRepository {
	return &userRepository{db: db}
}

// CreateUser creates a new user in the database
func (r *userRepository) CreateUser(ctx context.Context, user *models.User) error {
	// Start a transaction to ensure user and goals are created atomically
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return wrapDatabaseError(err)
	}
	defer tx.Rollback()

	// Check if user with email already exists
	existingUser, err := r.FindByEmail(ctx, user.Email)
	if err != nil && !errors.Is(err, ErrUserNotFound) {
		return err
	}
	if existingUser != nil {
		return ErrUserAlreadyExists
	}

	// Check if user with username already exists
	existingUser, err = r.FindByUsername(ctx, user.Username)
	if err != nil && !errors.Is(err, ErrUserNotFound) {
		return err
	}
	if existingUser != nil {
		return ErrUserAlreadyExists
	}

	// Set creation time
	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now

	query := `INSERT INTO users (
        email, username, password_hash, full_name, birthdate, gender, 
        height, weight, goal_type, activity_level, daily_calorie_goal, role, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	result, err := tx.ExecContext(ctx, query,
		user.Email, user.Username, user.PasswordHash, user.FullName,
		user.Birthdate, user.Gender, user.Height, user.Weight,
		user.GoalType, user.ActivityLevel, user.DailyCalorieGoal, user.Role, user.CreatedAt, user.UpdatedAt)

	if err != nil {
		return wrapDatabaseError(err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return wrapDatabaseError(err)
	}

	user.ID = int(id)

	// Calculate macronutrient targets based on goal type
	var targetProtein, targetCarbs, targetFats float64
	caloriesFromProtein := 4.0 // 4 calories per gram of protein
	caloriesFromCarbs := 4.0   // 4 calories per gram of carbs
	caloriesFromFats := 9.0    // 9 calories per gram of fat

	switch user.GoalType {
	case "lose":
		// For weight loss: protein 35%, fats 35%, carbs 30%
		targetProtein = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromProtein
		targetFats = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromFats
		targetCarbs = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromCarbs
	case "maintain":
		// For weight maintenance: protein 25%, fats 25%, carbs 50%
		targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
		targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
		targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
	case "gain":
		// For weight gain: protein 30%, fats 25%, carbs 45%
		targetProtein = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromProtein
		targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
		targetCarbs = float64(user.DailyCalorieGoal) * 0.45 / caloriesFromCarbs
	default:
		// Default to maintenance if goal type is invalid
		targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
		targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
		targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
	}

	targetWeight := user.Weight // Default target weight is current weight

	// Create user goals with calculated macronutrient targets
	goalsQuery := `INSERT INTO user_goals (
		user_id, target_calories, target_protein, target_carbs, target_fats, target_weight
	) VALUES (?, ?, ?, ?, ?, ?)`

	_, err = tx.ExecContext(ctx, goalsQuery,
		user.ID, user.DailyCalorieGoal, targetProtein, targetCarbs, targetFats, targetWeight)

	if err != nil {
		return wrapDatabaseError(err)
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		return wrapDatabaseError(err)
	}

	return nil
}

// FindByEmail finds a user by email
func (r *userRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `SELECT * FROM users WHERE email = ? LIMIT 1`
	var user models.User
	err := r.db.GetContext(ctx, &user, query, email)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, wrapDatabaseError(err)
	}

	return &user, nil
}

// FindByUsername finds a user by username
func (r *userRepository) FindByUsername(ctx context.Context, username string) (*models.User, error) {
	query := `SELECT * FROM users WHERE username = ? LIMIT 1`
	var user models.User
	err := r.db.GetContext(ctx, &user, query, username)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, wrapDatabaseError(err)
	}

	return &user, nil
}

// FindByID finds a user by ID
func (r *userRepository) FindByID(ctx context.Context, id int) (*models.User, error) {
	query := `SELECT * FROM users WHERE id = ? LIMIT 1`
	var user models.User
	err := r.db.GetContext(ctx, &user, query, id)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, wrapDatabaseError(err)
	}

	return &user, nil
}

// UpdateUser updates an existing user
func (r *userRepository) UpdateUser(ctx context.Context, user *models.User) error {
	// Start a transaction for atomicity
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return wrapDatabaseError(err)
	}
	defer tx.Rollback()

	user.UpdatedAt = time.Now()

	query := `UPDATE users SET 
		email = ?, username = ?, password_hash = ?, full_name = ?, 
		birthdate = ?, gender = ?, height = ?, weight = ?, 
		goal_type = ?, activity_level = ?, daily_calorie_goal = ?, role = ?, updated_at = ?
		WHERE id = ?`

	result, err := tx.ExecContext(ctx, query,
		user.Email, user.Username, user.PasswordHash, user.FullName,
		user.Birthdate, user.Gender, user.Height, user.Weight,
		user.GoalType, user.ActivityLevel, user.DailyCalorieGoal, user.Role, user.UpdatedAt,
		user.ID)

	if err != nil {
		return wrapDatabaseError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return wrapDatabaseError(err)
	}

	if rowsAffected == 0 {
		return ErrUserNotFound
	}

	// Also update target_calories in user_goals to keep them in sync
	goalsUpdateQuery := `
		UPDATE user_goals 
		SET target_calories = ? 
		WHERE user_id = ?
	`

	_, err = tx.ExecContext(ctx, goalsUpdateQuery, user.DailyCalorieGoal, user.ID)
	if err != nil {
		// If no user_goals record exists, create one with calculated macronutrient targets
		if errors.Is(err, sql.ErrNoRows) {
			// Calculate macronutrient targets based on goal type
			var targetProtein, targetCarbs, targetFats float64
			caloriesFromProtein := 4.0 // 4 calories per gram of protein
			caloriesFromCarbs := 4.0   // 4 calories per gram of carbs
			caloriesFromFats := 9.0    // 9 calories per gram of fat

			switch user.GoalType {
			case "lose":
				// For weight loss: protein 35%, fats 35%, carbs 30%
				targetProtein = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromProtein
				targetFats = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromFats
				targetCarbs = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromCarbs
			case "maintain":
				// For weight maintenance: protein 25%, fats 25%, carbs 50%
				targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
				targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
				targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
			case "gain":
				// For weight gain: protein 30%, fats 25%, carbs 45%
				targetProtein = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromProtein
				targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
				targetCarbs = float64(user.DailyCalorieGoal) * 0.45 / caloriesFromCarbs
			default:
				// Default to maintenance if goal type is invalid
				targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
				targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
				targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
			}

			insertQuery := `
				INSERT INTO user_goals (user_id, target_calories, target_protein, target_carbs, target_fats, target_weight)
				VALUES (?, ?, ?, ?, ?, ?)
			`
			_, err = tx.ExecContext(ctx, insertQuery, user.ID, user.DailyCalorieGoal, targetProtein, targetCarbs, targetFats, user.Weight)
			if err != nil {
				return wrapDatabaseError(err)
			}
		} else {
			return wrapDatabaseError(err)
		}
	} else {
		// If the update was successful, also update the macronutrient targets
		// Calculate macronutrient targets based on goal type
		var targetProtein, targetCarbs, targetFats float64
		caloriesFromProtein := 4.0 // 4 calories per gram of protein
		caloriesFromCarbs := 4.0   // 4 calories per gram of carbs
		caloriesFromFats := 9.0    // 9 calories per gram of fat

		switch user.GoalType {
		case "lose":
			// For weight loss: protein 35%, fats 35%, carbs 30%
			targetProtein = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromProtein
			targetFats = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromFats
			targetCarbs = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromCarbs
		case "maintain":
			// For weight maintenance: protein 25%, fats 25%, carbs 50%
			targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
			targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
			targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
		case "gain":
			// For weight gain: protein 30%, fats 25%, carbs 45%
			targetProtein = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromProtein
			targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
			targetCarbs = float64(user.DailyCalorieGoal) * 0.45 / caloriesFromCarbs
		default:
			// Default to maintenance if goal type is invalid
			targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
			targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
			targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
		}

		// Update macronutrient targets
		macroUpdateQuery := `
			UPDATE user_goals 
			SET target_protein = ?, target_carbs = ?, target_fats = ?
			WHERE user_id = ?
		`
		_, err = tx.ExecContext(ctx, macroUpdateQuery, targetProtein, targetCarbs, targetFats, user.ID)
		if err != nil {
			return wrapDatabaseError(err)
		}
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		return wrapDatabaseError(err)
	}

	return nil
}

// DeleteUser deletes a user by ID
func (r *userRepository) DeleteUser(ctx context.Context, id int) error {
	// Start a transaction
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return wrapDatabaseError(err)
	}
	defer tx.Rollback()

	// Delete from user_goals first (due to foreign key constraints)
	goalsQuery := `DELETE FROM user_goals WHERE user_id = ?`
	_, err = tx.ExecContext(ctx, goalsQuery, id)
	if err != nil {
		return wrapDatabaseError(err)
	}

	// Then delete the user
	userQuery := `DELETE FROM users WHERE id = ?`
	result, err := tx.ExecContext(ctx, userQuery, id)
	if err != nil {
		return wrapDatabaseError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return wrapDatabaseError(err)
	}

	if rowsAffected == 0 {
		return ErrUserNotFound
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		return wrapDatabaseError(err)
	}

	return nil
}

// GetUserGoals retrieves a user's goals
func (r *userRepository) GetUserGoals(ctx context.Context, userID int) (*models.UserGoals, error) {
	query := `SELECT * FROM user_goals WHERE user_id = ?`
	var goals models.UserGoals

	err := r.db.GetContext(ctx, &goals, query, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// If no goals exist, get the user and create default goals
			user, err := r.FindByID(ctx, userID)
			if err != nil {
				return nil, err
			}

			// Calculate macronutrient targets based on goal type
			var targetProtein, targetCarbs, targetFats float64
			caloriesFromProtein := 4.0 // 4 calories per gram of protein
			caloriesFromCarbs := 4.0   // 4 calories per gram of carbs
			caloriesFromFats := 9.0    // 9 calories per gram of fat

			switch user.GoalType {
			case "lose":
				// For weight loss: protein 35%, fats 35%, carbs 30%
				targetProtein = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromProtein
				targetFats = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromFats
				targetCarbs = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromCarbs
			case "maintain":
				// For weight maintenance: protein 25%, fats 25%, carbs 50%
				targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
				targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
				targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
			case "gain":
				// For weight gain: protein 30%, fats 25%, carbs 45%
				targetProtein = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromProtein
				targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
				targetCarbs = float64(user.DailyCalorieGoal) * 0.45 / caloriesFromCarbs
			default:
				// Default to maintenance if goal type is invalid
				targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
				targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
				targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
			}

			// Create default goals based on user
			goals = models.UserGoals{
				UserID:         userID,
				TargetCalories: user.DailyCalorieGoal,
				TargetProtein:  targetProtein,
				TargetCarbs:    targetCarbs,
				TargetFats:     targetFats,
				TargetWeight:   user.Weight,
			}

			// Save the default goals
			err = r.UpdateUserGoals(ctx, &goals)
			if err != nil {
				return nil, err
			}

			return &goals, nil
		}
		return nil, wrapDatabaseError(err)
	}

	return &goals, nil
}

// UpdateUserGoals updates a user's goals
func (r *userRepository) UpdateUserGoals(ctx context.Context, goals *models.UserGoals) error {
	// Start a transaction
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return wrapDatabaseError(err)
	}
	defer tx.Rollback()

	// Get user's goal type to calculate macros
	var goalType string
	userQuery := `SELECT goal_type FROM users WHERE id = ?`
	err = tx.GetContext(ctx, &goalType, userQuery, goals.UserID)
	if err != nil {
		return wrapDatabaseError(err)
	}

	// Calculate macronutrient targets based on goal type
	caloriesFromProtein := 4.0 // 4 calories per gram of protein
	caloriesFromCarbs := 4.0   // 4 calories per gram of carbs
	caloriesFromFats := 9.0    // 9 calories per gram of fat

	switch goalType {
	case "lose":
		// For weight loss: protein 35%, fats 35%, carbs 30%
		goals.TargetProtein = float64(goals.TargetCalories) * 0.35 / caloriesFromProtein
		goals.TargetFats = float64(goals.TargetCalories) * 0.35 / caloriesFromFats
		goals.TargetCarbs = float64(goals.TargetCalories) * 0.30 / caloriesFromCarbs
	case "maintain":
		// For weight maintenance: protein 25%, fats 25%, carbs 50%
		goals.TargetProtein = float64(goals.TargetCalories) * 0.25 / caloriesFromProtein
		goals.TargetFats = float64(goals.TargetCalories) * 0.25 / caloriesFromFats
		goals.TargetCarbs = float64(goals.TargetCalories) * 0.50 / caloriesFromCarbs
	case "gain":
		// For weight gain: protein 30%, fats 25%, carbs 45%
		goals.TargetProtein = float64(goals.TargetCalories) * 0.30 / caloriesFromProtein
		goals.TargetFats = float64(goals.TargetCalories) * 0.25 / caloriesFromFats
		goals.TargetCarbs = float64(goals.TargetCalories) * 0.45 / caloriesFromCarbs
	default:
		// Default to maintenance if goal type is invalid
		goals.TargetProtein = float64(goals.TargetCalories) * 0.25 / caloriesFromProtein
		goals.TargetFats = float64(goals.TargetCalories) * 0.25 / caloriesFromFats
		goals.TargetCarbs = float64(goals.TargetCalories) * 0.50 / caloriesFromCarbs
	}

	// Check if the goals exist
	checkQuery := `SELECT 1 FROM user_goals WHERE user_id = ?`
	var exists bool
	err = tx.GetContext(ctx, &exists, checkQuery, goals.UserID)

	var result sql.Result
	if err != nil && errors.Is(err, sql.ErrNoRows) {
		// Insert new goals
		insertQuery := `
			INSERT INTO user_goals (
				user_id, target_calories, target_protein, target_carbs, target_fats, target_weight
			) VALUES (?, ?, ?, ?, ?, ?)
		`
		result, err = tx.ExecContext(ctx, insertQuery,
			goals.UserID, goals.TargetCalories, goals.TargetProtein,
			goals.TargetCarbs, goals.TargetFats, goals.TargetWeight)
	} else {
		// Update existing goals
		updateQuery := `
			UPDATE user_goals SET
				target_calories = ?, target_protein = ?, target_carbs = ?, 
				target_fats = ?, target_weight = ?
			WHERE user_id = ?
		`
		result, err = tx.ExecContext(ctx, updateQuery,
			goals.TargetCalories, goals.TargetProtein, goals.TargetCarbs,
			goals.TargetFats, goals.TargetWeight, goals.UserID)
	}

	if err != nil {
		return wrapDatabaseError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return wrapDatabaseError(err)
	}

	if rowsAffected == 0 {
		return ErrUserNotFound
	}

	// Also update the daily_calorie_goal in the users table to keep them in sync
	userUpdateQuery := `
		UPDATE users 
		SET daily_calorie_goal = ?, updated_at = ?
		WHERE id = ?
	`

	_, err = tx.ExecContext(ctx, userUpdateQuery, goals.TargetCalories, time.Now(), goals.UserID)
	if err != nil {
		return wrapDatabaseError(err)
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		return wrapDatabaseError(err)
	}

	return nil
}

// SyncUserCalorieGoal synchronizes the calorie goal between users and user_goals tables
func (r *userRepository) SyncUserCalorieGoal(ctx context.Context, userID int, calorieGoal int) error {
	// Start a transaction
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return wrapDatabaseError(err)
	}
	defer tx.Rollback()

	// Update users table
	userUpdateQuery := `
		UPDATE users 
		SET daily_calorie_goal = ?, updated_at = ?
		WHERE id = ?
	`

	userResult, err := tx.ExecContext(ctx, userUpdateQuery, calorieGoal, time.Now(), userID)
	if err != nil {
		return wrapDatabaseError(err)
	}

	userRowsAffected, err := userResult.RowsAffected()
	if err != nil {
		return wrapDatabaseError(err)
	}

	if userRowsAffected == 0 {
		return ErrUserNotFound
	}

	// Get user's goal type to calculate macros
	var goalType string
	goalTypeQuery := `SELECT goal_type FROM users WHERE id = ?`
	err = tx.GetContext(ctx, &goalType, goalTypeQuery, userID)
	if err != nil {
		return wrapDatabaseError(err)
	}

	// Calculate macronutrient targets based on goal type
	caloriesFromProtein := 4.0 // 4 calories per gram of protein
	caloriesFromCarbs := 4.0   // 4 calories per gram of carbs
	caloriesFromFats := 9.0    // 9 calories per gram of fat

	var targetProtein, targetCarbs, targetFats float64

	switch goalType {
	case "lose":
		// For weight loss: protein 35%, fats 35%, carbs 30%
		targetProtein = float64(calorieGoal) * 0.35 / caloriesFromProtein
		targetFats = float64(calorieGoal) * 0.35 / caloriesFromFats
		targetCarbs = float64(calorieGoal) * 0.30 / caloriesFromCarbs
	case "maintain":
		// For weight maintenance: protein 25%, fats 25%, carbs 50%
		targetProtein = float64(calorieGoal) * 0.25 / caloriesFromProtein
		targetFats = float64(calorieGoal) * 0.25 / caloriesFromFats
		targetCarbs = float64(calorieGoal) * 0.50 / caloriesFromCarbs
	case "gain":
		// For weight gain: protein 30%, fats 25%, carbs 45%
		targetProtein = float64(calorieGoal) * 0.30 / caloriesFromProtein
		targetFats = float64(calorieGoal) * 0.25 / caloriesFromFats
		targetCarbs = float64(calorieGoal) * 0.45 / caloriesFromCarbs
	default:
		// Default to maintenance if goal type is invalid
		targetProtein = float64(calorieGoal) * 0.25 / caloriesFromProtein
		targetFats = float64(calorieGoal) * 0.25 / caloriesFromFats
		targetCarbs = float64(calorieGoal) * 0.50 / caloriesFromCarbs
	}

	// Check if user_goals record exists
	checkQuery := `SELECT 1 FROM user_goals WHERE user_id = ?`
	var exists bool
	err = tx.GetContext(ctx, &exists, checkQuery, userID)

	if err != nil && errors.Is(err, sql.ErrNoRows) {
		// Get user details
		var weight float64
		weightQuery := `SELECT weight FROM users WHERE id = ?`
		err = tx.GetContext(ctx, &weight, weightQuery, userID)
		if err != nil {
			return wrapDatabaseError(err)
		}

		// No record exists, insert one
		insertQuery := `
			INSERT INTO user_goals (
				user_id, target_calories, target_protein, target_carbs, target_fats, target_weight
			) VALUES (?, ?, ?, ?, ?, ?)
		`
		_, err = tx.ExecContext(ctx, insertQuery, userID, calorieGoal, targetProtein, targetCarbs, targetFats, weight)
	} else {
		// Record exists, update it
		updateQuery := `
			UPDATE user_goals 
			SET target_calories = ?, target_protein = ?, target_carbs = ?, target_fats = ?
			WHERE user_id = ?
		`
		_, err = tx.ExecContext(ctx, updateQuery, calorieGoal, targetProtein, targetCarbs, targetFats, userID)
	}

	if err != nil {
		return wrapDatabaseError(err)
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		return wrapDatabaseError(err)
	}

	return nil
}

// wrapDatabaseError wraps SQL errors with a common error type
func wrapDatabaseError(err error) error {
	return errors.Join(ErrDatabaseOperation, err)
}
