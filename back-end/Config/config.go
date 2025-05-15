package config

import (
	"errors"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds all configuration parameters for the application
type Config struct {
	// Database
	DBHost     string
	DBPort     int
	DBUser     string
	DBPassword string
	DBName     string

	// Authentication and security
	JWTSecret      string
	JWTExpiryHours int
	CookieDomain   string
	CookieSecure   bool

	// Server
	ServerPort         string
	CORSAllowedOrigins []string

	// Environment
	Environment string // "development", "testing", or "production"
}

// LoadConfig loads configuration from environment variables
func LoadConfig() (*Config, error) {
	// Default configuration for local development
	config := &Config{
		// Database (XAMPP defaults)
		DBHost:     "localhost",
		DBPort:     3306,
		DBUser:     "root",
		DBPassword: "", // XAMPP default has no password
		DBName:     "habitbite",

		// Authentication and security
		JWTSecret:      "your_development_secret_key", // Change this in production
		JWTExpiryHours: 24,
		CookieDomain:   "localhost",
		CookieSecure:   false, // Set to false for development, true for production

		// Server
		ServerPort:         "8080",
		CORSAllowedOrigins: []string{"http://localhost:3000", "http://localhost:5173"},

		// Environment
		Environment: "development",
	}

	// Override with environment variables if they exist
	if port := os.Getenv("DB_PORT"); port != "" {
		if p, err := strconv.Atoi(port); err == nil {
			config.DBPort = p
		}
	}
	if host := os.Getenv("DB_HOST"); host != "" {
		config.DBHost = host
	}
	if user := os.Getenv("DB_USER"); user != "" {
		config.DBUser = user
	}
	if pass := os.Getenv("DB_PASS"); pass != "" {
		config.DBPassword = pass
	}
	if name := os.Getenv("DB_NAME"); name != "" {
		config.DBName = name
	}
	if secret := os.Getenv("JWT_SECRET"); secret != "" {
		config.JWTSecret = secret
	}
	if port := os.Getenv("APP_PORT"); port != "" {
		config.ServerPort = port
	}
	if env := os.Getenv("APP_ENV"); env != "" {
		config.Environment = env
	}
	if secure := os.Getenv("COOKIE_SECURE"); secure != "" {
		config.CookieSecure = secure == "true"
	}
	if domain := os.Getenv("COOKIE_DOMAIN"); domain != "" {
		config.CookieDomain = domain
	}
	if origins := os.Getenv("CORS_ALLOWED_ORIGINS"); origins != "" {
		config.CORSAllowedOrigins = strings.Split(origins, ",")
	}

	return config, nil
}

// JWTExpiryDuration returns the JWT expiry duration
func (c *Config) JWTExpiryDuration() time.Duration {
	return time.Duration(c.JWTExpiryHours) * time.Hour
}

// IsDevelopment returns true if the application is running in development mode
func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

// IsProduction returns true if the application is running in production mode
func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}

// Validate checks if the configuration is valid
func (c *Config) Validate() error {
	if c.JWTSecret == "" {
		return errors.New("JWT_SECRET is required")
	}

	if c.JWTExpiryHours <= 0 {
		return errors.New("JWT_EXPIRY_HOURS must be positive")
	}

	return nil
}
