package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	DBHost       string
	DBPort       int
	DBUser       string
	DBPassword   string
	DBName       string
	JWTSecret    string
	CookieDomain string
	ServerPort   string
}

func LoadConfig() (*Config, error) {
	port, err := strconv.Atoi(os.Getenv("DB_PORT"))
	if err != nil {
		return nil, fmt.Errorf("invalid DB_PORT: %v", err)
	}

	return &Config{
		DBHost:       getEnv("DB_HOST", "localhost"),
		DBPort:       port,
		DBUser:       getEnv("DB_USER", "root"),
		DBPassword:   getEnv("DB_PASS", ""),
		DBName:       getEnv("DB_NAME", "calorie_tracker"),
		JWTSecret:    getEnv("JWT_SECRET", "default-secret"),
		CookieDomain: getEnv("COOKIE_DOMAIN", "localhost"),
		ServerPort:   getEnv("APP_PORT", "8080"),
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
