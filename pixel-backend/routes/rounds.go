package routes

import (
	"encoding/json"
	"net/http"

	"github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/core"
	routeutils "github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/routes/utils"
)

func InitRoundsRoutes() {
	http.HandleFunc("/get-rounds-config", getRoundsConfig)
}

func getRoundsConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		routeutils.WriteErrorJson(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	config := core.AFKBackend.RoundsConfig

	// Marshal the config to JSON
	configJson, err := json.Marshal(config)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Error marshalling config to JSON")
		return
	}

	routeutils.WriteDataJson(w, string(configJson))
}
