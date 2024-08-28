package routes

import (
	"net/http"

	routeutils "github.com/AFK-AlignedFamKernel/afk_monorepo/backend/routes/utils"
)

func InitBaseRoutes() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		routeutils.SetupHeaders(w)
		w.WriteHeader(http.StatusOK)
	})
}

func InitRoutes() {
	InitBaseRoutes()
	InitCanvasRoutes()
	InitPixelRoutes()
	InitFactionRoutes()
	InitTemplateRoutes()
	InitUserRoutes()
	InitContractRoutes()
	InitNFTRoutes()
	InitQuestsRoutes()
	InitColorsRoutes()
	InitVotableColorsRoutes()
}
