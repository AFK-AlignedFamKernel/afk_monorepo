package indexer

import (
	"context"
	"fmt"
	"strconv"

	"github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/core"
	routeutils "github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/routes/utils"
)

func processPixelPlacedEvent(event IndexerEvent) {
	address := event.Event.Keys[1][2:] // Remove 0x prefix
	posHex := event.Event.Keys[2]
	dayIdxHex := event.Event.Keys[3]
	colorHex := event.Event.Data[0]

	// Convert hex to int
	position, err := strconv.ParseInt(posHex, 0, 64)
	if err != nil {
		PrintIndexerError("processPixelPlacedEvent", "Error converting position hex to int", address, posHex, dayIdxHex, colorHex)
		return
	}

	//validate position
	maxPosition := int64(core.AFKBackend.CanvasConfig.Canvas.Width) * int64(core.AFKBackend.CanvasConfig.Canvas.Height)

	// Perform comparison with maxPosition
	if position < 0 || position >= maxPosition {
		PrintIndexerError("processPixelPlacedEvent", "Position value exceeds canvas dimensions", address, posHex, dayIdxHex, colorHex)
		return
	}

	dayIdx, err := strconv.ParseInt(dayIdxHex, 0, 64)
	if err != nil {
		PrintIndexerError("processPixelPlacedEvent", "Error converting day index hex to int", address, posHex, dayIdxHex, colorHex)
		return
	}
	color, err := strconv.ParseInt(colorHex, 0, 64)
	if err != nil {
		PrintIndexerError("processPixelPlacedEvent", "Error converting color hex to int", address, posHex, dayIdxHex, colorHex)
		return
	}

	fmt.Println("Processing pixel placed event", address, position, dayIdx, color)
	// Set pixel in redis
	bitfieldType := "u" + strconv.Itoa(int(core.AFKBackend.CanvasConfig.ColorsBitWidth))
	pos := uint(position) * core.AFKBackend.CanvasConfig.ColorsBitWidth

	fmt.Println("Setting pixel in redis", bitfieldType, pos, color)
	ctx := context.Background()
	roundNumber := core.AFKBackend.CanvasConfig.Round
	canvasKey := fmt.Sprintf("canvas-%s", roundNumber)
	err = core.AFKBackend.Databases.Redis.BitField(ctx, canvasKey, "SET", bitfieldType, pos, color).Err()
	if err != nil {
		PrintIndexerError("processPixelPlacedEvent", "Error setting pixel in redis", address, posHex, dayIdxHex, colorHex)
		return
	}

	fmt.Println("Setting pixel in postgres")
	// Set pixel in postgres
	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Pixels (address, position, day, color) VALUES ($1, $2, $3, $4)", address, position, dayIdx, color)
	if err != nil {
		// TODO: Reverse redis operation?
		PrintIndexerError("processPixelPlacedEvent", "Error inserting pixel into postgres", address, posHex, dayIdxHex, colorHex)
		return
	}

	fmt.Println("Sending message to all connected clients")
	// Send message to all connected clients
	var message = map[string]string{
		"position":    strconv.FormatInt(position, 10),
		"color":       strconv.FormatInt(color, 10),
		"messageType": "colorPixel",
	}
	routeutils.SendMessageToWSS(message)
}

