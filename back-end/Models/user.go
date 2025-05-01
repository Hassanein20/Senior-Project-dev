package models

import "time"

type User struct {
	ID            int       `db:"id" json:"id"`
	Email         string    `db:"email" json:"email"`
	Username      string    `db:"username" json:"username"`
	PasswordHash  string    `db:"password_hash" json:"-"`
	FullName      string    `db:"full_name" json:"fullName"`
	Birthdate     time.Time `db:"birthdate" json:"birthdate"`
	Gender        string    `db:"gender" json:"gender"`
	Height        float64   `db:"height" json:"height"`
	Weight        float64   `db:"weight" json:"weight"`
	GoalType      string    `db:"goal_type" json:"goalType"`
	ActivityLevel string    `db:"activity_level" json:"activityLevel"`
	Role          string    `db:"role" json:"role"`
	CreatedAt     time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt     time.Time `db:"updated_at" json:"updatedAt"`
}
