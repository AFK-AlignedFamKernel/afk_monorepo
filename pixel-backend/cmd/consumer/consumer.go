package main

import (
	"flag"
	"github.com/joho/godotenv"
	"github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/config"
	"github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/core"
	"github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/routes"
	"github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/routes/indexer"
)

func isFlagSet(name string) bool {
	found := false
	flag.Visit(func(f *flag.Flag) {
		if f.Name == name {
			found = true
		}
	})
	return found
}

func main() {
	err := godotenv.Load()

	roundsConfigFilename := flag.String("rounds-config", config.DefaultRoundsConfigPath, "Rounds config file")
	canvasConfigFilename := flag.String("canvas-config", config.DefaultCanvasConfigPath, "Canvas config file")
	// databaseConfigFilename := flag.String("database-config", config.DefaultDatabaseConfigPath, "Database config file")
	backendConfigFilename := flag.String("backend-config", config.DefaultBackendConfigPath, "Backend config file")
	production := flag.Bool("production", false, "Production mode")

	flag.Parse()

	roundsConfig, err := config.LoadRoundsConfig(*roundsConfigFilename)
	if err != nil {
		panic(err)
	}

	canvasConfig, err := config.LoadCanvasConfig(*canvasConfigFilename)
	if err != nil {
		panic(err)
	}

	// databaseConfig, err := config.LoadDatabaseConfig(*databaseConfigFilename)
	databaseConfig, err := config.LoadDatabaseConfig()
	if err != nil {
		panic(err)
	}

	backendConfig, err := config.LoadBackendConfig(*backendConfigFilename)
	if err != nil {
		panic(err)
	}

	if isFlagSet("production") {
		backendConfig.Production = *production
	}

	databases := core.NewDatabases(databaseConfig)
	defer databases.Close()

	core.AFKBackend = core.NewBackend(databases, roundsConfig, canvasConfig, backendConfig, false)

	routes.InitBaseRoutes()
	indexer.InitIndexerRoutes()
	routes.InitNFTStaticRoutes()
	routes.InitWorldsStaticRoutes()
	indexer.StartMessageProcessor()

	core.AFKBackend.Start(core.AFKBackend.BackendConfig.ConsumerPort)
}
