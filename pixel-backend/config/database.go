package config

import (
	"fmt"
	"os"
	"strconv"
)

type RedisConfig struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Password string `json:"password"`
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
		Host:     "localhost",
		Port:     6379,
		Password: "password",
	},
	Postgres: PostgresConfig{
		Host:     "localhost",
		Port:     5432,
		User:     "art-peace-user",
		Database: "art-peace-db",
	},
}

// var DefaultDatabaseConfigPath = "./configs/database.config.json"

// func LoadDatabaseConfig(databaseConfigPath string) (*DatabaseConfig, error) {
func LoadDatabaseConfig() (*DatabaseConfig, error) {
	
	fmt.Println("REDIS_PORT:", os.Getenv("REDIS_PORT"))
	redisPort, err := strconv.Atoi(os.Getenv("REDIS_PORT"))
	
	fmt.Println("Redis port:", redisPort)
	if err != nil {
		// return nil, fmt.Errorf("invalid REDIS_PORT: %v", err)
		return nil, fmt.Errorf("invalid REDIS_PORT: %v", err)
	}

	postgresPort, err := strconv.Atoi(os.Getenv("POSTGRES_PORT"))
	fmt.Println("Postgres port:", postgresPort)
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
	// file, err := os.Open(databaseConfigPath)
	// if err != nil {
	// 	return nil, err
	// }
	// defer file.Close()

	// decoder := json.NewDecoder(file)
	// config := DatabaseConfig{}
	// err = decoder.Decode(&config)
	// if err != nil {
	// 	return nil, err
	// }

	return &config, nil
}
