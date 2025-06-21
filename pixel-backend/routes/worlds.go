package routes

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/core"
	routeutils "github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/routes/utils"
)

// TODO: check-worlds-name-unique?
func InitWorldsRoutes() {
	http.HandleFunc("/get-world-canvas", getWorldCanvas)
	http.HandleFunc("/get-world-id", getWorldId)
	http.HandleFunc("/get-world", getWorld)
	http.HandleFunc("/get-worlds", getWorlds)
	http.HandleFunc("/get-home-worlds", getHomeWorlds)
	http.HandleFunc("/get-new-worlds", getNewWorlds)
	http.HandleFunc("/get-favorite-worlds", getFavoriteWorlds)
	// TODO: Hot/top use user interactivity instead of favorite count
	http.HandleFunc("/get-top-worlds", getTopWorlds)
	http.HandleFunc("/get-hot-worlds", getHotWorlds)
	http.HandleFunc("/get-worlds-last-placed-time", getWorldsLastPlacedTime)
	http.HandleFunc("/get-worlds-extra-pixels", getWorldsExtraPixels)
	http.HandleFunc("/get-worlds-colors", getWorldsColors)
	http.HandleFunc("/get-worlds-pixel-count", getWorldsPixelCount)
	http.HandleFunc("/get-worlds-pixel-info", getWorldsPixelInfo)
	http.HandleFunc("/check-world-name", checkWorldName)
	http.HandleFunc("/leaderboard-pixels", getLeaderboardPixels)
	http.HandleFunc("/leaderboard-worlds", getLeaderboardWorlds)
	http.HandleFunc("/leaderboard-pixels-world", getLeaderboardPixelsWorld)
	http.HandleFunc("/leaderboard-pixels-user", getLeaderboardPixelsUser)
	http.HandleFunc("/leaderboard-pixels-world-user", getLeaderboardPixelsWorldUser)
	http.HandleFunc("/get-all-worlds", getAllWorlds)

	if !core.AFKBackend.BackendConfig.Production {
		http.HandleFunc("/create-canvas-devnet", createCanvasDevnet)
		http.HandleFunc("/favorite-world-devnet", favoriteWorldDevnet)
		http.HandleFunc("/unfavorite-world-devnet", unfavoriteWorldDevnet)
		http.HandleFunc("/place-world-pixel-devnet", placeWorldPixelDevnet)
	}
}

func InitWorldsStaticRoutes() {
	http.Handle("/worlds/", http.StripPrefix("/worlds/", http.FileServer(http.Dir("./worlds"))))
}

func getWorldCanvas(w http.ResponseWriter, r *http.Request) {
	routeutils.SetupAccessHeaders(w)

	worldId := r.URL.Query().Get("worldId")
	if worldId == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing worldId")
		return
	}

	canvasName := "canvas-" + worldId

	ctx := context.Background()
	val, err := core.AFKBackend.Databases.Redis.Get(ctx, canvasName).Result()
	if err != nil {
		fmt.Println("error getWorldCanvas", err)
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get canvas")
		return
	}

	w.Write([]byte(val))
}

type WorldData struct {
	WorldId           int        `json:"worldId"`
	Host              string     `json:"host"`
	Name              string     `json:"name"`
	UniqueName        string     `json:"uniqueName"`
	Width             int        `json:"width"`
	Height            int        `json:"height"`
	PixelsPerTime     int        `json:"pixelsPerTime"`
	TimeBetweenPixels int        `json:"timeBetweenPixels"`
	StartTime         *time.Time `json:"startTime"`
	EndTime           *time.Time `json:"endTime"`
	Favorites         int        `json:"favorites"`
	Favorited         bool       `json:"favorited"`
}

func getWorldId(w http.ResponseWriter, r *http.Request) {
	worldName := r.URL.Query().Get("worldName")
	if worldName == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing worldName")
		return
	}
	worldId, err := core.PostgresQueryOne[int]("SELECT world_id FROM worlds WHERE unique_name = $1", worldName)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve World")
		return
	}
	routeutils.WriteDataJson(w, strconv.Itoa(*worldId))
}