func revertPixelPlacedEvent(event IndexerEvent) {
	address := event.Event.Keys[1][2:] // Remove 0x prefix
	posHex := event.Event.Keys[2]

	// Convert hex to int
	position, err := strconv.ParseInt(posHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertPixelPlacedEvent", "Error converting position hex to int", address, posHex)
		return
	}

	// Delete pixel from postgres ( last one )
	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM Pixels WHERE address = $1 AND position = $2 ORDER BY time DESC limit 1", address, position)
	if err != nil {
		PrintIndexerError("revertPixelPlacedEvent", "Error deleting pixel from postgres", address, posHex)
		return
	}

	// Retrieve the old color
	oldColor, err := core.PostgresQueryOne[int]("SELECT color FROM Pixels WHERE address = $1 AND position = $2 ORDER BY time DESC LIMIT 1", address, position)
	if err != nil {
		PrintIndexerError("revertPixelPlacedEvent", "Error retrieving old color from postgres", address, posHex)
		return
	}
	// Reset pixel in redis
	bitfieldType := "u" + strconv.Itoa(int(core.AFKBackend.CanvasConfig.ColorsBitWidth))
	pos := uint(position) * core.AFKBackend.CanvasConfig.ColorsBitWidth

	ctx := context.Background()
	roundNumber := core.AFKBackend.CanvasConfig.Round
	canvasKey := fmt.Sprintf("canvas-%s", roundNumber)
	err = core.AFKBackend.Databases.Redis.BitField(ctx, canvasKey, "SET", bitfieldType, pos, oldColor).Err()
	if err != nil {
		PrintIndexerError("revertPixelPlacedEvent", "Error resetting pixel in redis", address, posHex)
		return
	}

	// Send message to all connected clients
	var message = map[string]string{
		"position":    strconv.FormatInt(position, 10),
		"color":       strconv.Itoa(*oldColor),
		"messageType": "colorPixel",
	}
	routeutils.SendMessageToWSS(message)
}

func processBasicPixelPlacedEvent(event IndexerEvent) {
	address := event.Event.Keys[1][2:] // Remove 0x prefix
	timestampHex := event.Event.Data[0]

	timestamp, err := strconv.ParseInt(timestampHex, 0, 64)
	if err != nil {
		PrintIndexerError("processBasicPixelPlacedEvent", "Error converting timestamp hex to int", address, timestampHex)
		return
	}

	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO LastPlacedTime (address, time) VALUES ($1, TO_TIMESTAMP($2)) ON CONFLICT (address) DO UPDATE SET time = TO_TIMESTAMP($2)", address, timestamp)
	if err != nil {
		PrintIndexerError("processBasicPixelPlacedEvent", "Error inserting last placed time into postgres", address, timestampHex)
		return
	}
}

func revertBasicPixelPlacedEvent(event IndexerEvent) {
	address := event.Event.Keys[1][2:] // Remove 0x prefix

	// Reset last placed time to time of last pixel placed
	_, err := core.AFKBackend.Databases.Postgres.Exec(context.Background(), "UPDATE LastPlacedTime SET time = (SELECT time FROM Pixels WHERE address = $1 ORDER BY time DESC LIMIT 1) WHERE address = $1", address)
	if err != nil {
		PrintIndexerError("revertBasicPixelPlacedEvent", "Error resetting last placed time in postgres", address)
		return
	}

	// TODO: check ordering of this and revertPixelPlacedEvent
}

func processFactionPixelsPlacedEvent(event IndexerEvent) {
	// TODO: Faction id
	userAddress := event.Event.Keys[1][2:] // Remove 0x prefix
	timestampHex := event.Event.Data[0]
	memberPixelsHex := event.Event.Data[1]

	timestamp, err := strconv.ParseInt(timestampHex, 0, 64)
	if err != nil {
		PrintIndexerError("processMemberPixelsPlacedEvent", "Error converting timestamp hex to int", userAddress, timestampHex, memberPixelsHex)
		return
	}

	memberPixels, err := strconv.ParseInt(memberPixelsHex, 0, 64)
	if err != nil {
		PrintIndexerError("processMemberPixelsPlacedEvent", "Error converting member pixels hex to int", userAddress, timestampHex, memberPixelsHex)
		return
	}

	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(), "UPDATE FactionMembersInfo SET last_placed_time = TO_TIMESTAMP($1), member_pixels = $2 WHERE user_address = $3", timestamp, memberPixels, userAddress)
	if err != nil {
		PrintIndexerError("processMemberPixelsPlacedEvent", "Error updating faction member info in postgres", userAddress, timestampHex, memberPixelsHex)
		return
	}
}

func revertFactionPixelsPlacedEvent(event IndexerEvent) {
	// TODO
}

