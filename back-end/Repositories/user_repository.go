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
        height, weight, goal_type, activity_level, role, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	result, err := r.db.ExecContext(ctx, query,
		user.Email, user.Username, user.PasswordHash, user.FullName,
		user.Birthdate, user.Gender, user.Height, user.Weight,
		user.GoalType, user.ActivityLevel, user.Role, user.CreatedAt, user.UpdatedAt)

	if err != nil {
		return wrapDatabaseError(err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return wrapDatabaseError(err)
	}

	user.ID = int(id)
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
	user.UpdatedAt = time.Now()

	query := `UPDATE users SET 
		email = ?, username = ?, password_hash = ?, full_name = ?, 
		birthdate = ?, gender = ?, height = ?, weight = ?, 
		goal_type = ?, activity_level = ?, role = ?, updated_at = ?
		WHERE id = ?`

	result, err := r.db.ExecContext(ctx, query,
		user.Email, user.Username, user.PasswordHash, user.FullName,
		user.Birthdate, user.Gender, user.Height, user.Weight,
		user.GoalType, user.ActivityLevel, user.Role, user.UpdatedAt,
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

	return nil
}

// DeleteUser deletes a user by ID
func (r *userRepository) DeleteUser(ctx context.Context, id int) error {
	query := `DELETE FROM users WHERE id = ?`

	result, err := r.db.ExecContext(ctx, query, id)
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

	return nil
}

// wrapDatabaseError wraps SQL errors with a common error type
func wrapDatabaseError(err error) error {
	return errors.Join(ErrDatabaseOperation, err)
}
