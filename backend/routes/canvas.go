package routes

import (
	"context"
	"net/http"

	"github.com/AFK-AlignedFamKernel/afk_monorepo/backend/core"
	routeutils "github.com/AFK-AlignedFamKernel/afk_monorepo/backend/routes/utils"
)

func InitCanvasRoutes() {
	http.HandleFunc("/init-canvas", initCanvas)
	http.HandleFunc("/get-canvas", getCanvas)
}

func initCanvas(w http.ResponseWriter, r *http.Request) {
	// Only allow admin to initialize canvas
	if routeutils.AdminMiddleware(w, r) {
		return
	}

	if core.AFKBackend.Databases.Redis.Exists(context.Background(), "canvas").Val() == 0 {
		totalBitSize := core.AFKBackend.CanvasConfig.Canvas.Width * core.AFKBackend.CanvasConfig.Canvas.Height * core.AFKBackend.CanvasConfig.ColorsBitWidth
		totalByteSize := (totalBitSize / 8)
		if totalBitSize%8 != 0 {
			// Round up to nearest byte
			totalByteSize += 1
		}

		// Create canvas
		canvas := make([]byte, totalByteSize)
		ctx := context.Background()
		err := core.AFKBackend.Databases.Redis.Set(ctx, "canvas", canvas, 0).Err()
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to initialize canvas")
			return
		}

		routeutils.WriteResultJson(w, "Canvas initialized")
	} else {
		routeutils.WriteErrorJson(w, http.StatusConflict, "Canvas already initialized")
	}
}

func getCanvas(w http.ResponseWriter, r *http.Request) {
	routeutils.SetupAccessHeaders(w)

	ctx := context.Background()
	val, err := core.AFKBackend.Databases.Redis.Get(ctx, "canvas").Result()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get canvas")
		return
	}

	w.Write([]byte(val))
}
