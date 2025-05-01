package config

import (
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
	port, _ := strconv.Atoi(os.Getenv("DB_PORT"))

	return &Config{
		DBHost:       os.Getenv("DB_HOST"),
		DBPort:       port,
		DBUser:       os.Getenv("DB_USER"),
		DBPassword:   os.Getenv("DB_PASS"),
		DBName:       os.Getenv("DB_NAME"),
		JWTSecret:    os.Getenv("JWT_SECRET"),
		CookieDomain: os.Getenv("COOKIE_DOMAIN"),
		ServerPort:   os.Getenv("APP_PORT"),
	}, nil
}
