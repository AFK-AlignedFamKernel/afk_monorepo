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

	"github.com/AFK-AlignedFamKernel/afk_monorepo/backend/config"
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

	address := databaseConfig.Redis.Host + ":" + strconv.Itoa(databaseConfig.Redis.Port)
	fmt.Println("Redis address:", address)

	// Connect to Redis
	d.Redis = redis.NewClient(&redis.Options{
		Addr:     address,
		Password: os.Getenv("REDIS_PASSWORD"), // TODO: Read from env
		DB:       0,
	})

	// Test the connection
	pong, err := d.Redis.Ping(ctx).Result()
	if err != nil {
		fmt.Println("Failed to connect to Redis:", err)
		// return
	}
	fmt.Println("Redis connection established:", pong)

	// Connect to Postgres
	// Define a context
	postgresConnString := "postgresql://" + databaseConfig.Postgres.User + ":" + os.Getenv("POSTGRES_PASSWORD") + "@" + databaseConfig.Postgres.Host + ":" + strconv.Itoa(databaseConfig.Postgres.Port) + "/" + databaseConfig.Postgres.Database
	// TODO: crd_audit?sslmode=disable
	pgPool, err := pgxpool.New(context.Background(), postgresConnString)
	if err != nil {
		panic(err)
	}
	d.Postgres = pgPool

	// Test and ping PG connection to DB

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
