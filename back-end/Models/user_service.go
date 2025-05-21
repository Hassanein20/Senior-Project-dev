package models

import (
	"context"
	"log"
)

// UserService provides higher-level operations for user management
// with automatic synchronization between users and user_goals tables
type UserService struct {
	userRepo UserRepository
}

// UserRepository defines the interface that the repository must implement
// This is defined here to avoid circular imports
type UserRepository interface {
	CreateUser(ctx context.Context, user *User) error
	FindByEmail(ctx context.Context, email string) (*User, error)
	FindByUsername(ctx context.Context, username string) (*User, error)
	FindByID(ctx context.Context, id int) (*User, error)
	UpdateUser(ctx context.Context, user *User) error
	DeleteUser(ctx context.Context, id int) error
	GetUserGoals(ctx context.Context, userID int) (*UserGoals, error)
	UpdateUserGoals(ctx context.Context, goals *UserGoals) error
	SyncUserCalorieGoal(ctx context.Context, userID int, calorieGoal int) error
}

// NewUserService creates a new user service
func NewUserService(repo UserRepository) *UserService {
	return &UserService{
		userRepo: repo,
	}
}

// CreateUser creates a new user with synchronized goals
func (s *UserService) CreateUser(ctx context.Context, user *User) error {
	// The repository already creates a user_goals record with the same calorie goal
	return s.userRepo.CreateUser(ctx, user)
}

// UpdateUser updates a user and ensures calorie goals are synchronized
func (s *UserService) UpdateUser(ctx context.Context, user *User) error {
	// First, check if the user exists and get their current calorie goal
	existingUser, err := s.userRepo.FindByID(ctx, user.ID)
	if err != nil {
		return err
	}

	// Check if the calorie goal has changed
	if existingUser.DailyCalorieGoal != user.DailyCalorieGoal {
		log.Printf("Calorie goal changed from %d to %d for user %d",
			existingUser.DailyCalorieGoal, user.DailyCalorieGoal, user.ID)

		// Update the user first
		if err := s.userRepo.UpdateUser(ctx, user); err != nil {
			return err
		}

		// Then ensure user_goals is synchronized
		return s.userRepo.SyncUserCalorieGoal(ctx, user.ID, user.DailyCalorieGoal)
	}

	// If calorie goal hasn't changed, just update the user
	return s.userRepo.UpdateUser(ctx, user)
}

// GetUserWithGoals retrieves a user with their goals
func (s *UserService) GetUserWithGoals(ctx context.Context, userID int) (*User, *UserGoals, error) {
	// Get the user
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, nil, err
	}

	// Get the user's goals
	goals, err := s.userRepo.GetUserGoals(ctx, userID)
	if err != nil {
		return user, nil, err
	}

	// Ensure calorie goals are synchronized
	if user.DailyCalorieGoal != goals.TargetCalories {
		log.Printf("Calorie goal mismatch detected: user=%d, goals=%d for user %d",
			user.DailyCalorieGoal, goals.TargetCalories, userID)

		// Use the value from user as the source of truth
		goals.TargetCalories = user.DailyCalorieGoal

		// Update the goals in the database
		if err := s.userRepo.UpdateUserGoals(ctx, goals); err != nil {
			log.Printf("Failed to synchronize calorie goals: %v", err)
		}
	}

	return user, goals, nil
}

// UpdateUserGoals updates a user's goals and ensures calorie goals are synchronized
func (s *UserService) UpdateUserGoals(ctx context.Context, goals *UserGoals) error {
	// First, check if the goals exist
	existingGoals, err := s.userRepo.GetUserGoals(ctx, goals.UserID)
	if err != nil {
		// If goals don't exist, create them
		return s.userRepo.UpdateUserGoals(ctx, goals)
	}

	// Check if calorie goal has changed
	if existingGoals.TargetCalories != goals.TargetCalories {
		log.Printf("Target calories changed from %d to %d for user %d",
			existingGoals.TargetCalories, goals.TargetCalories, goals.UserID)

		// Update the goals first
		if err := s.userRepo.UpdateUserGoals(ctx, goals); err != nil {
			return err
		}

		// Then ensure user.daily_calorie_goal is synchronized
		return s.userRepo.SyncUserCalorieGoal(ctx, goals.UserID, goals.TargetCalories)
	}

	// If calorie goal hasn't changed, just update the goals
	return s.userRepo.UpdateUserGoals(ctx, goals)
}

// UpdateCalorieGoal updates both user and goals calorie values atomically
func (s *UserService) UpdateCalorieGoal(ctx context.Context, userID int, calorieGoal int) error {
	return s.userRepo.SyncUserCalorieGoal(ctx, userID, calorieGoal)
}

// GetUserGoals retrieves a user's goals with synchronization check
func (s *UserService) GetUserGoals(ctx context.Context, userID int) (*UserGoals, error) {
	// Get the user
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Get the user's goals
	goals, err := s.userRepo.GetUserGoals(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Ensure calorie goals are synchronized
	if user.DailyCalorieGoal != goals.TargetCalories {
		log.Printf("Calorie goal mismatch detected: user=%d, goals=%d for user %d",
			user.DailyCalorieGoal, goals.TargetCalories, userID)

		// Use the value from user as the source of truth
		goals.TargetCalories = user.DailyCalorieGoal

		// Update the goals in the database
		if err := s.userRepo.UpdateUserGoals(ctx, goals); err != nil {
			log.Printf("Failed to synchronize calorie goals: %v", err)
		}
	}

	return goals, nil
}

// FindUserByEmail retrieves a user by their email address
func (s *UserService) FindUserByEmail(ctx context.Context, email string) (*User, error) {
	return s.userRepo.FindByEmail(ctx, email)
}

// FindByID retrieves a user by their ID
func (s *UserService) FindByID(ctx context.Context, id int) (*User, error) {
	return s.userRepo.FindByID(ctx, id)
}