func processChainFactionPixelsPlacedEvent(event IndexerEvent) {
	// TODO: Faction id
	userAddress := event.Event.Keys[1][2:] // Remove 0x prefix
	timestampHex := event.Event.Data[0]
	memberPixelsHex := event.Event.Data[1]

	timestamp, err := strconv.ParseInt(timestampHex, 0, 64)
	if err != nil {
		PrintIndexerError("processChainFactionMemberPixelsPlacedEvent", "Error converting timestamp hex to int", userAddress, timestampHex, memberPixelsHex)
		return
	}

	memberPixels, err := strconv.ParseInt(memberPixelsHex, 0, 64)
	if err != nil {
		PrintIndexerError("processChainFactionMemberPixelsPlacedEvent", "Error converting member pixels hex to int", userAddress, timestampHex, memberPixelsHex)
		return
	}

	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(), "UPDATE ChainFactionMembersInfo SET last_placed_time = TO_TIMESTAMP($1), member_pixels = $2 WHERE user_address = $3", timestamp, memberPixels, userAddress)
	if err != nil {
		PrintIndexerError("processChainFactionMemberPixelsPlacedEvent", "Error updating chain faction member info in postgres", userAddress, timestampHex, memberPixelsHex)
		return
	}
}

func revertChainFactionPixelsPlacedEvent(event IndexerEvent) {
	// TODO
}

func processExtraPixelsPlacedEvent(event IndexerEvent) {
	address := event.Event.Keys[1][2:] // Remove 0x prefix
	extraPixelsHex := event.Event.Data[0]

	extraPixels, err := strconv.ParseInt(extraPixelsHex, 0, 64)
	if err != nil {
		PrintIndexerError("processExtraPixelsPlacedEvent", "Error converting extra pixels hex to int", address, extraPixelsHex)
		return
	}

	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(), "UPDATE ExtraPixels SET available = available - $1, used = used + $1 WHERE address = $2", extraPixels, address)
	if err != nil {
		PrintIndexerError("processExtraPixelsPlacedEvent", "Error updating extra pixels in postgres", address, extraPixelsHex)
		return
	}
}

func revertExtraPixelsPlacedEvent(event IndexerEvent) {
	address := event.Event.Keys[1][2:] // Remove 0x prefix
	extraPixelsHex := event.Event.Data[0]

	extraPixels, err := strconv.ParseInt(extraPixelsHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertExtraPixelsPlacedEvent", "Error converting extra pixels hex to int", address, extraPixelsHex)
		return
	}

	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(), "UPDATE ExtraPixels SET available = available + $1, used = used - $1 WHERE address = $2", extraPixels, address)
	if err != nil {
		PrintIndexerError("revertExtraPixelsPlacedEvent", "Error updating extra pixels in postgres", address, extraPixelsHex)
		return
	}
}

func processHostAwardedPixelsEvent(event IndexerEvent) {
	user := event.Event.Keys[1][2:] // Remove 0x prefix
	awardHex := event.Event.Data[0]

	award, err := strconv.ParseInt(awardHex, 0, 64)
	if err != nil {
		PrintIndexerError("processHostAwardedPixelsEvent", "Error converting award hex to int", user, awardHex)
		return
	}

	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO ExtraPixels (address, available, used) VALUES ($1, $2, 0) ON CONFLICT (address) DO UPDATE SET available = ExtraPixels.available + $2", user, award)
	if err != nil {
		PrintIndexerError("processHostAwardedPixelsEvent", "Error updating extra pixels in postgres", user, awardHex)
		return
	}
}

func revertHostAwardedPixelsEvent(event IndexerEvent) {
	user := event.Event.Keys[1][2:] // Remove 0x prefix
	awardHex := event.Event.Data[0]

	award, err := strconv.ParseInt(awardHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertHostAwardedPixelsEvent", "Error converting award hex to int", user, awardHex)
		return
	}

	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(), "UPDATE ExtraPixels SET available = ExtraPixels.available - $1 WHERE address = $2", award, user)
	if err != nil {
		PrintIndexerError("revertHostAwardedPixelsEvent", "Error updating extra pixels in postgres", user, awardHex)
		return
	}
}