func getWorld(w http.ResponseWriter, r *http.Request) {
	fmt.Println("getWorld")
	worldId := r.URL.Query().Get("worldId")
	if worldId == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing worldId")
		return
	}

	address := r.URL.Query().Get("address")
	if address == "" {
		address = "0"
	}

	query := `
    SELECT
		worlds.world_id,
		host,
		name,
		unique_name,
		width,
		height,
		pixels_per_time,
		time_between_pixels,
		CASE 
			WHEN EXTRACT(YEAR FROM start_time) BETWEEN 0 AND 9999 THEN start_time 
			ELSE NULL 
		END as start_time,
		CASE
			WHEN EXTRACT(YEAR FROM end_time) BETWEEN 0 AND 9999 THEN end_time
			ELSE NULL
		END as end_time,
      COALESCE(worldfavorites.favorite_count, 0) AS favorites,
      COALESCE((SELECT true FROM worldfavorites WHERE user_address = $1 AND worldfavorites.world_id = worlds.world_id), false) as favorited
	    FROM
      worlds
    LEFT JOIN (
      SELECT
        world_id,
        COUNT(*) AS favorite_count
      FROM
        worldfavorites
      GROUP BY
        world_id
    ) worldfavorites ON worlds.world_id = worldfavorites.world_id
    WHERE
      worlds.world_id = $2`

	world, err := core.PostgresQueryOneJson[WorldData](query, address, worldId)
	fmt.Println("world by worldId", world)
	if err != nil {
		fmt.Println("error", err)
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve World")
		return
	}

	routeutils.WriteDataJson(w, string(world))
}

func getWorlds(w http.ResponseWriter, r *http.Request) {
	fmt.Println("getWorlds")
	address := r.URL.Query().Get("address")
	if address == "" {
		address = "0"
	}
	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 25
	}
	if pageLength > 50 {
		pageLength = 50
	}
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page <= 0 {
		page = 1
	}
	offset := (page - 1) * pageLength

	query := `
        SELECT 
            worlds.world_id,
			host,
			name,
			unique_name,
			width,
			height,
			pixels_per_time,
			time_between_pixels,
			CASE 
				WHEN EXTRACT(YEAR FROM start_time) BETWEEN 0 AND 9999 THEN start_time 
				ELSE NULL 
			END as start_time,
			CASE
				WHEN EXTRACT(YEAR FROM end_time) BETWEEN 0 AND 9999 THEN end_time
				ELSE NULL
			END as end_time,
            COALESCE(worldfavorites.favorite_count, 0) AS favorites,
            COALESCE((SELECT true FROM worldfavorites WHERE user_address = $1 AND worldfavorites.world_id = worlds.world_id), false) as favorited
		
        FROM 
            worlds
        LEFT JOIN (
            SELECT 
                world_id, 
                COUNT(*) AS favorite_count
            FROM 
                worldfavorites
            GROUP BY 
                world_id
        ) worldfavorites ON worlds.world_id = worldfavorites.world_id
        ORDER BY worlds.world_id DESC
        LIMIT $2 OFFSET $3`
	worlds, err := core.PostgresQueryJson[WorldData](query, address, pageLength, offset)
	fmt.Println("worlds", len(worlds))
	if err != nil {
		fmt.Println("error getWorlds", err)
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve Worlds")
		return
	}
	routeutils.WriteDataJson(w, string(worlds))
}

func getHomeWorlds(w http.ResponseWriter, r *http.Request) {
	// TODO: Top compute
	address := r.URL.Query().Get("address")
	if address == "" {
		address = "0"
	}

	roundConfig := core.AFKBackend.RoundsConfig.Round3

	query := `
        SELECT 
            *
        FROM 
            worlds
        WHERE width = $1 AND height = $2 AND pixels_per_time = $3 AND time_between_pixels = $4 AND start_time = TO_TIMESTAMP($5) AND end_time = TO_TIMESTAMP($6)
        ORDER BY worlds.world_id DESC
        LIMIT 13`
	worlds, err := core.PostgresQueryJson[WorldData](query, roundConfig.Width, roundConfig.Height, roundConfig.Pixels, roundConfig.Timer, roundConfig.StartTime, roundConfig.EndTime)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve Worlds")
		return
	}
	routeutils.WriteDataJson(w, string(worlds))
}

func getNewWorlds(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		address = "0"
	}
	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 25
	}
	if pageLength > 50 {
		pageLength = 50
	}
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page <= 0 {
		page = 1
	}
	offset := (page - 1) * pageLength

	query := `
        SELECT 
            worlds.*, 
            COALESCE(worldfavorites.favorites, 0) AS favorites,
            COALESCE((SELECT true FROM worldfavorites WHERE user_address = $1 AND worldfavorites.world_id = worlds.world_id), false) as favorited
        FROM 
            worlds
        LEFT JOIN (
            SELECT 
                world_id, 
                COUNT(*) AS favorites
            FROM 
                worldfavorites
            GROUP BY 
                world_id
        ) worldfavorites ON worlds.world_id = worldfavorites.world_id
        ORDER BY worlds.world_id DESC
        LIMIT $2 OFFSET $3`
	worlds, err := core.PostgresQueryJson[WorldData](query, address, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve Worlds")
		return
	}
	routeutils.WriteDataJson(w, string(worlds))
}

