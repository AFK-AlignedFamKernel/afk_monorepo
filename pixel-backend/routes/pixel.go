package routes

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strconv"

	"github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/core"
	routeutils "github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/routes/utils"
)

func InitPixelRoutes() {
	http.HandleFunc("/get-pixel", getPixel)
	http.HandleFunc("/get-pixel-info", getPixelInfo)
	if !core.AFKBackend.BackendConfig.Production {
		http.HandleFunc("/place-pixel-devnet", placePixelDevnet)
		http.HandleFunc("/place-extra-pixels-devnet", placeExtraPixelsDevnet)
	}
	http.HandleFunc("/place-pixel-redis", placePixelRedis)
}

func getPixel(w http.ResponseWriter, r *http.Request) {
	positionStr := r.URL.Query().Get("position")
	position, err := strconv.Atoi(positionStr)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid query position")
		return
	}

	// Check if position is within canvas bounds
	if position < 0 || position >= (int(core.AFKBackend.CanvasConfig.Canvas.Width)*int(core.AFKBackend.CanvasConfig.Canvas.Height)) {
		http.Error(w, "Position out of range", http.StatusBadRequest)
		return
	}

	bitfieldType := "u" + strconv.Itoa(int(core.AFKBackend.CanvasConfig.ColorsBitWidth))
	pos := uint(position) * core.AFKBackend.CanvasConfig.ColorsBitWidth

	ctx := context.Background()
	roundNumber := core.AFKBackend.CanvasConfig.Round
	canvasKey := fmt.Sprintf("canvas-%s", roundNumber)
	val, err := core.AFKBackend.Databases.Redis.BitField(ctx, canvasKey, "GET", bitfieldType, pos).Result()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Error getting pixel")
		return
	}

	// TODO: Check this
	pixel := strconv.Itoa(int(val[0]))
	routeutils.WriteDataJson(w, pixel)
}

type PixelInfo struct {
	Address string `json:"address"`
	Name    string `json:"username"`
}

func getPixelInfo(w http.ResponseWriter, r *http.Request) {
	position, err := strconv.Atoi(r.URL.Query().Get("position"))
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid query position")
		return
	}

	queryRes, err := core.PostgresQueryOne[PixelInfo](`
    SELECT p.address, COALESCE(u.name, '') as name FROM Pixels p
    LEFT JOIN Users u ON p.address = u.address WHERE p.position = $1
    ORDER BY p.time DESC LIMIT 1`, position)
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

func placePixelDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid JSON request body")
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

	// Validate position range
	if position < 0 || position >= int(core.AFKBackend.CanvasConfig.Canvas.Width*core.AFKBackend.CanvasConfig.Canvas.Height) {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Position out of range")
		return
	}

	// Validate color format (e.g., validate against allowed colors)
	colorsLength, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM colors")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get colors count")
		return
	}
	if color < 0 || color > *colorsLength {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Color out of range")
		return
	}

	shellCmd := core.AFKBackend.BackendConfig.Scripts.PlacePixelDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "place_pixel", strconv.Itoa(position), strconv.Itoa(color), strconv.Itoa(timestamp))
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to place pixel on devnet")
		return
	}

	routeutils.WriteResultJson(w, "Pixel placed")
}

type ExtraPixelJson struct {
	ExtraPixels []map[string]int `json:"extraPixels"`
	Timestamp   int              `json:"timestamp"`
}

func placeExtraPixelsDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[ExtraPixelJson](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid JSON request body")
		return
	}

	shellCmd := core.AFKBackend.BackendConfig.Scripts.PlaceExtraPixelsDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")

	positions := strconv.Itoa(len(jsonBody.ExtraPixels))
	colors := strconv.Itoa(len(jsonBody.ExtraPixels))
	for _, pixel := range jsonBody.ExtraPixels {
		positions += " " + strconv.Itoa(pixel["position"])
		colors += " " + strconv.Itoa(pixel["colorId"])
	}

	cmd := exec.Command(shellCmd, contract, "place_extra_pixels", positions, colors, strconv.Itoa(jsonBody.Timestamp))
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to place extra pixels on devnet")
		return
	}

	routeutils.WriteResultJson(w, "Extra pixels placed")
}

