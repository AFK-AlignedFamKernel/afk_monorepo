package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/nbd-wtf/go-nostr"
)

type WebSocketManager struct {
	clients    map[*WebSocketClient]bool
	broadcast  chan interface{}
	register   chan *WebSocketClient
	unregister chan *WebSocketClient
	mutex      sync.RWMutex
}

type WebSocketClient struct {
	manager    *WebSocketManager
	conn       *websocket.Conn
	send       chan []byte
	userID     string
	subscribed map[string]bool // Track what the client is subscribed to
}

type WebSocketMessage struct {
	Type    string      `json:"type"`
	Data    interface{} `json:"data"`
	UserID  string      `json:"user_id,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type FeedRequest struct {
	UserID string `json:"user_id"`
	Kind   int    `json:"kind"`
	Limit  int    `json:"limit"`
}

type ViralNotesRequest struct {
	Limit int `json:"limit"`
}

type TrendingNotesRequest struct {
	Limit int `json:"limit"`
}

type ScrapedNotesRequest struct {
	Limit int    `json:"limit"`
	Kind  int    `json:"kind"`
	Since string `json:"since"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

func NewWebSocketManager() *WebSocketManager {
	return &WebSocketManager{
		clients:    make(map[*WebSocketClient]bool),
		broadcast:  make(chan interface{}, 100),
		register:   make(chan *WebSocketClient),
		unregister: make(chan *WebSocketClient),
	}
}

func (manager *WebSocketManager) Start() {
	log.Println("🚀 Starting WebSocket manager...")
	
	for {
		select {
		case client := <-manager.register:
			manager.mutex.Lock()
			manager.clients[client] = true
			manager.mutex.Unlock()
			log.Printf("📡 WebSocket client connected: %s", client.userID)

		case client := <-manager.unregister:
			manager.mutex.Lock()
			if _, ok := manager.clients[client]; ok {
				delete(manager.clients, client)
				close(client.send)
			}
			manager.mutex.Unlock()
			log.Printf("📡 WebSocket client disconnected: %s", client.userID)

		case message := <-manager.broadcast:
			manager.mutex.RLock()
			for client := range manager.clients {
				select {
				case client.send <- manager.serializeMessage(message):
				default:
					close(client.send)
					delete(manager.clients, client)
				}
			}
			manager.mutex.RUnlock()
		}
	}
}

func (manager *WebSocketManager) serializeMessage(message interface{}) []byte {
	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error serializing message: %v", err)
		return []byte(`{"type":"error","error":"Failed to serialize message"}`)
	}
	return data
}

func (manager *WebSocketManager) Broadcast(message interface{}) {
	manager.broadcast <- message
}

func (client *WebSocketClient) readPump() {
	defer func() {
		client.manager.unregister <- client
		client.conn.Close()
	}()

	client.conn.SetReadLimit(512)
	client.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	client.conn.SetPongHandler(func(string) error {
		client.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := client.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket read error: %v", err)
			}
			break
		}

		client.handleMessage(message)
	}
}