func processPixelShieldPlacesEvent(event IndexerEvent){
	address := event.Event.Keys[1][2:] // Remove 0x prefix
	posHex := event.Event.Keys[2]
	shieldTypeHex := event.Event.Data[0]
	amountPaidHex := event.Event.Data[1]

	position, err := strconv.ParseInt(posHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertPixelPlacedEvent", "Error converting position hex to int", address, posHex)
		return
	}

	shieldType, err := strconv.ParseInt(shieldTypeHex, 0, 64)
	if err != nil {
		PrintIndexerError("processPixelShieldPlacedEvent", "Error converting shield type hex to int", address, shieldTypeHex)
		return
	}

	amountPaid, err := strconv.ParseInt(amountPaidHex, 0, 64)
	if err != nil {
		PrintIndexerError("processPixelShieldPlacedEvent", "Error converting amount paid hex to int", address, amountPaidHex)
		return
	}

	// Insert pixel shield information into Postgres
	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(), 
		"INSERT INTO PixelShields (address, position, shield_type, amount_paid) VALUES ($1, $2, $3, $4)",
		address, position, shieldType, amountPaid)
	if err != nil {
		PrintIndexerError("processPixelShieldPlacedEvent", "Error inserting pixel shield into postgres", address, posHex, shieldTypeHex, amountPaidHex)
		return
	}

	// Send message to all connected clients
	var message = map[string]interface{}{
		"position":    position,
		"shieldType":  shieldType,
		"amountPaid":  amountPaid,
		"messageType": "pixelShieldPlaced",
	}
	routeutils.SendWebSocketMessage(message)

}

func revertPixelShieldPlacedEvent(event IndexerEvent) {
	address := event.Event.Keys[1][2:] // Remove 0x prefix
	posHex := event.Event.Keys[2]

	position, err := strconv.ParseInt(posHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertPixelShieldPlacedEvent", "Error converting position hex to int", address, posHex)
		return
	}

	// Delete the pixel shield entry from Postgres
	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(), 
		"DELETE FROM PixelShields WHERE address = $1 AND position = $2",
		address, position)
	if err != nil {
		PrintIndexerError("revertPixelShieldPlacedEvent", "Error deleting pixel shield from postgres", address, posHex)
		return
	}

	// Send message to all connected clients about the shield removal
	var message = map[string]interface{}{
		"position":    position,
		"messageType": "pixelShieldRemoved",
	}
	routeutils.SendWebSocketMessage(message)
}

func processBasicPixelPlacedEventWithMetadata(event IndexerEvent) {
	address := event.Event.Keys[1][2:] // Remove 0x prefix
	timestampHex := event.Event.Data[0]
	timestamp, err := strconv.ParseInt(timestampHex, 0, 64)
	if err != nil {
		PrintIndexerError("processBasicPixelPlacedEventWithMetadata", "Error converting timestamp hex to int", address, timestampHex)
		return
	}

	// Extract position and color from the event (position is Keys[2], color is in Data[1])
	positionHex := event.Event.Keys[2]
	position, err := strconv.Atoi(positionHex)
	if err != nil {
		PrintIndexerError("processBasicPixelPlacedEventWithMetadata", "Error converting position hex to int", address, positionHex)
		return
	}

	colorHex := event.Event.Data[1]
	color, err := strconv.Atoi(colorHex)
	if err != nil {
		PrintIndexerError("processBasicPixelPlacedEventWithMetadata", "Error converting color hex to int", address, colorHex)
		return
	}

	// Extract metadata from the last index in Data (metadata is in Data[n])
	metadata := event.Event.Data[len(event.Event.Data)-1]

	// Unmarshal metadata (if it exists)
	var metadataMap map[string]interface{}
	if len(metadata) > 0 {
		err = json.Unmarshal([]byte(metadata), &metadataMap)
		if err != nil {
			PrintIndexerError("processBasicPixelPlacedEventWithMetadata", "Error parsing metadata", address, string(metadata))
			return
		}
	}

	// Prepare SQL statement for inserting pixel info and metadata together
	metadataJson, err := json.Marshal(metadataMap)
	if err != nil {
		PrintIndexerError("processBasicPixelPlacedEventWithMetadata", "Error serializing metadata", address, string(metadata))
		return
	}

	// Use a single query to insert the pixel information and metadata into the database
	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(),
		`INSERT INTO Pixels (address, position, color, time)
		 VALUES ($1, $2, $3, TO_TIMESTAMP($4))
		 ON CONFLICT (address, position)
		 DO UPDATE SET color = $3, time = TO_TIMESTAMP($4),
		 metadata = COALESCE(metadata, $5)`,
		address, position, color, timestamp, metadataJson)
	if err != nil {
		PrintIndexerError("processBasicPixelPlacedEventWithMetadata", "Error inserting/updating pixel and metadata", address, string(metadataJson))
		return
	}

	// Insert or update the last placed time in the LastPlacedTime table
	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(),
		"INSERT INTO LastPlacedTime (address, time) VALUES ($1, TO_TIMESTAMP($2)) ON CONFLICT (address) DO UPDATE SET time = TO_TIMESTAMP($2)",
		address, timestamp)
	if err != nil {
		PrintIndexerError("processBasicPixelPlacedEventWithMetadata", "Error inserting last placed time into postgres", address, timestampHex)
		return
	}
}