func placePixelRedis(w http.ResponseWriter, r *http.Request) {
	// Only allow admin to place pixels on redis
	if routeutils.AdminMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]uint](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid JSON request body")
		return
	}

	position := (*jsonBody)["position"]
	color := (*jsonBody)["color"]

	canvasWidth := core.AFKBackend.CanvasConfig.Canvas.Width
	canvasHeight := core.AFKBackend.CanvasConfig.Canvas.Height

	// Validate position range
	if position >= canvasWidth*canvasHeight {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Position out of range")
		return
	}

	// Validate color range (e.g., ensure color value fits within bit width)
	colorsLength, err := core.PostgresQueryOne[uint]("SELECT COUNT(*) FROM colors")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get colors count")
		return
	}

	if color >= *colorsLength {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Color out of range")
		return
	}

	bitfieldType := "u" + strconv.Itoa(int(core.AFKBackend.CanvasConfig.ColorsBitWidth))
	pos := position * core.AFKBackend.CanvasConfig.ColorsBitWidth

	ctx := context.Background()
	roundNumber := core.AFKBackend.CanvasConfig.Round
	canvasKey := fmt.Sprintf("canvas-%s", roundNumber)
	err = core.AFKBackend.Databases.Redis.BitField(ctx, canvasKey, "SET", bitfieldType, pos, color).Err()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Error setting pixel on redis")
		return
	}

	routeutils.WriteResultJson(w, "Pixel placed on redis")
}



func getShieldDetailsForPixel(position int64, address string) (int, float64) {

    var shieldType int
    var amountPaid float64

    err := core.AFKBackend.Databases.Postgres.QueryRow(context.Background(), `
        SELECT shield_type, amount_paid 
        FROM PixelShields 
        WHERE address = $1 AND position = $2
    `, address, position).Scan(&shieldType, &amountPaid)
    if err != nil {
        return 0, 0.0
    }

    return shieldType, amountPaid
}

// func processPixelShieldPlacesEvent(event IndexerEvent){
// 	address := event.Event.Keys[1][2:] // Remove 0x prefix
// 	posHex := event.Event.Keys[2]
// 	shieldTypeHex := event.Event.Data[0]
// 	amountPaidHex := event.Event.Data[1]

// 	position, err := strconv.ParseInt(posHex, 0, 64)
// 	if err != nil {
// 		PrintIndexerError("revertPixelPlacedEvent", "Error converting position hex to int", address, posHex)
// 		return
// 	}

// 	shieldType, err := strconv.ParseInt(shieldTypeHex, 0, 64)
// 	if err != nil {
// 		PrintIndexerError("processPixelShieldPlacedEvent", "Error converting shield type hex to int", address, shieldTypeHex)
// 		return
// 	}

// 	amountPaid, err := strconv.ParseInt(amountPaidHex, 0, 64)
// 	if err != nil {
// 		PrintIndexerError("processPixelShieldPlacedEvent", "Error converting amount paid hex to int", address, amountPaidHex)
// 		return
// 	}

// 	// Insert pixel shield information into Postgres
// 	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(), 
// 		"INSERT INTO PixelShields (address, position, shield_type, amount_paid) VALUES ($1, $2, $3, $4)",
// 		address, position, shieldType, amountPaid)
// 	if err != nil {
// 		PrintIndexerError("processPixelShieldPlacedEvent", "Error inserting pixel shield into postgres", address, posHex, shieldTypeHex, amountPaidHex)
// 		return
// 	}

// 	// Send message to all connected clients
// 	var message = map[string]interface{}{
// 		"position":    position,
// 		"shieldType":  shieldType,
// 		"amountPaid":  amountPaid,
// 		"messageType": "pixelShieldPlaced",
// 	}
// 	routeutils.SendWebSocketMessage(message)

// }

// func revertPixelShieldPlacedEvent(event IndexerEvent) {
// 	address := event.Event.Keys[1][2:] // Remove 0x prefix
// 	posHex := event.Event.Keys[2]