func (client *WebSocketClient) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		client.conn.Close()
	}()

	for {
		select {
		case message, ok := <-client.send:
			client.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				client.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := client.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			client.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := client.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (client *WebSocketClient) handleMessage(message []byte) {
	log.Printf("📨 [WS] Received message from client %s: %s", client.userID, string(message))
	
	var request map[string]interface{}
	if err := json.Unmarshal(message, &request); err != nil {
		log.Printf("❌ [WS] Invalid JSON format from client %s: %v", client.userID, err)
		client.sendError("Invalid JSON format")
		return
	}

	requestType, ok := request["type"].(string)
	if !ok {
		log.Printf("❌ [WS] Missing or invalid 'type' field from client %s", client.userID)
		client.sendError("Missing or invalid 'type' field")
		return
	}

	log.Printf("🔍 [WS] Processing message type '%s' from client %s", requestType, client.userID)

	switch requestType {
	case "auth":
		client.handleAuth(request)
	case "get_feed":
		client.handleGetFeed(request)
	case "get_viral_notes":
		client.handleGetViralNotes(request)
	case "get_trending_notes":
		client.handleGetTrendingNotes(request)
	case "get_scraped_notes":
		client.handleGetScrapedNotes(request)
	case "subscribe_viral":
		client.handleSubscribeViral(request)
	case "subscribe_trending":
		client.handleSubscribeTrending(request)
	case "unsubscribe":
		client.handleUnsubscribe(request)
	default:
		log.Printf("❌ [WS] Unknown request type '%s' from client %s", requestType, client.userID)
		client.sendError(fmt.Sprintf("Unknown request type: %s", requestType))
	}
}

func (client *WebSocketClient) handleAuth(request map[string]interface{}) {
	userID, ok := request["user_id"].(string)
	if !ok || userID == "" {
		client.sendError("Missing or invalid user_id")
		return
	}

	client.userID = userID
	client.subscribed = make(map[string]bool)

	response := WebSocketMessage{
		Type:   "auth_success",
		UserID: userID,
		Data:   map[string]string{"status": "authenticated"},
	}

	client.sendMessage(response)
}

func (client *WebSocketClient) handleGetFeed(request map[string]interface{}) {
	if client.userID == "" {
		client.sendError("Authentication required")
		return
	}

	feedReq := FeedRequest{
		UserID: client.userID,
		Kind:   1, // Default to text notes
		Limit:  50,
	}

	if kind, ok := request["kind"].(float64); ok {
		feedReq.Kind = int(kind)
	}
	if limit, ok := request["limit"].(float64); ok {
		feedReq.Limit = int(limit)
	}

	// Get user feed
	events, err := GetUserFeed(context.Background(), feedReq.UserID, feedReq.Limit, feedReq.Kind)
	if err != nil {
		client.sendError(fmt.Sprintf("Failed to get feed: %v", err))
		return
	}

	response := WebSocketMessage{
		Type:   "feed_data",
		UserID: client.userID,
		Data:   events,
	}

	client.sendMessage(response)
}

func (client *WebSocketClient) handleGetViralNotes(request map[string]interface{}) {
	viralReq := ViralNotesRequest{Limit: 20}

	if limit, ok := request["limit"].(float64); ok {
		viralReq.Limit = int(limit)
	}

	notes, err := scraper.GetViralNotes(viralReq.Limit)
	if err != nil {
		client.sendError(fmt.Sprintf("Failed to get viral notes: %v", err))
		return
	}

	response := WebSocketMessage{
		Type: "viral_notes",
		Data: notes,
	}

	client.sendMessage(response)
}

func (client *WebSocketClient) handleGetTrendingNotes(request map[string]interface{}) {
	trendingReq := TrendingNotesRequest{Limit: 20}

	if limit, ok := request["limit"].(float64); ok {
		trendingReq.Limit = int(limit)
	}

	notes, err := scraper.GetTrendingNotes(trendingReq.Limit)
	if err != nil {
		client.sendError(fmt.Sprintf("Failed to get trending notes: %v", err))
		return
	}

	response := WebSocketMessage{
		Type: "trending_notes",
		Data: notes,
	}

	client.sendMessage(response)
}

func (client *WebSocketClient) handleGetScrapedNotes(request map[string]interface{}) {
	scrapedReq := ScrapedNotesRequest{
		Limit: 50,
		Kind:  0,
		Since: time.Now().Add(-24 * time.Hour).Format(time.RFC3339),
	}

	if limit, ok := request["limit"].(float64); ok {
		scrapedReq.Limit = int(limit)
	}
	if kind, ok := request["kind"].(float64); ok {
		scrapedReq.Kind = int(kind)
	}
	if since, ok := request["since"].(string); ok {
		scrapedReq.Since = since
	}

	sinceTime, err := time.Parse(time.RFC3339, scrapedReq.Since)
	if err != nil {
		client.sendError("Invalid since date format")
		return
	}

	notes, err := scraper.GetScrapedNotes(scrapedReq.Limit, scrapedReq.Kind, sinceTime)
	if err != nil {
		client.sendError(fmt.Sprintf("Failed to get scraped notes: %v", err))
		return
	}

	response := WebSocketMessage{
		Type: "scraped_notes",
		Data: notes,
	}

	client.sendMessage(response)
}

func (client *WebSocketClient) handleSubscribeViral(request map[string]interface{}) {
	client.subscribed["viral"] = true
	response := WebSocketMessage{
		Type: "subscription_success",
		Data: map[string]string{"subscription": "viral_notes"},
	}
	client.sendMessage(response)
}

func (client *WebSocketClient) handleSubscribeTrending(request map[string]interface{}) {
	client.subscribed["trending"] = true
	response := WebSocketMessage{
		Type: "subscription_success",
		Data: map[string]string{"subscription": "trending_notes"},
	}
	client.sendMessage(response)
}

func (client *WebSocketClient) handleUnsubscribe(request map[string]interface{}) {
	subscription, ok := request["subscription"].(string)
	if !ok {
		client.sendError("Missing subscription type")
		return
	}

	delete(client.subscribed, subscription)
	response := WebSocketMessage{
		Type: "unsubscription_success",
		Data: map[string]string{"subscription": subscription},
	}
	client.sendMessage(response)
}

func (client *WebSocketClient) sendMessage(message WebSocketMessage) {
	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	select {
	case client.send <- data:
	default:
		close(client.send)
		client.manager.unregister <- client
	}
}

func (client *WebSocketClient) sendError(errorMsg string) {
	response := WebSocketMessage{
		Type:  "error",
		Error: errorMsg,
	}
	client.sendMessage(response)
}

// WebSocket handler for HTTP requests
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	log.Printf("📡 [WS] WebSocket connection attempt from %s", r.RemoteAddr)
	
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("❌ [WS] WebSocket upgrade failed: %v", err)
		return
	}

	log.Printf("✅ [WS] WebSocket connection established from %s", r.RemoteAddr)

	client := &WebSocketClient{
		manager:    wsManager,
		conn:       conn,
		send:       make(chan []byte, 256),
		subscribed: make(map[string]bool),
	}

	client.manager.register <- client

	go client.writePump()
	go client.readPump()
}

// Broadcast viral notes to subscribed clients
func broadcastViralNotes(notes []ScrapedNote) {
	message := WebSocketMessage{
		Type: "viral_notes_update",
		Data: notes,
	}
	wsManager.Broadcast(message)
}

// Broadcast trending notes to subscribed clients
func broadcastTrendingNotes(notes []ScrapedNote) {
	message := WebSocketMessage{
		Type: "trending_notes_update",
		Data: notes,
	}
	wsManager.Broadcast(message)
}

// Broadcast feed updates to authenticated clients
func broadcastFeedUpdate(userID string, events []nostr.Event) {
	message := WebSocketMessage{
		Type:   "feed_update",
		UserID: userID,
		Data:   events,
	}
	wsManager.Broadcast(message)
} 