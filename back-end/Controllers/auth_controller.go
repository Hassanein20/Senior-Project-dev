package Controllers

import (
	config "HabitBite/backend/Config"
	"net/http"
	"time"

	models "HabitBite/backend/Models"
	repositories "HabitBite/backend/Repositories"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"golang.org/x/crypto/bcrypt"
)

type AuthController struct {
	userRepo repositories.UserRepository
	config   *config.Config
}

func NewAuthController(repo repositories.UserRepository, cfg *config.Config) *AuthController {
	return &AuthController{
		userRepo: repo,
		config:   cfg,
	}
}

func (ac *AuthController) Register(c *gin.Context) {
	var req struct {
		Email         string  `json:"email" binding:"required,email"`
		Username      string  `json:"username" binding:"required,alphanum,min=3,max=50"`
		Password      string  `json:"password" binding:"required,min=8"`
		FullName      string  `json:"fullName" binding:"required"`
		Birthdate     string  `json:"birthdate" binding:"required"`
		Gender        string  `json:"gender" binding:"required"`
		Height        float64 `json:"height" binding:"required"`
		Weight        float64 `json:"weight" binding:"required"`
		GoalType      string  `json:"goalType" binding:"required"`
		ActivityLevel string  `json:"activityLevel" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	birthdate, err := time.Parse("2006-01-02", req.Birthdate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid birthdate format"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := &models.User{
		Email:         req.Email,
		Username:      req.Username,
		PasswordHash:  string(hashedPassword),
		FullName:      req.FullName,
		Birthdate:     birthdate,
		Gender:        req.Gender,
		Height:        req.Height,
		Weight:        req.Weight,
		GoalType:      req.GoalType,
		ActivityLevel: req.ActivityLevel,
		Role:          "user",
	}

	if err := ac.userRepo.CreateUser(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully"})
}

func (ac *AuthController) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := ac.userRepo.FindByEmail(c.Request.Context(), req.Email)
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.ID,
		"role": user.Role,
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString([]byte(ac.config.JWTSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie(
		"auth_token",
		tokenString,
		3600*24,
		"/",
		ac.config.CookieDomain,
		true, // Secure flag
		true, // HttpOnly flag
	)

	user.PasswordHash = ""
	c.JSON(http.StatusOK, gin.H{
		"user":  user,
		"token": tokenString,
	})
}
