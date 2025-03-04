package routeutils

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/AFK_AlignedFamKernel/afk_monorepo/pixel-backend/core"
)

// SetupAccessHeaders sets up CORS headers to allow all origins
func SetupAccessHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, Authorization, X-CSRF-Token, X-Requested-With")
	w.Header().Set("Access-Control-Max-Age", "3600")
	w.Header().Set("Referrer-Policy", "no-referrer-when-downgrade")
	w.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Type")
}

// SetupHeaders sets up response headers
func SetupHeaders(w http.ResponseWriter) {
	SetupAccessHeaders(w)
	w.Header().Set("Content-Type", "application/json")
}

func BasicErrorJson(err string) []byte {
	return []byte(`{"error": "` + err + `"}`)
}

func WriteErrorJson(w http.ResponseWriter, errCode int, err string) {
	SetupHeaders(w)
	w.WriteHeader(errCode)
	w.Write(BasicErrorJson(err))
}

func BasicResultJson(result string) []byte {
	return []byte(`{"result": "` + result + `"}`)
}

func WriteResultJson(w http.ResponseWriter, result string) {
	SetupHeaders(w)
	w.WriteHeader(http.StatusOK)
	w.Write(BasicResultJson(result))
}

func BasicDataJson(data string) []byte {
	return []byte(`{"data": ` + data + `}`)
}

func WriteDataJson(w http.ResponseWriter, data string) {
	SetupHeaders(w)
	w.WriteHeader(http.StatusOK)
	w.Write(BasicDataJson(data))
}

func SendWebSocketMessage(message map[string]string) {
	messageBytes, err := json.Marshal(message)
	if err != nil {
		fmt.Println("Failed to marshal websocket message")
		return
	}
	core.AFKBackend.WSConnectionsLock.Lock()
	for idx, conn := range core.AFKBackend.WSConnections {
		if err := conn.WriteMessage(websocket.TextMessage, messageBytes); err != nil {
			fmt.Println(err)
			// Remove problematic connection
			conn.Close()
			if idx < len(core.AFKBackend.WSConnections) {
				core.AFKBackend.WSConnections = append(core.AFKBackend.WSConnections[:idx], core.AFKBackend.WSConnections[idx+1:]...)
			} else {
				core.AFKBackend.WSConnections = core.AFKBackend.WSConnections[:idx]
			}
		}
	}
	core.AFKBackend.WSConnectionsLock.Unlock()
}

func SendWebSocketMessages(messages []map[string]string) {
	messageBytes, err := json.Marshal(messages)
	if err != nil {
		fmt.Println("Failed to marshal websocket message")
		return
	}
	core.AFKBackend.WSConnectionsLock.Lock()
	for idx, conn := range core.AFKBackend.WSConnections {
		if err := conn.WriteMessage(websocket.TextMessage, messageBytes); err != nil {
			fmt.Println(err)
			// Remove problematic connection
			conn.Close()
			if idx < len(core.AFKBackend.WSConnections) {
				core.AFKBackend.WSConnections = append(core.AFKBackend.WSConnections[:idx], core.AFKBackend.WSConnections[idx+1:]...)
			} else {
				core.AFKBackend.WSConnections = core.AFKBackend.WSConnections[:idx]
			}
		}
	}
	core.AFKBackend.WSConnectionsLock.Unlock()
}

func SendMessageToWSS(message map[string]string) {
	websocketHost := core.AFKBackend.BackendConfig.WsHost + ":" + strconv.Itoa(core.AFKBackend.BackendConfig.WsPort) + "/ws-msg"
	messageBytes, err := json.Marshal(message)
	if err != nil {
		fmt.Println("Failed to marshal websocket message")
		return
	}
	_, err = http.Post("http://"+websocketHost, "application/json", strings.NewReader(string(messageBytes)))
	if err != nil {
		fmt.Println("Failed to send message to websocket server", err)
	}
}
