package main

import (
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/nbd-wtf/go-nostr"
)

func handleHomePage(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("templates/home.html")
	if err != nil {
		http.Error(w, "Error loading template", http.StatusInternalServerError)
		return
	}

	err = tmpl.Execute(w, nil)
	if err != nil {
		http.Error(w, "Error rendering template", http.StatusInternalServerError)
	}
}

func handleDashboardPage(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("templates/dashboard.html")
	if err != nil {
		http.Error(w, "Error loading template", http.StatusInternalServerError)
		return
	}

	err = tmpl.Execute(w, nil)
	if err != nil {
		http.Error(w, "Error rendering template", http.StatusInternalServerError)
	}
}

func handleScraperDashboardPage(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("templates/scraper-dashboard.html")
	if err != nil {
		http.Error(w, "Error loading template", http.StatusInternalServerError)
		return
	}

	err = tmpl.Execute(w, nil)
	if err != nil {
		http.Error(w, "Error rendering template", http.StatusInternalServerError)
	}
}

func handleTopAuthorsAPI(w http.ResponseWriter, r *http.Request) {
	// Get the user's pubkey from the request
	pubkey := r.URL.Query().Get("pubkey")
	if pubkey == "" {
		http.Error(w, "Missing pubkey parameter", http.StatusBadRequest)
		return
	}

	// Get limit parameter
	limit := 35
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	// Get offset parameter for pagination
	offset := 0
	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if parsed, err := strconv.Atoi(offsetStr); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	// Get time range parameter
	timeRange := r.URL.Query().Get("time_range")
	if timeRange == "" {
		timeRange = "30d" // Default to 30 days
	}

	// Fetch top interacted authors with pagination
	authors, err := repository.fetchTopInteractedAuthorsWithPagination(pubkey, limit, offset, timeRange)
	if err != nil {
		http.Error(w, "Error fetching top authors: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Set content type header
	w.Header().Set("Content-Type", "application/json")

	// Return the authors as JSON
	if err := json.NewEncoder(w).Encode(authors); err != nil {
		http.Error(w, "Error encoding response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

func handleViralNotesAPI(w http.ResponseWriter, r *http.Request) {
	// Get limit parameter
	limit := 10
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	// Get offset parameter for pagination
	offset := 0
	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if parsed, err := strconv.Atoi(offsetStr); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	// Get kind filter
	kind := 0 // 0 means all kinds
	if kindStr := r.URL.Query().Get("kind"); kindStr != "" {
		if parsed, err := strconv.Atoi(kindStr); err == nil && parsed >= 0 {
			kind = parsed
		}
	}

	// Get search query
	searchQuery := r.URL.Query().Get("search")

	// Get time range filter
	timeRange := r.URL.Query().Get("time_range")
	if timeRange == "" {
		timeRange = "7d" // Default to 7 days
	}

	// Get minimum viral score filter
	minViralScore := 0.0
	if scoreStr := r.URL.Query().Get("min_viral_score"); scoreStr != "" {
		if parsed, err := strconv.ParseFloat(scoreStr, 64); err == nil && parsed >= 0 {
			minViralScore = parsed
		}
	}

	fmt.Printf("Fetching viral notes with limit: %d, offset: %d, kind: %d, search: %s, timeRange: %s, minViralScore: %f\n",
		limit, offset, kind, searchQuery, timeRange, minViralScore)

	notes, err := scraper.GetViralNotesWithFilters(limit, offset, kind, searchQuery, timeRange, minViralScore)
	if err != nil {
		http.Error(w, "Error fetching viral notes: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(notes); err != nil {
		http.Error(w, "Error encoding response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

func handleGetNotesAPI(w http.ResponseWriter, r *http.Request) {
	// Get limit parameter
	limit := 10
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	// Get offset parameter for pagination
	offset := 0
	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if parsed, err := strconv.Atoi(offsetStr); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	// Get kind filter
	kind := 0 // 0 means all kinds
	if kindStr := r.URL.Query().Get("kind"); kindStr != "" {
		if parsed, err := strconv.Atoi(kindStr); err == nil && parsed >= 0 {
			kind = parsed
		}
	}

	// Get search query
	searchQuery := r.URL.Query().Get("search")

	// Get time range filter
	timeRange := r.URL.Query().Get("time_range")
	if timeRange == "" {
		timeRange = "7d" // Default to 7 days
	}

	fmt.Printf("Fetching notes with limit: %d, offset: %d, kind: %d, search: %s, timeRange: %s\n",
		limit, offset, kind, searchQuery, timeRange)

	notes, err := repository.GetNotesWithFilters(context.Background(), limit, offset, kind, searchQuery, timeRange)
	if err != nil {
		http.Error(w, "Error fetching notes: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(notes); err != nil {
		http.Error(w, "Error encoding response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// NostrAuthRequest represents the signed event sent for authentication
type NostrAuthRequest struct {
	ID        string     `json:"id"`
	PubKey    string     `json:"pubkey"`
	CreatedAt int64      `json:"created_at"`
	Kind      int        `json:"kind"`
	Tags      [][]string `json:"tags"`
	Content   string     `json:"content"`
	Sig       string     `json:"sig"`
}

// AuthResponse represents the response sent back after authentication
type AuthResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

func handleAuth(w http.ResponseWriter, r *http.Request) {
	// Only accept POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse the request body
	var authRequest NostrAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&authRequest); err != nil {
		sendAuthResponse(w, false, "Invalid request format: "+err.Error())
		return
	}

	// Create a nostr.Event from the request data
	nostrTags := nostr.Tags{}
	for _, tag := range authRequest.Tags {
		nostrTags = append(nostrTags, nostr.Tag(tag))
	}

	event := &nostr.Event{
		ID:        authRequest.ID,
		PubKey:    authRequest.PubKey,
		CreatedAt: nostr.Timestamp(authRequest.CreatedAt),
		Kind:      authRequest.Kind,
		Tags:      nostrTags,
		Content:   authRequest.Content,
		Sig:       authRequest.Sig,
	}

	// Verify the signature
	ok, err := event.CheckSignature()
	if err != nil {
		sendAuthResponse(w, false, "Error verifying signature: "+err.Error())
		return
	}
	if !ok {
		sendAuthResponse(w, false, "Invalid signature")
		return
	}

	// Check if the event is recent (within the last 5 minutes)
	eventTime := time.Unix(authRequest.CreatedAt, 0)
	if time.Since(eventTime) > 5*time.Minute {
		sendAuthResponse(w, false, "Authentication event is too old")
		return
	}

	// Authentication successful
	sendAuthResponse(w, true, "")
}

func sendAuthResponse(w http.ResponseWriter, success bool, errorMsg string) {
	w.Header().Set("Content-Type", "application/json")

	response := AuthResponse{
		Success: success,
		Error:   errorMsg,
	}

	// Set appropriate status code
	if !success {
		w.WriteHeader(http.StatusUnauthorized)
	}

	// Encode and send the response
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

// SettingsRequest represents the combined settings and signed event
type SettingsRequest struct {
	Settings    UserSettings     `json:"settings"`
	SignedEvent NostrAuthRequest `json:"signedEvent"`
}

// handleUserSettings handles saving and retrieving user algorithm settings
func handleUserSettings(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		// Get user settings
		pubkey := r.URL.Query().Get("pubkey")
		if pubkey == "" {
			http.Error(w, "Missing pubkey parameter", http.StatusBadRequest)
			return
		}

		settings, err := repository.GetUserSettings(pubkey)
		if err != nil {
			http.Error(w, "Error retrieving settings: "+err.Error(), http.StatusInternalServerError)
			return
		}

		if err := json.NewEncoder(w).Encode(settings); err != nil {
			http.Error(w, "Error encoding response: "+err.Error(), http.StatusInternalServerError)
		}

	case http.MethodPost:
		// Save user settings
		var settingsReq SettingsRequest
		if err := json.NewDecoder(r.Body).Decode(&settingsReq); err != nil {
			http.Error(w, "Invalid request format: "+err.Error(), http.StatusBadRequest)
			return
		}

		// Validate pubkey
		if settingsReq.Settings.PubKey == "" {
			http.Error(w, "Missing pubkey in settings", http.StatusBadRequest)
			return
		}

		// Verify the signature of the event
		nostrTags := nostr.Tags{}
		for _, tag := range settingsReq.SignedEvent.Tags {
			nostrTags = append(nostrTags, nostr.Tag(tag))
		}

		event := &nostr.Event{
			ID:        settingsReq.SignedEvent.ID,
			PubKey:    settingsReq.SignedEvent.PubKey,
			CreatedAt: nostr.Timestamp(settingsReq.SignedEvent.CreatedAt),
			Kind:      settingsReq.SignedEvent.Kind,
			Tags:      nostrTags,
			Content:   settingsReq.SignedEvent.Content,
			Sig:       settingsReq.SignedEvent.Sig,
		}

		// Verify the signature
		ok, err := event.CheckSignature()
		if err != nil {
			http.Error(w, "Error verifying signature: "+err.Error(), http.StatusUnauthorized)
			return
		}
		if !ok {
			http.Error(w, "Invalid signature", http.StatusUnauthorized)
			return
		}

		// Check if the pubkey in the event matches the pubkey in the settings
		if event.PubKey != settingsReq.Settings.PubKey {
			http.Error(w, "Pubkey mismatch between signed event and settings", http.StatusUnauthorized)
			return
		}

		// Check if the event is recent (within the last 5 minutes)
		eventTime := time.Unix(settingsReq.SignedEvent.CreatedAt, 0)
		if time.Since(eventTime) > 5*time.Minute {
			http.Error(w, "Authentication event is too old", http.StatusUnauthorized)
			return
		}

		// Validate settings values
		if err := validateSettings(settingsReq.Settings); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Save settings
		if err := repository.SaveUserSettings(settingsReq.Settings); err != nil {
			http.Error(w, "Error saving settings: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Invalidate the user's feed cache
		invalidateUserFeedCache(settingsReq.Settings.PubKey)

		// Return success response
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]bool{"success": true})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// validateSettings performs basic validation on user settings
func validateSettings(settings UserSettings) error {
	// Check for negative values
	if settings.AuthorInteractions < 0 ||
		settings.GlobalComments < 0 ||
		settings.GlobalReactions < 0 ||
		settings.GlobalZaps < 0 ||
		settings.Recency < 0 ||
		settings.DecayRate < 0 ||
		settings.ViralThreshold < 0 ||
		settings.ViralDampening < 0 {
		return fmt.Errorf("settings values cannot be negative")
	}

	// Decay rate should be between 0 and 1
	if settings.DecayRate > 1 {
		return fmt.Errorf("decay rate must be between 0 and 1")
	}

	// Viral dampening should be between 0 and 1
	if settings.ViralDampening > 1 {
		return fmt.Errorf("viral dampening must be between 0 and 1")
	}

	return nil
}

// handleUserMetricsAPI handles requests for user metrics
func handleUserMetricsAPI(w http.ResponseWriter, r *http.Request) {
	// Get the user's pubkey from the request
	pubkey := r.URL.Query().Get("pubkey")
	if pubkey == "" {
		http.Error(w, "Missing pubkey parameter", http.StatusBadRequest)
		return
	}

	// Fetch user metrics
	metrics, err := repository.GetUserMetrics(pubkey)
	if err != nil {
		http.Error(w, "Error fetching user metrics: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Set content type header
	w.Header().Set("Content-Type", "application/json")

	// Return the metrics as JSON
	if err := json.NewEncoder(w).Encode(metrics); err != nil {
		http.Error(w, "Error encoding response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// handleViralNotesAPI handles requests for viral notes
func handleViralNotesScraperAPI(w http.ResponseWriter, r *http.Request) {
	// Get limit from query parameter, default to 20
	limit := 20
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsed, err := fmt.Sscanf(limitStr, "%d", &limit); err != nil || parsed != 1 {
			http.Error(w, "Invalid limit parameter", http.StatusBadRequest)
			return
		}
	}

	// Fetch viral notes
	notes, err := scraper.GetViralNotes(limit)
	if err != nil {
		http.Error(w, "Error fetching viral notes: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Set content type header
	w.Header().Set("Content-Type", "application/json")

	// Return the notes as JSON
	if err := json.NewEncoder(w).Encode(notes); err != nil {
		http.Error(w, "Error encoding response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// handleTrendingNotesAPI handles requests for trending notes
func handleTrendingNotesAPI(w http.ResponseWriter, r *http.Request) {
	log.Printf("📡 [API] Trending notes request received from %s", r.RemoteAddr)

	// Get limit parameter, default to 20
	limit := 20
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	// Get offset parameter for pagination
	offset := 0
	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if parsed, err := strconv.Atoi(offsetStr); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	// Get kind filter
	kind := 0 // 0 means all kinds
	if kindStr := r.URL.Query().Get("kind"); kindStr != "" {
		if parsed, err := strconv.Atoi(kindStr); err == nil && parsed >= 0 {
			kind = parsed
		}
	}

	// Get search query
	searchQuery := r.URL.Query().Get("search")

	// Get time range filter
	timeRange := r.URL.Query().Get("time_range")
	if timeRange == "" {
		timeRange = "7d" // Default to 7 days
	}

	// Get minimum trending score filter
	minTrendingScore := 0.0
	if scoreStr := r.URL.Query().Get("min_trending_score"); scoreStr != "" {
		if parsed, err := strconv.ParseFloat(scoreStr, 64); err == nil && parsed >= 0 {
			minTrendingScore = parsed
		}
	}

	log.Printf("🔍 [API] Fetching trending notes with limit: %d, offset: %d, kind: %d, search: %s, timeRange: %s, minTrendingScore: %f",
		limit, offset, kind, searchQuery, timeRange, minTrendingScore)

	// Fetch trending notes with filters
	notes, err := scraper.GetTrendingNotesWithFilters(limit, offset, kind, searchQuery, timeRange, minTrendingScore)
	if err != nil {
		log.Printf("❌ [API] Error fetching trending notes: %v", err)
		http.Error(w, "Error fetching trending notes: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("✅ [API] Successfully fetched %d trending notes", len(notes))

	// Set content type header
	w.Header().Set("Content-Type", "application/json")

	// Return the notes as JSON
	if err := json.NewEncoder(w).Encode(notes); err != nil {
		log.Printf("❌ [API] Error encoding response: %v", err)
		http.Error(w, "Error encoding response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("📤 [API] Trending notes response sent successfully")
}

// handleScrapedNotesAPI handles requests for scraped notes
func handleScrapedNotesAPI(w http.ResponseWriter, r *http.Request) {
	// Get limit parameter
	limit := 50
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	// Get offset parameter for pagination
	offset := 0
	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if parsed, err := strconv.Atoi(offsetStr); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	// Get kind filter
	kind := 0 // 0 means all kinds
	if kindStr := r.URL.Query().Get("kind"); kindStr != "" {
		if parsed, err := strconv.Atoi(kindStr); err == nil && parsed >= 0 {
			kind = parsed
		}
	}

	// Get search query
	searchQuery := r.URL.Query().Get("search")

	// Get since parameter (default to last 24 hours)
	since := time.Now().Add(-24 * time.Hour)
	if sinceStr := r.URL.Query().Get("since"); sinceStr != "" {
		if parsed, err := time.Parse(time.RFC3339, sinceStr); err == nil {
			since = parsed
		}
	}

	// Get until parameter (default to now)
	until := time.Now()
	if untilStr := r.URL.Query().Get("until"); untilStr != "" {
		if parsed, err := time.Parse(time.RFC3339, untilStr); err == nil {
			until = parsed
		}
	}

	// Get minimum interaction score filter
	minInteractionScore := 0
	if scoreStr := r.URL.Query().Get("min_interaction_score"); scoreStr != "" {
		if parsed, err := strconv.Atoi(scoreStr); err == nil && parsed >= 0 {
			minInteractionScore = parsed
		}
	}

	// Get sort order
	sortOrder := r.URL.Query().Get("sort")
	if sortOrder == "" {
		sortOrder = "created_at_desc" // Default sort order
	}

	log.Printf("🔍 [API] Fetching scraped notes with limit: %d, offset: %d, kind: %d, search: %s, since: %s, until: %s, minInteractionScore: %d, sort: %s",
		limit, offset, kind, searchQuery, since.Format(time.RFC3339), until.Format(time.RFC3339), minInteractionScore, sortOrder)

	// Fetch scraped notes with filters
	notes, err := scraper.GetScrapedNotesWithFilters(limit, offset, kind, searchQuery, since, until, minInteractionScore, sortOrder)
	if err != nil {
		log.Printf("❌ [API] Error fetching scraped notes: %v", err)
		http.Error(w, "Error fetching scraped notes: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("✅ [API] Successfully fetched %d scraped notes", len(notes))

	// Set content type header
	w.Header().Set("Content-Type", "application/json")

	// Return the notes as JSON
	if err := json.NewEncoder(w).Encode(notes); err != nil {
		log.Printf("❌ [API] Error encoding response: %v", err)
		http.Error(w, "Error encoding response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("📤 [API] Scraped notes response sent successfully")
}

// handleTriggerDataSetupAPI triggers the comprehensive data setup manually
func handleTriggerDataSetupAPI(w http.ResponseWriter, r *http.Request) {
	// Only accept POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Start data setup in a goroutine to avoid blocking
	go func() {
		log.Println("🔄 Manual data setup triggered via API")
		scraper.RunDataSetup()
	}()

	// Return immediate response
	w.Header().Set("Content-Type", "application/json")
	response := map[string]string{
		"status":  "success",
		"message": "Data setup triggered successfully",
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Error encoding response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// handleSyncNotesAPI triggers the sync of existing notes to scraped_notes table
func handleSyncNotesAPI(w http.ResponseWriter, r *http.Request) {
	// Only accept POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Start sync in a goroutine to avoid blocking
	go func() {
		log.Println("🔄 Manual note sync triggered via API")
		scraper.SyncExistingNotesToScraped()
	}()

	// Return immediate response
	w.Header().Set("Content-Type", "application/json")
	response := map[string]string{
		"status":  "success",
		"message": "Note sync triggered successfully",
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Error encoding response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

func handleTrendingTopAuthorsAPI(w http.ResponseWriter, r *http.Request) {
	log.Printf("📊 Trending top authors API called")

	// Get limit parameter
	limit := 20
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	// Get offset parameter for pagination
	offset := 0
	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if parsed, err := strconv.Atoi(offsetStr); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	// Get time range parameter (default: 7 days)
	timeRange := r.URL.Query().Get("time_range")
	if timeRange == "" {
		timeRange = "7d"
	}

	// Get minimum engagement score filter
	minEngagementScore := 0.0
	if scoreStr := r.URL.Query().Get("min_engagement_score"); scoreStr != "" {
		if parsed, err := strconv.ParseFloat(scoreStr, 64); err == nil && parsed >= 0 {
			minEngagementScore = parsed
		}
	}

	// Get minimum notes count filter
	minNotesCount := 1
	if countStr := r.URL.Query().Get("min_notes_count"); countStr != "" {
		if parsed, err := strconv.Atoi(countStr); err == nil && parsed >= 0 {
			minNotesCount = parsed
		}
	}

	// Get search query for author names
	searchQuery := r.URL.Query().Get("search")

	log.Printf("🔍 Fetching trending top authors with limit: %d, offset: %d, time range: %s, minEngagementScore: %f, minNotesCount: %d, search: %s",
		limit, offset, timeRange, minEngagementScore, minNotesCount, searchQuery)

	// Fetch trending top authors with filters
	authors, err := repository.fetchTrendingTopAuthorsWithFilters(limit, offset, timeRange, minEngagementScore, minNotesCount, searchQuery)
	if err != nil {
		log.Printf("❌ Error fetching trending top authors: %v", err)
		http.Error(w, "Error fetching trending top authors: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("✅ Successfully fetched %d trending top authors", len(authors))

	// Set content type header
	w.Header().Set("Content-Type", "application/json")

	// Return the authors as JSON
	if err := json.NewEncoder(w).Encode(authors); err != nil {
		log.Printf("❌ Error encoding trending top authors response: %v", err)
		http.Error(w, "Error encoding response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("📤 Sent trending top authors response with %d authors", len(authors))
}