func getHotWorlds(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		address = "0"
	}
	// hot limit is the number of last favorites to consider when calculating hotness
	hotLimit, err := strconv.Atoi(r.URL.Query().Get("hotLimit"))
	if err != nil || hotLimit <= 0 {
		hotLimit = 100
	}
	if hotLimit > 500 {
		hotLimit = 500
	}
	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 25
	}
	if pageLength > 50 {
		pageLength = 50
	}
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page <= 0 {
		page = 1
	}
	offset := (page - 1) * pageLength

	query := `
      SELECT
          worlds.*,
          COALESCE(worldfavorites.favorite_count, 0) AS favorites,
          COALESCE((
              SELECT true FROM worldfavorites
              WHERE user_address = $1 AND worldfavorites.world_id = worlds.world_id),
          false) as favorited
      FROM
          worlds
      LEFT JOIN (
          SELECT
              world_id,
              COUNT(*) AS favorite_count FROM worldfavorites GROUP BY world_id
      ) worldfavorites ON worlds.world_id = worldfavorites.world_id
      LEFT JOIN (
          SELECT
              latestfavorites.world_id,
              COUNT(*) as rank
          FROM (
              SELECT * FROM worldfavorites
              ORDER BY key DESC LIMIT $2
          ) latestfavorites
          GROUP BY world_id
      ) rank ON worlds.world_id = rank.world_id
      ORDER BY COALESCE(rank, 0) DESC
      LIMIT $3 OFFSET $4;`
	worlds, err := core.PostgresQueryJson[WorldData](query, address, hotLimit, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve Hot Worlds")
		return
	}
	routeutils.WriteDataJson(w, string(worlds))
}

func getWorldsLastPlacedTime(w http.ResponseWriter, r *http.Request) {
	worldId := r.URL.Query().Get("worldId")
	if worldId == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing worldId")
		return
	}

	address := r.URL.Query().Get("address")
	if address == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	lastTime, err := core.PostgresQueryOne[*time.Time]("SELECT COALESCE((SELECT time FROM WorldsLastPlacedTime WHERE world_id = $1 and address = $2), TO_TIMESTAMP(0))", worldId, address)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get last placed time")
		return
	}

	// Return the last placed time in utc z format
	routeutils.WriteDataJson(w, "\""+string((*lastTime).UTC().Format(time.RFC3339))+"\"")
}

func getWorldsExtraPixels(w http.ResponseWriter, r *http.Request) {
	worldId := r.URL.Query().Get("worldId")
	if worldId == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing worldId")
		return
	}

	address := r.URL.Query().Get("address")
	if address == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	available, err := core.PostgresQueryOne[string]("SELECT available FROM WorldsExtraPixels WHERE world_id = $1 and address = $2", worldId, address)
	if err != nil {
		routeutils.WriteDataJson(w, "0") // No extra pixels available
		return
	}

	routeutils.WriteDataJson(w, *available)
}

func getWorldsColors(w http.ResponseWriter, r *http.Request) {
	worldId := r.URL.Query().Get("worldId")
	if worldId == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing worldId")
		return
	}

	colors, err := core.PostgresQueryJson[ColorType]("SELECT hex FROM WorldsColors WHERE world_id = $1 ORDER BY color_key", worldId)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve colors")
		return
	}

	routeutils.WriteDataJson(w, string(colors))
}

func getWorldsPixelCount(w http.ResponseWriter, r *http.Request) {
	worldId := r.URL.Query().Get("worldId")
	if worldId == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing worldId")
		return
	}

	address := r.URL.Query().Get("address")
	if address == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	count, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM WorldsPixels WHERE world_id = $1 and address = $2", worldId, address)
	if err != nil {
		routeutils.WriteDataJson(w, "0")
		return
	}

	routeutils.WriteDataJson(w, strconv.Itoa(*count))
}

