package repositories

import (
	models "HabitBite/backend/Models"
	"context"
	"database/sql"

	"github.com/jmoiron/sqlx"
)

type UserRepository interface {
	CreateUser(ctx context.Context, user *models.User) error
	FindByEmail(ctx context.Context, email string) (*models.User, error)
}

type userRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) CreateUser(ctx context.Context, user *models.User) error {
	query := `INSERT INTO users (
        email, username, password_hash, full_name, birthdate, gender, 
        height, weight, goal_type, activity_level, role
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := r.db.ExecContext(ctx, query,
		user.Email, user.Username, user.PasswordHash, user.FullName,
		user.Birthdate, user.Gender, user.Height, user.Weight,
		user.GoalType, user.ActivityLevel, user.Role)

	return err
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `SELECT * FROM users WHERE email = ? LIMIT 1`
	var user models.User
	err := r.db.GetContext(ctx, &user, query, email)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &user, err
}