// 	position, err := strconv.ParseInt(posHex, 0, 64)
// 	if err != nil {
// 		PrintIndexerError("revertPixelShieldPlacedEvent", "Error converting position hex to int", address, posHex)
// 		return
// 	}

// 	// Delete the pixel shield entry from Postgres
// 	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(), 
// 		"DELETE FROM PixelShields WHERE address = $1 AND position = $2",
// 		address, position)
// 	if err != nil {
// 		PrintIndexerError("revertPixelShieldPlacedEvent", "Error deleting pixel shield from postgres", address, posHex)
// 		return
// 	}

// 	// Send message to all connected clients about the shield removal
// 	var message = map[string]interface{}{
// 		"position":    position,
// 		"messageType": "pixelShieldRemoved",
// 	}
// 	routeutils.SendWebSocketMessage(message)
// }

// func processBasicPixelPlacedEventWithMetadata(event IndexerEvent) {
// 	address := event.Event.Keys[1][2:] // Remove 0x prefix
// 	timestampHex := event.Event.Data[0]
// 	timestamp, err := strconv.ParseInt(timestampHex, 0, 64)
// 	if err != nil {
// 		PrintIndexerError("processBasicPixelPlacedEventWithMetadata", "Error converting timestamp hex to int", address, timestampHex)
// 		return
// 	}

// 	// Extract position and color from the event (position is Keys[2], color is in Data[1])
// 	positionHex := event.Event.Keys[2]
// 	position, err := strconv.Atoi(positionHex)
// 	if err != nil {
// 		PrintIndexerError("processBasicPixelPlacedEventWithMetadata", "Error converting position hex to int", address, positionHex)
// 		return
// 	}

// 	colorHex := event.Event.Data[1]
// 	color, err := strconv.Atoi(colorHex)
// 	if err != nil {
// 		PrintIndexerError("processBasicPixelPlacedEventWithMetadata", "Error converting color hex to int", address, colorHex)
// 		return
// 	}

// 	// Extract metadata from the last index in Data (metadata is in Data[n])
// 	metadata := event.Event.Data[len(event.Event.Data)-1]

// 	// Unmarshal metadata (if it exists)
// 	var metadataMap map[string]interface{}
// 	if len(metadata) > 0 {
// 		err = json.Unmarshal([]byte(metadata), &metadataMap)
// 		if err != nil {
// 			PrintIndexerError("processBasicPixelPlacedEventWithMetadata", "Error parsing metadata", address, string(metadata))
// 			return
// 		}
// 	}

// 	// Prepare SQL statement for inserting pixel info and metadata together
// 	metadataJson, err := json.Marshal(metadataMap)
// 	if err != nil {
// 		PrintIndexerError("processBasicPixelPlacedEventWithMetadata", "Error serializing metadata", address, string(metadata))
// 		return
// 	}

// 	// Use a single query to insert the pixel information and metadata into the database
// 	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(),
// 		`INSERT INTO Pixels (address, position, color, time)
// 		 VALUES ($1, $2, $3, TO_TIMESTAMP($4))
// 		 ON CONFLICT (address, position)
// 		 DO UPDATE SET color = $3, time = TO_TIMESTAMP($4),
// 		 metadata = COALESCE(metadata, $5)`,
// 		address, position, color, timestamp, metadataJson)
// 	if err != nil {
// 		PrintIndexerError("processBasicPixelPlacedEventWithMetadata", "Error inserting/updating pixel and metadata", address, string(metadataJson))
// 		return
// 	}

// 	// Insert or update the last placed time in the LastPlacedTime table
// 	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(),
// 		"INSERT INTO LastPlacedTime (address, time) VALUES ($1, TO_TIMESTAMP($2)) ON CONFLICT (address) DO UPDATE SET time = TO_TIMESTAMP($2)",
// 		address, timestamp)
// 	if err != nil {
// 		PrintIndexerError("processBasicPixelPlacedEventWithMetadata", "Error inserting last placed time into postgres", address, timestampHex)
// 		return
// 	}
// }


// func revertBasicPixelPlacedEventWithMetadata(event IndexerEvent) {
// 	address := event.Event.Keys[1][2:] // Remove 0x prefix
// 	posHex := event.Event.Keys[2]