func getWorldsPixelInfo(w http.ResponseWriter, r *http.Request) {
	worldId := r.URL.Query().Get("worldId")
	if worldId == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing worldId")
		return
	}

	position, err := strconv.Atoi(r.URL.Query().Get("position"))
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid query position")
		return
	}

	queryRes, err := core.PostgresQueryOne[PixelInfo](`
    SELECT p.address, COALESCE(u.name, '') as name FROM WorldsPixels p
    LEFT JOIN Users u ON p.address = u.address WHERE p.position = $1 and p.world_id = $2
    ORDER BY p.time DESC LIMIT 1`, position, worldId)
	if err != nil {
		routeutils.WriteDataJson(w, "\"0x0000000000000000000000000000000000000000000000000000000000000000\"")
		return
	}

	if queryRes.Name == "" {
		routeutils.WriteDataJson(w, "\"0x"+queryRes.Address+"\"")
	} else {
		routeutils.WriteDataJson(w, "\""+queryRes.Name+"\"")
	}
}

func getTopWorlds(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		address = "0"
	}
	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 25
	}
	if pageLength > 50 {
		pageLength = 50
	}
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page <= 0 {
		page = 1
	}
	offset := (page - 1) * pageLength

	query := `
        SELECT 
            worlds.*, 
            COALESCE(worldfavorites.favorite_count, 0) AS favorites,
            COALESCE((SELECT true FROM worldfavorites WHERE user_address = $1 AND worldfavorites.world_id = worlds.world_id), false) as favorited
        FROM 
            worlds
        LEFT JOIN (
            SELECT 
                world_id, 
                COUNT(*) AS favorite_count
            FROM 
                worldfavorites
            GROUP BY 
                world_id
        ) worldfavorites ON worlds.world_id = worldfavorites.world_id
        ORDER BY 
            favorites DESC
        LIMIT $2 OFFSET $3`
	worlds, err := core.PostgresQueryJson[WorldData](query, address, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve Worlds")
		return
	}
	routeutils.WriteDataJson(w, string(worlds))
}

func getFavoriteWorlds(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		address = "0"
	}
	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 25
	}
	if pageLength > 50 {
		pageLength = 50
	}
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page <= 0 {
		page = 1
	}
	offset := (page - 1) * pageLength

	query := `
        SELECT * FROM (
          SELECT 
              worlds.*, 
              COALESCE(worldfavorites.favorite_count, 0) AS favorites,
              COALESCE((SELECT true FROM worldfavorites WHERE user_address = $1 AND worldfavorites.world_id = worlds.world_id), false) as favorited
          FROM 
              worlds
          LEFT JOIN (
              SELECT 
                  world_id, 
                  COUNT(*) AS favorite_count
              FROM 
                  worldfavorites
              GROUP BY 
                  world_id
          ) worldfavorites ON worlds.world_id = worldfavorites.world_id
        ) w
        WHERE w.favorited = true
        ORDER BY 
            w.favorites DESC
        LIMIT $2 OFFSET $3`
	worlds, err := core.PostgresQueryJson[WorldData](query, address, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve Worlds")
		return
	}
	routeutils.WriteDataJson(w, string(worlds))
}

func createCanvasDevnet(w http.ResponseWriter, r *http.Request) {
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	host := (*jsonBody)["host"]
	name := (*jsonBody)["name"]
	uniqueName := (*jsonBody)["unique_name"]

	if host == "" || name == "" || uniqueName == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing host or name or uniqueName")
		return
	}

	// Check if world name already exists
	exists, err := core.PostgresQueryOne[bool]("SELECT EXISTS(SELECT 1 FROM worlds WHERE unique_name = $1)", uniqueName)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "World unique name check failed")
		return
	}
	if *exists {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "World name already exists")
		return
	}

	width, err := strconv.Atoi((*jsonBody)["width"])
	if err != nil || width <= 0 {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid width")
		return
	}

	height, err := strconv.Atoi((*jsonBody)["height"])
	if err != nil || height <= 0 {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid height")
		return
	}

	pixelsPerTime, err := strconv.Atoi((*jsonBody)["pixels_per_time"])
	if err != nil || pixelsPerTime <= 0 {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid pixels per time")
		return
	}

	timer, err := strconv.Atoi((*jsonBody)["time_between_pixels"])
	if err != nil || timer <= 0 {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid timer")
		return
	}

	paletteFormatted := (*jsonBody)["color_palette"]
	// palette formetted like "0x000000,0xFFFFFF,0x0000FF"
	palette := strings.Split(paletteFormatted, ",")
	if len(palette) < 2 {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid color palette")
		return
	}
	for i, color := range palette {
		colorFormatted := strings.TrimSpace(color)
		colorFormatted = "0x" + colorFormatted
		palette[i] = colorFormatted
	}
	paletteInput := strings.Join(palette, " ")

	startTime, err := strconv.Atoi((*jsonBody)["start_time"])
	if err != nil || startTime <= 0 {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid start time")
		return
	}

	endTime, err := strconv.Atoi((*jsonBody)["end_time"])
	if err != nil || endTime <= 0 {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid end time")
		return
	}

	shellCmd := core.AFKBackend.BackendConfig.Scripts.CreateCanvasDevnet
	contract := os.Getenv("CANVAS_FACTORY_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "create_canvas", host, name, uniqueName, strconv.Itoa(width), strconv.Itoa(height), strconv.Itoa(timer), strconv.Itoa(len(palette)), paletteInput, strconv.Itoa(startTime), strconv.Itoa(endTime))
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to create canvas")
		return
	}

	routeutils.WriteResultJson(w, "Canvas created")
}

func favoriteWorldDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	worldId := (*jsonBody)["worldId"]

	shellCmd := core.AFKBackend.BackendConfig.Scripts.FavoriteWorldDevnet
	contract := os.Getenv("CANVAS_FACTORY_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "favorite_canvas", worldId)
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to favorite World on devnet")
		return
	}

	routeutils.WriteResultJson(w, "World favorited on devnet")
}

func unfavoriteWorldDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	worldId := (*jsonBody)["worldId"]

	shellCmd := core.AFKBackend.BackendConfig.Scripts.UnfavoriteWorldDevnet
	contract := os.Getenv("CANVAS_FACTORY_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "unfavorite_canvas", worldId)
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to unfavorite World on devnet")
		return
	}

	routeutils.WriteResultJson(w, "World unfavorited on devnet")
}

func placeWorldPixelDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid JSON request body")
		return
	}

	worldId, err := strconv.Atoi((*jsonBody)["worldId"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid worldId")
		return
	}

	position, err := strconv.Atoi((*jsonBody)["position"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid position")
		return
	}

	color, err := strconv.Atoi((*jsonBody)["color"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid color")
		return
	}

	timestamp, err := strconv.Atoi((*jsonBody)["timestamp"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid time")
		return
	}

	//TODO: Validate position range

	// Validate color format (e.g., validate against allowed colors)
	colorsLength, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM WorldsColors")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get colors count")
		return
	}
	if color < 0 || color > *colorsLength {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Color out of range")
		return
	}

	shellCmd := core.AFKBackend.BackendConfig.Scripts.PlaceWorldPixelDevnet
	contract := os.Getenv("CANVAS_FACTORY_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "place_pixel", strconv.Itoa(worldId), strconv.Itoa(position), strconv.Itoa(color), strconv.Itoa(timestamp))
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to place pixel on devnet")
		return
	}

	routeutils.WriteResultJson(w, "Pixel placed world")
}

func checkWorldName(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("uniqueName")
	if name == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing uniqueName parameter")
		return
	}

	// Use the helper function
	exists, err := doesWorldNameExist(name)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to check world name")
		return
	}

	routeutils.WriteDataJson(w, strconv.FormatBool(exists))
}

type LeaderboardEntry struct {
	Key   string `json:"key"`
	Score int    `json:"score"`
}

// Get the leaderboard for total pixels placed by user
func getLeaderboardPixels(w http.ResponseWriter, r *http.Request) {
	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 25
	}
	if pageLength > 50 {
		pageLength = 50
	}
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page <= 0 {
		page = 1
	}
	offset := (page - 1) * pageLength

	fmt.Println("pageLength", pageLength)
	fmt.Println("offset", offset)
	fmt.Println("page", page)

	query := `
    SELECT
      address AS key,
      COUNT(*) AS score
    FROM
      worldspixels
    GROUP BY
      address
    ORDER BY
      score DESC
    LIMIT $1 OFFSET $2`
	leaderboard, err := core.PostgresQueryJson[LeaderboardEntry](query, pageLength, offset)
	fmt.Println("leaderboard", string(leaderboard))
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve leaderboard")
		return
	}
	routeutils.WriteDataJson(w, string(leaderboard))
}

