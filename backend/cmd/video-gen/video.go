package main

import (
	"flag"

	"github.com/AFK-AlignedFamKernel/afk_monorepo/backend/config"
	"github.com/AFK-AlignedFamKernel/afk_monorepo/backend/core"
	"github.com/AFK-AlignedFamKernel/afk_monorepo/backend/routes"
	"github.com/AFK-AlignedFamKernel/afk_monorepo/backend/routes/indexer"
)

func main() {
	canvasConfigFilename := flag.String("canvas-config", config.DefaultCanvasConfigPath, "Canvas config file")
	backendConfigFilename := flag.String("backend-config", config.DefaultBackendConfigPath, "Backend config file")

	flag.Parse()

	canvasConfig, err := config.LoadCanvasConfig(*canvasConfigFilename)
	if err != nil {
		panic(err)
	}

	databaseConfig, err := config.LoadDatabaseConfig()
	if err != nil {
		panic(err)
	}

	backendConfig, err := config.LoadBackendConfig(*backendConfigFilename)
	if err != nil {
		panic(err)
	}

	databases := core.NewDatabases(databaseConfig)
	defer databases.Close()

	core.AFKBackend = core.NewBackend(databases, canvasConfig, backendConfig, true)

	routes.InitBaseRoutes()
	routes.InitCanvasRoutes()
	indexer.InitIndexerRoutes()
	indexer.StartMessageProcessor()

	core.AFKBackend.Start(core.AFKBackend.BackendConfig.ConsumerPort)
}
