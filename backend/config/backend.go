package config

import (
	"fmt"
	"os"
	"strconv"
)

type BackendScriptsConfig struct {
	PlacePixelDevnet            string
	PlaceExtraPixelsDevnet      string
	AddTemplateDevnet           string
	ClaimTodayQuestDevnet       string
	MintNFTDevnet               string
	LikeNFTDevnet               string
	UnlikeNFTDevnet             string
	VoteColorDevnet             string
	NewUsernameDevnet           string
	ChangeUsernameDevnet        string
	IncreaseDayDevnet           string
	JoinChainFactionDevnet      string
	JoinFactionDevnet           string
	LeaveFactionDevnet          string
	AddFactionTemplateDevnet    string
	RemoveFactionTemplateDevnet string
}

type WebSocketConfig struct {
	ReadBufferSize  int
	WriteBufferSize int
}

type HttpConfig struct {
	AllowOrigin  []string
	AllowMethods []string
	AllowHeaders []string
}

type BackendConfig struct {
	Host         string
	Port         int
	ConsumerPort int
	Scripts      BackendScriptsConfig
	Production   bool
	WebSocket    WebSocketConfig
	Http         HttpConfig
}

func LoadBackendConfig() (*BackendConfig, error) {
	backendPort, err := strconv.Atoi(os.Getenv("BACKEND_PORT"))
	if err != nil {
		return nil, fmt.Errorf("invalid BACKEND_PORT: %v", err)
	}

	consumerPort, err := strconv.Atoi(os.Getenv("CONSUMER_PORT"))
	if err != nil {
		return nil, fmt.Errorf("invalid BACKEND_PORT: %v", err)
	}

	production, err := strconv.ParseBool(os.Getenv("PRODUCTION"))
	if err != nil {
		return nil, fmt.Errorf("invalid PRODUCTION mode: %v", err)
	}

	config := BackendConfig{
		Host:         os.Getenv("BACKEND_HOST"),
		Port:         backendPort,
		ConsumerPort: consumerPort,
		Scripts: BackendScriptsConfig{
			PlacePixelDevnet:            "../scripts/place_pixel.sh",
			PlaceExtraPixelsDevnet:      "../scripts/place_extra_pixels.sh",
			AddTemplateDevnet:           "../scripts/add_template.sh",
			ClaimTodayQuestDevnet:       "../scripts/claim_today_quest.sh",
			MintNFTDevnet:               "../scripts/mint_nft.sh",
			LikeNFTDevnet:               "../scripts/like_nft.sh",
			UnlikeNFTDevnet:             "../scripts/unlike_nft.sh",
			VoteColorDevnet:             "../scripts/vote_color.sh",
			NewUsernameDevnet:           "../scripts/new_username.sh",
			ChangeUsernameDevnet:        "../scripts/change_username.sh",
			IncreaseDayDevnet:           "../scripts/increase_day_index.sh",
			JoinChainFactionDevnet:      "../scripts/join_chain_faction.sh",
			JoinFactionDevnet:           "../scripts/join_faction.sh",
			LeaveFactionDevnet:          "../scripts/leave_faction.sh",
			AddFactionTemplateDevnet:    "../scripts/add_faction_template.sh",
			RemoveFactionTemplateDevnet: "../scripts/remove_faction_template.sh",
		},
		Production: production,
		WebSocket: WebSocketConfig{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		},
		Http: HttpConfig{
			AllowOrigin:  []string{"*"},
			AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowHeaders: []string{"Content-Type"},
		},
	}
	return &config, nil
}