// Get the leaderboard for total pixels on each world
func getLeaderboardWorlds(w http.ResponseWriter, r *http.Request) {
	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 25
	}
	if pageLength > 50 {
		pageLength = 50
	}
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page <= 0 {
		page = 1
	}
	offset := (page - 1) * pageLength

	fmt.Println("pageLength", pageLength)
	fmt.Println("offset", offset)
	fmt.Println("page", page)

	query := `
    SELECT
      w.name AS key,
      COUNT(*) AS score
    FROM
      worldspixels p
    JOIN
      worlds w
    ON
      p.world_id = w.world_id
    GROUP BY
      w.name
    ORDER BY
      score DESC
    LIMIT $1 OFFSET $2`
	leaderboard, err := core.PostgresQueryJson[LeaderboardEntry](query, pageLength, offset)

	fmt.Println("leaderboard", string(leaderboard))
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve leaderboard")
		return
	}
	routeutils.WriteDataJson(w, string(leaderboard))
}

// Get the leaderboard for total pixels placed on specific world
func getLeaderboardPixelsWorld(w http.ResponseWriter, r *http.Request) {
	worldId := r.URL.Query().Get("worldId")
	if worldId == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing worldId")
		return
	}

	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 25
	}
	if pageLength > 50 {
		pageLength = 50
	}
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page <= 0 {
		page = 1
	}
	offset := (page - 1) * pageLength

	query := `
    SELECT
      address AS key,
      COUNT(*) AS score
    FROM
      worldspixels
    WHERE
      world_id = $1
    GROUP BY
      address
    ORDER BY
      score DESC
    LIMIT $2 OFFSET $3`
	leaderboard, err := core.PostgresQueryJson[LeaderboardEntry](query, worldId, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve leaderboard")
		return
	}
	routeutils.WriteDataJson(w, string(leaderboard))
}

// Get the leaderboard for total pixels placed by specific user
func getLeaderboardPixelsUser(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address")
		return
	}

	query := `
    SELECT
      COUNT(*) AS score
    FROM
      worldspixels
    WHERE
      address = $1
    GROUP BY
      address
    LIMIT 1`
	leaderboard, err := core.PostgresQueryOne[int](query, address)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve leaderboard")
		return
	}
	routeutils.WriteDataJson(w, strconv.Itoa(*leaderboard))
}

// Get the leaderboard for total pixels placed by specific user on specific world
func getLeaderboardPixelsWorldUser(w http.ResponseWriter, r *http.Request) {
	worldId := r.URL.Query().Get("worldId")
	if worldId == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing worldId")
		return
	}

	address := r.URL.Query().Get("address")
	if address == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address")
		return
	}

	query := `
    SELECT
      COUNT(*) AS score
    FROM
      worldspixels
    WHERE
      address = $1 AND world_id = $2
    GROUP BY
      address
    LIMIT 1`
	leaderboard, err := core.PostgresQueryOne[int](query, address, worldId)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve leaderboard")
		return
	}
	routeutils.WriteDataJson(w, strconv.Itoa(*leaderboard))
}

// Add a helper function to check if a world name exists
func doesWorldNameExist(name string) (bool, error) {
	exists, err := core.PostgresQueryOne[bool]("SELECT EXISTS(SELECT 1 FROM worlds WHERE unique_name = $1)", name)
	if err != nil {
		return false, err
	}
	return *exists, nil
}

func getAllWorlds(w http.ResponseWriter, r *http.Request) {
	fmt.Println("getAllWorlds")
	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 25
	}
	if pageLength > 50 {
		pageLength = 50
	}
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page <= 0 {
		page = 1
	}
	offset := (page - 1) * pageLength

	query := `
        SELECT 
            world_id,
            host,
            name,
            unique_name,
            width,
            height,
            pixels_per_time,
            time_between_pixels,
            CASE 
                WHEN EXTRACT(YEAR FROM start_time) BETWEEN 0 AND 9999 THEN start_time 
                ELSE NULL 
            END as start_time,
            CASE
                WHEN EXTRACT(YEAR FROM end_time) BETWEEN 0 AND 9999 THEN end_time
                ELSE NULL
            END as end_time
        FROM 
            worlds
        ORDER BY world_id DESC 
        LIMIT $1 OFFSET $2`
	worlds, err := core.PostgresQueryJson[WorldData](query, pageLength, offset)
	fmt.Println("Attempting to query worlds with pageLength:", pageLength, "offset:", offset)
	if err != nil {
		fmt.Println("Database error:", err) // Log the actual error
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve Worlds: "+err.Error())
		return
	}
	fmt.Println("Successfully retrieved worlds, count:", len(worlds))
	routeutils.WriteDataJson(w, string(worlds))
}