func revertBasicPixelPlacedEventWithMetadata(event IndexerEvent) {
	address := event.Event.Keys[1][2:] // Remove 0x prefix
	posHex := event.Event.Keys[2]

	// Convert hex to int for position
	position, err := strconv.ParseInt(posHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertPixelPlacedEvent", "Error converting position hex to int", address, posHex)
		return
	}

	// We can also retrieve the metadata from the event if needed
	metadata := event.Event.Data[len(event.Event.Data)-1]
	var metadataMap map[string]interface{}
	if len(metadata) > 0 {
		err = json.Unmarshal([]byte(metadata), &metadataMap) // Unmarshal from metadata (which is a string) to map
		if err != nil {
			PrintIndexerError("revertPixelPlacedEvent", "Error parsing metadata", address, string(metadata))
			return
		}
	}

	// Delete the pixel entry (including metadata) from the PostgreSQL database
	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(), `
		DELETE FROM Pixels
		WHERE address = $1 AND position = $2
		ORDER BY time LIMIT 1`, address, position)
	if err != nil {
		PrintIndexerError("revertPixelPlacedEvent", "Error deleting pixel from postgres", address, posHex)
		return
	}

	// Optionally, you can also delete the metadata from the database,
	// but usually deleting the pixel entry will automatically take care of it since metadata is part of the same row.

	// Delete the pixel's associated last placed time entry from the LastPlacedTime table
	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(),
		"DELETE FROM LastPlacedTime WHERE address = $1", address)
	if err != nil {
		PrintIndexerError("revertPixelPlacedEvent", "Error deleting last placed time from postgres", address, posHex)
		return
	}

	// Optionally log the event if needed
	fmt.Printf("Pixel at position %d for address %s has been reverted.\n", position, address)
}

