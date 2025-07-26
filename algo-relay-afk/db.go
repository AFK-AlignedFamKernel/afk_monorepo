package main

import (
	"database/sql"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

const migrationDir = "sql"

func getDBConnection() (*sql.DB, error) {
	loadEnv()

	dbUser := os.Getenv("POSTGRES_USER")
	dbPassword := os.Getenv("POSTGRES_PASSWORD")
	dbName := os.Getenv("POSTGRES_DB")
	dbPort := os.Getenv("POSTGRES_PORT")
	dbHost := os.Getenv("POSTGRES_HOST")

	if dbUser == "" || dbPassword == "" || dbName == "" || dbPort == "" || dbHost == "" {
		return nil, fmt.Errorf("missing required environment variables")
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable", dbHost, dbUser, dbPassword, dbName, dbPort)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("error opening db: %v", err)
	}

	db.SetMaxOpenConns(100)                 // Maximum number of open connections to the database
	db.SetMaxIdleConns(25)                  // Maximum number of idle connections in the pool
	db.SetConnMaxLifetime(time.Minute * 30) // Maximum lifetime of a connection

	err = db.Ping()
	if err != nil {
		return nil, fmt.Errorf("error connecting to the db: %v", err)
	}

	initDB(db)

	return db, nil
}

func initDB(db *sql.DB) error {
	log.Println("Checking and applying migrations")

	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS migrations (
			id SERIAL PRIMARY KEY,
			filename TEXT UNIQUE NOT NULL,
			applied_at TIMESTAMP DEFAULT NOW()
		);
	`)
	if err != nil {
		return fmt.Errorf("error creating migrations table: %v", err)
	}

	appliedMigrations, err := getAppliedMigrations(db)
	if err != nil {
		return err
	}

	migrationFiles, err := readMigrationFiles(migrationDir)
	if err != nil {
		return err
	}

	sort.Strings(migrationFiles)

	for _, file := range migrationFiles {
		if _, alreadyApplied := appliedMigrations[file]; alreadyApplied {
			log.Printf("Skipping already applied migration: %s", file)
			continue
		}

		log.Printf("Applying migration: %s", file)
		if err := applyMigration(db, file); err != nil {
			return err
		}
		log.Printf("Migration applied successfully: %s", file)
	}

	log.Println("All migrations applied successfully")
	return nil
}

func getAppliedMigrations(db *sql.DB) (map[string]bool, error) {
	rows, err := db.Query("SELECT filename FROM migrations")
	if err != nil {
		return nil, fmt.Errorf("error fetching applied migrations: %v", err)
	}
	defer rows.Close()

	applied := make(map[string]bool)
	for rows.Next() {
		var filename string
		if err := rows.Scan(&filename); err != nil {
			return nil, err
		}
		applied[filename] = true
	}
	return applied, nil
}

func readMigrationFiles(directory string) ([]string, error) {
	var migrationFiles []string

	err := filepath.WalkDir(directory, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() && strings.HasSuffix(d.Name(), ".sql") {
			migrationFiles = append(migrationFiles, path)
		}
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("error reading migration files: %v", err)
	}

	return migrationFiles, nil
}

func applyMigration(db *sql.DB, filepath string) error {
	migrationSQL, err := os.ReadFile(filepath)
	if err != nil {
		return fmt.Errorf("error reading migration file %s: %v", filepath, err)
	}

	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("error starting transaction: %v", err)
	}

	_, err = tx.Exec(string(migrationSQL))
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("error applying migration %s: %v", filepath, err)
	}

	_, err = tx.Exec("INSERT INTO migrations (filename, applied_at) VALUES ($1, $2)", filepath, time.Now())
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("error recording migration %s: %v", filepath, err)
	}

	return tx.Commit()
}
