package routes

import (
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"

	"github.com/AFK-AlignedFamKernel/afk_monorepo/backend/core"
)

func InitWebsocketRoutes() {
	http.HandleFunc("/ws", wsEndpoint)
}

func wsReader(conn *websocket.Conn) {
	for {
		// TODO: exit on close in backend?
		// TODO: handle different message types
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			fmt.Println(err)
			return
		}
		fmt.Println("WS message received: ", messageType, string(p))
	}
}

func wsEndpoint(w http.ResponseWriter, r *http.Request) {
	upgrader := websocket.Upgrader{
		ReadBufferSize:  core.AFKBackend.BackendConfig.WebSocket.ReadBufferSize,
		WriteBufferSize: core.AFKBackend.BackendConfig.WebSocket.WriteBufferSize,
	}
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println(err)
		return
	}

	core.AFKBackend.WSConnectionsLock.Lock()
	core.AFKBackend.WSConnections = append(core.AFKBackend.WSConnections, ws)
	core.AFKBackend.WSConnectionsLock.Unlock()
	wsReader(ws)
}
