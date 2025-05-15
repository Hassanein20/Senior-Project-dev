package Controllers

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	config "HabitBite/backend/Config"
	middleware "HabitBite/backend/Middleware"
	models "HabitBite/backend/Models"
	repositories "HabitBite/backend/Repositories"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthController handles authentication-related operations
type AuthController struct {
	userRepo repositories.UserRepository
	config   *config.Config
}

// NewAuthController creates a new AuthController
func NewAuthController(repo repositories.UserRepository, cfg *config.Config) *AuthController {
	return &AuthController{
		userRepo: repo,
		config:   cfg,
	}
}

// RegisterRequest represents the request body for user registration
type RegisterRequest struct {
	Email         string  `json:"email" binding:"required,email"`
	Username      string  `json:"username" binding:"required,alphanum,min=3,max=50"`
	Password      string  `json:"password" binding:"required,min=8"`
	FullName      string  `json:"fullName" binding:"required"`
	Birthdate     string  `json:"birthdate" binding:"required"`
	Gender        string  `json:"gender" binding:"required,oneof=male female other"`
	Height        float64 `json:"height" binding:"required,gt=0"`
	Weight        float64 `json:"weight" binding:"required,gt=0"`
	GoalType      string  `json:"goalType" binding:"required,oneof=lose gain maintain"`
	ActivityLevel string  `json:"activityLevel" binding:"required,oneof=sedentary light moderate active very_active"`
}

// LoginRequest represents the request body for user login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse represents the response body for successful authentication
type AuthResponse struct {
	User  *models.AuthUser `json:"user"`
	Token string           `json:"token"`
}

