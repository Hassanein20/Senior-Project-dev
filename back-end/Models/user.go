package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

// User represents a user in the system
type User struct {
	ID               int       `db:"id" json:"id"`
	Email            string    `db:"email" json:"email"`
	Username         string    `db:"username" json:"username"`
	PasswordHash     string    `db:"password_hash" json:"-"`
	FullName         string    `db:"full_name" json:"fullName"`
	Birthdate        time.Time `db:"birthdate" json:"birthdate"`
	Gender           string    `db:"gender" json:"gender"`
	Height           float64   `db:"height" json:"height"`
	Weight           float64   `db:"weight" json:"weight"`
	GoalType         string    `db:"goal_type" json:"goalType"`
	ActivityLevel    string    `db:"activity_level" json:"activityLevel"`
	DailyCalorieGoal int       `db:"daily_calorie_goal" json:"dailyCalorieGoal"`
	Role             string    `db:"role" json:"role"`
	CreatedAt        time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt        time.Time `db:"updated_at" json:"updatedAt"`
}

// SetPassword hashes and sets the user's password
func (u *User) SetPassword(password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hashedPassword)
	return nil
}

// CheckPassword checks if the provided password matches the stored hash
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

// SanitizeUser removes sensitive information for API responses
func (u *User) SanitizeUser() *User {
	// Create a copy of the user
	sanitized := *u

	// Remove sensitive information
	sanitized.PasswordHash = ""

	return &sanitized
}

// UserRole constants
const (
	RoleUser      = "user"
	RoleAdmin     = "admin"
	RoleDietitian = "dietitian"
)

// GoalType constants
const (
	GoalLose     = "lose"
	GoalGain     = "gain"
	GoalMaintain = "maintain"
)

// ActivityLevel constants
const (
	ActivitySedentary  = "sedentary"
	ActivityLight      = "light"
	ActivityModerate   = "moderate"
	ActivityActive     = "active"
	ActivityVeryActive = "very_active"
)

// AuthUser contains user information for authentication responses
type AuthUser struct {
	ID               int       `json:"id"`
	Email            string    `json:"email"`
	Username         string    `json:"username"`
	FullName         string    `json:"fullName"`
	Role             string    `json:"role"`
	GoalType         string    `json:"goalType"`
	ActivityLevel    string    `json:"activityLevel"`
	Gender           string    `json:"gender"`
	Height           float64   `json:"height"`
	Weight           float64   `json:"weight"`
	Birthdate        time.Time `json:"birthdate"`
	DailyCalorieGoal int       `json:"dailyCalorieGoal"`
}

// ToAuthUser converts a User to AuthUser
func (u *User) ToAuthUser() *AuthUser {
	return &AuthUser{
		ID:               u.ID,
		Email:            u.Email,
		Username:         u.Username,
		FullName:         u.FullName,
		Role:             u.Role,
		GoalType:         u.GoalType,
		ActivityLevel:    u.ActivityLevel,
		Gender:           u.Gender,
		Height:           u.Height,
		Weight:           u.Weight,
		Birthdate:        u.Birthdate,
		DailyCalorieGoal: u.DailyCalorieGoal,
	}
}
