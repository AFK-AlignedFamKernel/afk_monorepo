package core

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/config"
)

type Databases struct {
	DatabaseConfig *config.DatabaseConfig

	Redis    *redis.Client
	Postgres *pgxpool.Pool
}

func NewDatabases(databaseConfig *config.DatabaseConfig) *Databases {
	d := &Databases{}
	d.DatabaseConfig = databaseConfig

	// Define a context
	ctx := context.Background()

	// address := os.Getenv("REDIS_HOST") + ":" + os.Getenv("REDIS_PORT")

	redisHost := os.Getenv("REDIS_HOST")
	fmt.Println("Redis host:", redisHost)

	redisPort := os.Getenv("REDISPORT")
	fmt.Println("Redis port:", redisPort)

	// redisPort := strconv.Itoa(os.Getenv("REDIS_PORT"))
	// address := redisHost + ":" + redisPort
	address := redisHost + ":" + redisPort
	fmt.Println("Redis address:", address)

	password := os.Getenv("REDIS_PASSWORD")
	fmt.Println("Redis password:", password)

	redisUsername := os.Getenv("REDIS_USERNAME")
	fmt.Println("Redis username:", redisUsername)

	// Connect to Redis
	d.Redis = redis.NewClient(&redis.Options{
		Addr:     address,
		Password: password,
		Username: redisUsername,
		DB:       0,
	})

	pong, err := d.Redis.Ping(ctx).Result()
	if err != nil {
		fmt.Println("Failed to connect to Redis:", err)
		// return
	}
	fmt.Println("Redis connection established:", pong)

	postgresHost := os.Getenv("PG_HOST")
	fmt.Println("Postgres host:", postgresHost)
	postgresPort := os.Getenv("PG_PORT")
	fmt.Println("Postgres port:", postgresPort)
	postgresDatabase := os.Getenv("PG_DATABASE")
	fmt.Println("Postgres database:", postgresDatabase)

	// Connect to Postgres
	// postgresConnString := "postgresql://" + databaseConfig.Postgres.User + ":" + os.Getenv("POSTGRES_PASSWORD") + "@" + databaseConfig.Postgres.Host + ":" + strconv.Itoa(databaseConfig.Postgres.Port) + "/" + databaseConfig.Postgres.Database
	postgresConnString := "postgresql://" + os.Getenv("POSTGRES_USER") + ":" + os.Getenv("POSTGRES_PASSWORD") + "@" + os.Getenv("PG_HOST") + ":" + os.Getenv("PG_PORT") + "/" + os.Getenv("PG_DATABASE")
	fmt.Println("Postgres connection string:", postgresConnString)

	// Create connection pool
	pgPool, err := pgxpool.New(context.Background(), postgresConnString)
	if err != nil {
		fmt.Println("Failed to create connection pool:", err)
		panic(err)
	}

	// Verify connection with a ping
	err = pgPool.Ping(context.Background())
	if err != nil {
		fmt.Println("Failed to ping database:", err)
		panic(err)
	}

	// Test query to verify database is accessible
	var result int
	err = pgPool.QueryRow(context.Background(), "SELECT 1").Scan(&result)
	if err != nil {
		fmt.Println("Test query failed:", err)
		panic(err)
	}
	fmt.Println("Successfully connected to PostgreSQL database")

	d.Postgres = pgPool

	return d
}

func (d *Databases) Close() {
	d.Redis.Close()
	d.Postgres.Close()
}

func PostgresQuery[RowType any](query string, args ...interface{}) ([]RowType, error) {
	var result []RowType
	err := pgxscan.Select(context.Background(), AFKBackend.Databases.Postgres, &result, query, args...)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func PostgresQueryOne[RowType any](query string, args ...interface{}) (*RowType, error) {
	var result RowType
	err := pgxscan.Get(context.Background(), AFKBackend.Databases.Postgres, &result, query, args...)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

func PostgresQueryJson[RowType any](query string, args ...interface{}) ([]byte, error) {
	result, err := PostgresQuery[RowType](query, args...)
	if err != nil {
		return nil, err
	}

	json, err := json.Marshal(result)
	if err != nil {
		return nil, err
	}

	return json, nil
}

func PostgresQueryOneJson[RowType any](query string, args ...interface{}) ([]byte, error) {
	result, err := PostgresQueryOne[RowType](query, args...)
	if err != nil {
		return nil, err
	}

	json, err := json.Marshal(result)
	if err != nil {
		return nil, err
	}

	return json, nil
}