// Register handles user registration
func (ac *AuthController) Register(c *gin.Context) {
	log.Println("Register endpoint called")

	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Error binding JSON: %v", err)
		log.Printf("Request body: %v", c.Request.Body)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	log.Printf("Registration request received for email: %s", req.Email)
	log.Printf("Request data: %+v", req)

	// Parse birthdate
	birthdate, err := time.Parse("2006-01-02", req.Birthdate)
	if err != nil {
		log.Printf("Invalid birthdate format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid birthdate format. Use YYYY-MM-DD"})
		return
	}

	// Check if user already exists
	existingUser, err := ac.userRepo.FindByEmail(c.Request.Context(), req.Email)
	if err != nil && !errors.Is(err, repositories.ErrUserNotFound) {
		log.Printf("Error checking if user exists: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check user existence"})
		return
	}
	if existingUser != nil {
		log.Printf("User already exists with email: %s", req.Email)
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	// Create user
	user := &models.User{
		Email:         req.Email,
		Username:      req.Username,
		FullName:      req.FullName,
		Birthdate:     birthdate,
		Gender:        req.Gender,
		Height:        req.Height,
		Weight:        req.Weight,
		GoalType:      req.GoalType,
		ActivityLevel: req.ActivityLevel,
		Role:          models.RoleUser,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
		DailyCalorieGoal: calculateDailyCalorieGoal(
			req.Weight,
			req.Height,
			req.Gender,
			time.Now().Year()-birthdate.Year(),
			req.ActivityLevel,
			req.GoalType,
		),
	}

	// Set password
	if err := user.SetPassword(req.Password); err != nil {
		log.Printf("Error hashing password: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
		return
	}

	log.Printf("Attempting to create user in database with data: %+v", user)
	if err := ac.userRepo.CreateUser(c.Request.Context(), user); err != nil {
		log.Printf("Error creating user: %v", err)
		if errors.Is(err, repositories.ErrUserAlreadyExists) {
			c.JSON(http.StatusConflict, gin.H{"error": "Username or email already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	log.Printf("User created successfully with ID: %d", user.ID)

	// Generate tokens
	accessToken, refreshToken, err := ac.generateAuthTokens(user)
	if err != nil {
		log.Printf("Error generating tokens: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	// Set refresh token in HTTP-only cookie
	ac.setRefreshTokenCookie(c, refreshToken)

	// Set CSRF token
	if err := middleware.SetCSRFToken(c); err != nil {
		log.Printf("Error setting CSRF token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set CSRF token"})
		return
	}

	// Return success response with user data and tokens
	c.JSON(http.StatusCreated, gin.H{
		"user": gin.H{
			"id":            user.ID,
			"email":         user.Email,
			"username":      user.Username,
			"fullName":      user.FullName,
			"birthdate":     user.Birthdate.Format("2006-01-02"),
			"gender":        user.Gender,
			"height":        user.Height,
			"weight":        user.Weight,
			"goalType":      user.GoalType,
			"activityLevel": user.ActivityLevel,
			"role":          user.Role,
		},
		"token":   accessToken,
		"message": "User registered successfully",
	})
}

// Login handles user login
func (ac *AuthController) Login(c *gin.Context) {
	var req LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Login validation error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid email or password format",
			"details": validationErrors(err),
		})
		return
	}

	// Trim and lowercase email
	email := strings.ToLower(strings.TrimSpace(req.Email))
	log.Printf("Login attempt for email: %s", email)

	// Find user by email
	user, err := ac.userRepo.FindByEmail(c.Request.Context(), email)
	if err != nil {
		if errors.Is(err, repositories.ErrUserNotFound) {
			log.Printf("User not found for email: %s", email)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}

		log.Printf("Error finding user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Authentication failed"})
		return
	}

	// Verify password
	if !user.CheckPassword(req.Password) {
		log.Printf("Invalid password for user: %s", email)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate tokens
	accessToken, refreshToken, err := ac.generateAuthTokens(user)
	if err != nil {
		log.Printf("Error generating tokens: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	// Set refresh token in HTTP-only cookie
	ac.setRefreshTokenCookie(c, refreshToken)

	// Set CSRF token
	if err := middleware.SetCSRFToken(c); err != nil {
		log.Printf("Error setting CSRF token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set CSRF token"})
		return
	}

	// Return user data and access token
	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":            user.ID,
			"email":         user.Email,
			"username":      user.Username,
			"fullName":      user.FullName,
			"birthdate":     user.Birthdate.Format("2006-01-02"),
			"gender":        user.Gender,
			"height":        user.Height,
			"weight":        user.Weight,
			"goalType":      user.GoalType,
			"activityLevel": user.ActivityLevel,
			"role":          user.Role,
		},
		"token": accessToken,
	})
}

// Logout handles user logout
func (ac *AuthController) Logout(c *gin.Context) {
	// Clear auth cookie
	c.SetCookie(
		"auth_token",
		"",
		-1, // Expire immediately
		"/",
		ac.config.CookieDomain,
		true, // Secure
		true, // HttpOnly
	)

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// GetCurrentUser returns the current authenticated user
func (ac *AuthController) GetCurrentUser(c *gin.Context) {
	// Get user ID from context (set by AuthMiddleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Convert interface{} to int
	id, ok := userID.(float64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get user from database
	user, err := ac.userRepo.FindByID(c.Request.Context(), int(id))
	if err != nil {
		if errors.Is(err, repositories.ErrUserNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			return
		}

		log.Printf("Error finding user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user"})
		return
	}

	// Return user data
	c.JSON(http.StatusOK, gin.H{
		"user": user.ToAuthUser(),
	})
}

// RefreshToken refreshes the JWT token
func (ac *AuthController) RefreshToken(c *gin.Context) {
	// Get user ID from context (set by AuthMiddleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Convert interface{} to int
	id, ok := userID.(float64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get user from database
	user, err := ac.userRepo.FindByID(c.Request.Context(), int(id))
	if err != nil {
		if errors.Is(err, repositories.ErrUserNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			return
		}

		log.Printf("Error finding user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to refresh token"})
		return
	}

	// Generate new JWT token
	token, err := ac.generateJWT(user)
	if err != nil {
		log.Printf("Error generating JWT: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to refresh token"})
		return
	}

	// Set cookie
	ac.setAuthCookie(c, token)

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user.ToAuthUser(),
	})
}

