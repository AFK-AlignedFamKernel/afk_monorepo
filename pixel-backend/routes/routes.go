package routes

import (
	"net/http"

	routeutils "github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/routes/utils"
)

func InitBaseRoutes() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			routeutils.HandlePreflight(w, r)
			return
		}
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
	InitWorldsRoutes()
	InitStencilsRoutes()
	InitStencilsStaticRoutes()
	InitRoundsRoutes()
}