func processPixelMetadataPlacedEvent(event IndexerEvent){
	address := event.Event.Keys[1][2:] // Remove 0x prefix
	posHex := event.Event.Keys[2]
	dayIdxHex := event.Event.Keys[3]
	colorHex := event.Event.Data[0]
	ipfsHex := event.Event.Data[1]
	nostrEventIdHex := event.Event.Data[2]
	ownerAddressHex := event.Event.Data[3]
	contractAddressHex := event.Event.Data[4]

	position, err := strconv.ParseInt(posHex, 0, 64)
	if err != nil {
		PrintIndexerError("processPixelPlacedEvent", "Error converting position hex to int", address, posHex, dayIdxHex, colorHex)
		return
	}

	//validate position
	maxPosition := int64(core.AFKBackend.CanvasConfig.Canvas.Width) * int64(core.AFKBackend.CanvasConfig.Canvas.Height)

	// Perform comparison with maxPosition
	if position < 0 || position >= maxPosition {
		PrintIndexerError("processPixelPlacedEvent", "Position value exceeds canvas dimensions", address, posHex, dayIdxHex, colorHex)
		return
	}

	dayIdx, err := strconv.ParseInt(dayIdxHex, 0, 64)
	if err != nil {
		PrintIndexerError("processPixelPlacedEvent", "Error converting day index hex to int", address, posHex, dayIdxHex, colorHex)
		return
	}
	color, err := strconv.ParseInt(colorHex, 0, 64)
	if err != nil {
		PrintIndexerError("processPixelPlacedEvent", "Error converting color hex to int", address, posHex, dayIdxHex, colorHex)
		return
	}

	metadata := map[string]interface{}{
		"ipfs":          ipfsHex,
		"nostrEventId": nostrEventIdHex,
		"owner":         ownerAddressHex,
		"contract":      contractAddressHex,
	}

	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		PrintIndexerError("processPixelMetadataPlacedEvent", "Error converting metadata to JSON", address)
		return
	}

	bitfieldType := "u" + strconv.Itoa(int(core.AFKBackend.CanvasConfig.ColorsBitWidth))
	pos := uint(position) * core.AFKBackend.CanvasConfig.ColorsBitWidth

	ctx := context.Background()
	err = core.AFKBackend.Databases.Redis.BitField(ctx, "canvas", "SET", bitfieldType, pos, color).Err()
	if err != nil {
		PrintIndexerError("processPixelPlacedEvent", "Error setting pixel in redis", address, posHex, dayIdxHex, colorHex)
		return
	}

	fmt.Printf(address, position, dayIdx, color, "print")
	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(),
		`INSERT INTO Pixels (address, position, day, color, metadata)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (address, position) 
		DO UPDATE SET color = $4, day = $3, metadata = $5`,
		address, position, dayIdx, color, metadataJSON)
	if err != nil {
		PrintIndexerError("processPixelMetadataPlacedEvent", "Error inserting pixel metadata into postgres", address, posHex)
		return
	}

	var message = map[string]interface{}{
		"position":    position,
		"color":      color,
		"metadata":   metadata,
		"messageType": "pixelMetadataPlaced",
	}
	routeutils.SendWebSocketMessage(message)
}

func revertPixelMetadataPlacedEvent(event IndexerEvent) {
	address := event.Event.Keys[1][2:] // Remove 0x prefix
	posHex := event.Event.Keys[2]

	position, err := strconv.ParseInt(posHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertPixelMetadataPlacedEvent", "Error converting position hex to int", address, posHex)
		return
	}

	var prevColor int
	var prevMetadata []byte
	err = core.AFKBackend.Databases.Postgres.QueryRow(context.Background(),
		`SELECT color, metadata FROM Pixels 
		WHERE address = $1 AND position = $2 
		ORDER BY time DESC OFFSET 1 LIMIT 1`,
		address, position).Scan(&prevColor, &prevMetadata)
	if err != nil {
		PrintIndexerError("revertPixelMetadataPlacedEvent", "Error retrieving previous pixel state", address, posHex)
		return
	}

	bitfieldType := "u" + strconv.Itoa(int(core.AFKBackend.CanvasConfig.ColorsBitWidth))
	pos := uint(position) * core.AFKBackend.CanvasConfig.ColorsBitWidth

	ctx := context.Background()
	err = core.AFKBackend.Databases.Redis.BitField(ctx, "canvas", "SET", bitfieldType, pos, prevColor).Err()
	if err != nil {
		PrintIndexerError("revertPixelMetadataPlacedEvent", "Error resetting pixel in redis", address, posHex)
		return
	}

	_, err = core.AFKBackend.Databases.Postgres.Exec(context.Background(),
		`DELETE FROM Pixels 
		WHERE address = $1 AND position = $2 
		AND time = (
			SELECT MAX(time) 
			FROM Pixels 
			WHERE address = $1 AND position = $2
		)`,
		address, position)
	if err != nil {
		PrintIndexerError("revertPixelMetadataPlacedEvent", "Error deleting pixel metadata from postgres", address, posHex)
		return
	}

	var prevMetadataMap map[string]interface{}
	if len(prevMetadata) > 0 {
		err = json.Unmarshal(prevMetadata, &prevMetadataMap)
		if err != nil {
			PrintIndexerError("revertPixelMetadataPlacedEvent", "Error parsing previous metadata", address, string(prevMetadata))
			return
		}
	}

	var message = map[string]interface{}{
		"position":    position,
		"color":      prevColor,
		"metadata":   prevMetadataMap,
		"messageType": "pixelMetadataReverted",
	}
	routeutils.SendWebSocketMessage(message)
}