// 	// Convert hex to int for position
// 	position, err := strconv.ParseInt(posHex, 0, 64)
// 	if err != nil {
// 		PrintIndexerError("revertPixelPlacedEvent", "Error converting position hex to int", address, posHex)
// 		return
// 	}

// 	// We can also retrieve the metadata from the event if needed
// 	metadata := event.Event.Data[len(event.Event.Data)-1]
// 	var metadataMap map[string]interface{}
// 	if len(metadata) > 0 {
// 		err = json.Unmarshal([]byte(metadata), &metadataMap) // Unmarshal from metadata (which is a string) to map
// 		if err != nil {
// 			PrintIndexerError("revertPixelPlacedEvent", "Error parsing metadata", address, string(metadata))
// 			return
// 		}
// 	}

// 	// Delete the pixel entry (including metadata) from the PostgreSQL database
// 	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(), `
// 		DELETE FROM Pixels
// 		WHERE address = $1 AND position = $2
// 		ORDER BY time LIMIT 1`, address, position)
// 	if err != nil {
// 		PrintIndexerError("revertPixelPlacedEvent", "Error deleting pixel from postgres", address, posHex)
// 		return
// 	}

// 	// Optionally, you can also delete the metadata from the database,
// 	// but usually deleting the pixel entry will automatically take care of it since metadata is part of the same row.

// 	// Delete the pixel's associated last placed time entry from the LastPlacedTime table
// 	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(),
// 		"DELETE FROM LastPlacedTime WHERE address = $1", address)
// 	if err != nil {
// 		PrintIndexerError("revertPixelPlacedEvent", "Error deleting last placed time from postgres", address, posHex)
// 		return
// 	}

// 	// Optionally log the event if needed
// 	fmt.Printf("Pixel at position %d for address %s has been reverted.\n", position, address)
// }

// func processPixelMetadataPlacedEvent(event IndexerEvent){
// 	address := event.Event.Keys[1][2:] // Remove 0x prefix
// 	posHex := event.Event.Keys[2]
// 	dayIdxHex := event.Event.Keys[3]
// 	colorHex := event.Event.Data[0]
// 	ipfsHex := event.Event.Data[1]
// 	nostrEventIdHex := event.Event.Data[2]
// 	ownerAddressHex := event.Event.Data[3]
// 	contractAddressHex := event.Event.Data[4]

// 	position, err := strconv.ParseInt(posHex, 0, 64)
// 	if err != nil {
// 		PrintIndexerError("processPixelPlacedEvent", "Error converting position hex to int", address, posHex, dayIdxHex, colorHex)
// 		return
// 	}

// 	//validate position
// 	maxPosition := int64(core.AFKBackend.CanvasConfig.Canvas.Width) * int64(core.AFKBackend.CanvasConfig.Canvas.Height)

// 	// Perform comparison with maxPosition
// 	if position < 0 || position >= maxPosition {
// 		PrintIndexerError("processPixelPlacedEvent", "Position value exceeds canvas dimensions", address, posHex, dayIdxHex, colorHex)
// 		return
// 	}

// 	dayIdx, err := strconv.ParseInt(dayIdxHex, 0, 64)
// 	if err != nil {
// 		PrintIndexerError("processPixelPlacedEvent", "Error converting day index hex to int", address, posHex, dayIdxHex, colorHex)
// 		return
// 	}
// 	color, err := strconv.ParseInt(colorHex, 0, 64)
// 	if err != nil {
// 		PrintIndexerError("processPixelPlacedEvent", "Error converting color hex to int", address, posHex, dayIdxHex, colorHex)
// 		return
// 	}

// 	metadata := map[string]interface{}{
// 		"ipfs":          ipfsHex,
// 		"nostrEventId": nostrEventIdHex,
// 		"owner":         ownerAddressHex,
// 		"contract":      contractAddressHex,
// 	}

// 	metadataJSON, err := json.Marshal(metadata)
// 	if err != nil {
// 		PrintIndexerError("processPixelMetadataPlacedEvent", "Error converting metadata to JSON", address)
// 		return
// 	}