// GetCSRFToken generates and returns a new CSRF token
func (ac *AuthController) GetCSRFToken(c *gin.Context) {
	// Set CSRF token
	if err := middleware.SetCSRFToken(c); err != nil {
		log.Printf("Error setting CSRF token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate CSRF token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "CSRF token generated successfully",
	})
}

// generateJWT generates a JWT token for the given user
func (ac *AuthController) generateJWT(user *models.User) (string, error) {
	// Create claims
	expirationTime := time.Now().Add(ac.config.JWTExpiryDuration())
	claims := jwt.MapClaims{
		"sub":  user.ID,
		"name": user.Username,
		"role": user.Role,
		"iat":  time.Now().Unix(),
		"exp":  expirationTime.Unix(),
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token with secret key
	tokenString, err := token.SignedString([]byte(ac.config.JWTSecret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %v", err)
	}

	return tokenString, nil
}

// setAuthCookie sets the authentication cookie
func (ac *AuthController) setAuthCookie(c *gin.Context, token string) {
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie(
		"auth_token",
		token,
		3600*ac.config.JWTExpiryHours, // Cookie expiry time in seconds
		"/",                           // Path
		ac.config.CookieDomain,        // Domain
		true,                          // Secure flag (HTTPS only)
		true,                          // HttpOnly (not accessible via JavaScript)
	)
}

// validationErrors formats validation errors for better readability
func validationErrors(err error) interface{} {
	if err == nil {
		return nil
	}

	// This is a simple implementation - for production code,
	// you might want to use a library like go-playground/validator
	// and format the errors more nicely
	return err.Error()
}

// calculateDailyCalorieGoal calculates the user's daily calorie goal
func calculateDailyCalorieGoal(weight, height float64, gender string, age int, activityLevel, goalType string) int {
	// Height is already in centimeters, no need to convert
	heightInCm := height

	// Basic BMR calculation (Mifflin-St Jeor Equation)
	var bmr float64
	if gender == "male" {
		bmr = 10*weight + 6.25*heightInCm - 5*float64(age) + 5
	} else {
		bmr = 10*weight + 6.25*heightInCm - 5*float64(age) - 161
	}

	// Activity multiplier
	activityMultiplier := 1.2 // sedentary
	switch activityLevel {
	case "light":
		activityMultiplier = 1.375
	case "moderate":
		activityMultiplier = 1.55
	case "active":
		activityMultiplier = 1.725
	case "very_active":
		activityMultiplier = 1.9
	}

	// Calculate TDEE (Total Daily Energy Expenditure)
	tdee := bmr * activityMultiplier

	// Adjust based on goal
	switch goalType {
	case "lose":
		tdee -= 500 // 500 calorie deficit
	case "gain":
		tdee += 500 // 500 calorie surplus
	}

	return int(tdee)
}

// generateAuthTokens generates access and refresh tokens for a user
func (ac *AuthController) generateAuthTokens(user *models.User) (string, string, error) {
	// Generate access token
	accessToken, err := ac.generateAccessToken(user)
	if err != nil {
		return "", "", err
	}

	// Generate refresh token
	refreshToken, err := ac.generateRefreshToken(user)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

// generateAccessToken generates a JWT access token for a user
func (ac *AuthController) generateAccessToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"role":  user.Role,
		"exp":   time.Now().Add(time.Hour * 24).Unix(), // 24 hours
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(ac.config.JWTSecret))
}

// generateRefreshToken generates a JWT refresh token for a user
func (ac *AuthController) generateRefreshToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":  user.ID,
		"type": "refresh",
		"exp":  time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(ac.config.JWTSecret))
}

// setRefreshTokenCookie sets the refresh token in an HTTP-only cookie
func (ac *AuthController) setRefreshTokenCookie(c *gin.Context, token string) {
	c.SetCookie(
		"refresh_token",
		token,
		7*24*60*60, // 7 days
		"/",
		"",
		true, // secure
		true, // httpOnly
	)
}
