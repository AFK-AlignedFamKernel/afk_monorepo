package core

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strconv"

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
	// redisPort := strconv.Itoa(os.Getenv("REDIS_PORT"))
	// address := redisHost + ":" + redisPort
	address := redisHost + ":" + strconv.Itoa(databaseConfig.Redis.Port)
	fmt.Println("Redis address:", address)

	password := os.Getenv("REDIS_PASSWORD")
	fmt.Println("Redis password:", password)
	
	// Connect to Redis
	d.Redis = redis.NewClient(&redis.Options{
		Addr:     address,
		Password: password,
		DB:       0,
	})

	pong, err := d.Redis.Ping(ctx).Result()
	if err != nil {
		fmt.Println("Failed to connect to Redis:", err)
		// return
	}
	fmt.Println("Redis connection established:", pong)

	// Connect to Postgres
	// postgresConnString := "postgresql://" + databaseConfig.Postgres.User + ":" + os.Getenv("POSTGRES_PASSWORD") + "@" + databaseConfig.Postgres.Host + ":" + strconv.Itoa(databaseConfig.Postgres.Port) + "/" + databaseConfig.Postgres.Database

	postgresConnString := "postgresql://" + os.Getenv("POSTGRES_USER") + ":" + os.Getenv("POSTGRES_PASSWORD") + "@" + os.Getenv("PG_HOST") + ":" + os.Getenv("PG_PORT") + "/" + os.Getenv("PG_DATABASE")
	fmt.Println("Postgres connection string:", postgresConnString)
	// TODO: crd_audit?sslmode=disable
	pgPool, err := pgxpool.New(context.Background(), postgresConnString)
	if err != nil {
		fmt.Println("Failed to connect to Postgres:", err)

		panic(err)
	}
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
