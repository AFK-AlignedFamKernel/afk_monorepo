package core

import (
	"fmt"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"

	"github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/config"
)

type Backend struct {
	Databases         *Databases
	WSConnections     []*websocket.Conn
	WSConnectionsLock sync.Mutex

	RoundsConfig  *config.RoundsConfig
	CanvasConfig  *config.CanvasConfig
	BackendConfig *config.BackendConfig

	AdminMode bool
}

var ArtPeaceBackend *Backend

func NewBackend(databases *Databases, roundsConfig *config.RoundsConfig, canvasConfig *config.CanvasConfig, backendConfig *config.BackendConfig, adminMode bool) *Backend {
	return &Backend{
		Databases:     databases,
		RoundsConfig:  roundsConfig,
		CanvasConfig:  canvasConfig,
		BackendConfig: backendConfig,
		AdminMode:     adminMode,
	}
}

func (b *Backend) Start(port int) {
	fmt.Println("Listening on port", port)
	http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
	fmt.Println("Port closed")
}

func (b *Backend) GetBackendUrl() string {
	if b.BackendConfig.Production {
		return "https://api.art-peace.net"
	} else {
		return fmt.Sprintf("http://%s:%d", b.BackendConfig.Host, b.BackendConfig.Port)
	}
}