// 	bitfieldType := "u" + strconv.Itoa(int(core.AFKBackend.CanvasConfig.ColorsBitWidth))
// 	pos := uint(position) * core.AFKBackend.CanvasConfig.ColorsBitWidth

// 	ctx := context.Background()
// 	err = core.AFKBackend.Databases.Redis.BitField(ctx, "canvas", "SET", bitfieldType, pos, color).Err()
// 	if err != nil {
// 		PrintIndexerError("processPixelPlacedEvent", "Error setting pixel in redis", address, posHex, dayIdxHex, colorHex)
// 		return
// 	}

// 	fmt.Printf(address, position, dayIdx, color, "print")
// 	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(),
// 		`INSERT INTO Pixels (address, position, day, color, metadata)
// 		VALUES ($1, $2, $3, $4, $5)
// 		ON CONFLICT (address, position) 
// 		DO UPDATE SET color = $4, day = $3, metadata = $5`,
// 		address, position, dayIdx, color, metadataJSON)
// 	if err != nil {
// 		PrintIndexerError("processPixelMetadataPlacedEvent", "Error inserting pixel metadata into postgres", address, posHex)
// 		return
// 	}

// 	var message = map[string]interface{}{
// 		"position":    position,
// 		"color":      color,
// 		"metadata":   metadata,
// 		"messageType": "pixelMetadataPlaced",
// 	}
// 	routeutils.SendWebSocketMessage(message)
// }

// func revertPixelMetadataPlacedEvent(event IndexerEvent) {
// 	address := event.Event.Keys[1][2:] // Remove 0x prefix
// 	posHex := event.Event.Keys[2]

// 	position, err := strconv.ParseInt(posHex, 0, 64)
// 	if err != nil {
// 		PrintIndexerError("revertPixelMetadataPlacedEvent", "Error converting position hex to int", address, posHex)
// 		return
// 	}

// 	var prevColor int
// 	var prevMetadata []byte
// 	err = core.AFKBackend.Databases.Postgres.QueryRow(context.Background(),
// 		`SELECT color, metadata FROM Pixels 
// 		WHERE address = $1 AND position = $2 
// 		ORDER BY time DESC OFFSET 1 LIMIT 1`,
// 		address, position).Scan(&prevColor, &prevMetadata)
// 	if err != nil {
// 		PrintIndexerError("revertPixelMetadataPlacedEvent", "Error retrieving previous pixel state", address, posHex)
// 		return
// 	}

// 	bitfieldType := "u" + strconv.Itoa(int(core.AFKBackend.CanvasConfig.ColorsBitWidth))
// 	pos := uint(position) * core.AFKBackend.CanvasConfig.ColorsBitWidth

// 	ctx := context.Background()
// 	err = core.AFKBackend.Databases.Redis.BitField(ctx, "canvas", "SET", bitfieldType, pos, prevColor).Err()
// 	if err != nil {
// 		PrintIndexerError("revertPixelMetadataPlacedEvent", "Error resetting pixel in redis", address, posHex)
// 		return
// 	}

// 	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(),
// 		`DELETE FROM Pixels 
// 		WHERE address = $1 AND position = $2 
// 		AND time = (
// 			SELECT MAX(time) 
// 			FROM Pixels 
// 			WHERE address = $1 AND position = $2
// 		)`,
// 		address, position)
// 	if err != nil {
// 		PrintIndexerError("revertPixelMetadataPlacedEvent", "Error deleting pixel metadata from postgres", address, posHex)
// 		return
// 	}

// 	var prevMetadataMap map[string]interface{}
// 	if len(prevMetadata) > 0 {
// 		err = json.Unmarshal(prevMetadata, &prevMetadataMap)
// 		if err != nil {
// 			PrintIndexerError("revertPixelMetadataPlacedEvent", "Error parsing previous metadata", address, string(prevMetadata))
// 			return
// 		}
// 	}

// 	var message = map[string]interface{}{
// 		"position":    position,
// 		"color":      prevColor,
// 		"metadata":   prevMetadataMap,
// 		"messageType": "pixelMetadataReverted",
// 	}
// 	routeutils.SendWebSocketMessage(message)
// }