package config

import (
	"fmt"
	"os"
	"strconv"
)

type RedisConfig struct {
	Host     string
	Port     int
	Password string
}

type PostgresConfig struct {
	Host     string
	Port     int
	User     string
	Database string
}

type DatabaseConfig struct {
	Redis    RedisConfig
	Postgres PostgresConfig
}

func LoadDatabaseConfig() (*DatabaseConfig, error) {
	redisPort, err := strconv.Atoi(os.Getenv("REDIS_PORT"))
	if err != nil {
		return nil, fmt.Errorf("invalid REDIS_PORT: %v", err)
	}

	postgresPort, err := strconv.Atoi(os.Getenv("POSTGRES_PORT"))
	if err != nil {
		return nil, fmt.Errorf("invalid POSTGRES_PORT: %v", err)
	}

	config := DatabaseConfig{
		Redis: RedisConfig{
			Host:     os.Getenv("REDIS_HOST"),
			Port:     redisPort,
			Password: os.Getenv("REDIS_PASSWORD"),
		},
		Postgres: PostgresConfig{
			Host:     os.Getenv("POSTGRES_HOST"),
			Port:     postgresPort,
			User:     os.Getenv("POSTGRES_USER"),
			Database: os.Getenv("POSTGRES_DATABASE"),
		},
	}

	return &config, nil
}
