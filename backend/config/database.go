package config

import (
	"os"
	"strconv"
	"fmt"
)

type RedisConfig struct {
	Host string `json:"host"`
	Port int    `json:"port"`
}

type PostgresConfig struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	User     string `json:"user"`
	Database string `json:"database"`
}

type DatabaseConfig struct {
	Redis    RedisConfig    `json:"redis"`
	Postgres PostgresConfig `json:"postgres"`
}

var DefaultDatabaseConfig = DatabaseConfig{
	Redis: RedisConfig{
		Host: "localhost",
		Port: 6379,
	},
	Postgres: PostgresConfig{
		Host:     "localhost",
		Port:     5432,
		User:     "afk-user",
		Database: "afk-db",
	},
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
		Host: os.Getenv("REDIS_HOST"),
		Port: redisPort,
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
