package main

import (
	"flag"
	"log"

	"github.com/AFK-AlignedFamKernel/afk_monorepo/backend/config"
	"github.com/AFK-AlignedFamKernel/afk_monorepo/backend/core"
	"github.com/AFK-AlignedFamKernel/afk_monorepo/backend/routes"

	"github.com/joho/godotenv"
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
    if err != nil {
        log.Fatal("Error loading .env file")
    }
	
	canvasConfigFilename := flag.String("canvas-config", config.DefaultCanvasConfigPath, "Canvas config file")
	backendConfigFilename := flag.String("backend-config", config.DefaultBackendConfigPath, "Backend config file")
	production := flag.Bool("production", false, "Production mode")
	admin := flag.Bool("admin", false, "Admin mode")

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

	if isFlagSet("production") {
		backendConfig.Production = *production
	}

	databases := core.NewDatabases(databaseConfig)
	defer databases.Close()

	core.AFKBackend = core.NewBackend(databases, canvasConfig, backendConfig, *admin)

	routes.InitRoutes()

	core.AFKBackend.Start(core.AFKBackend.BackendConfig.Port)
}
