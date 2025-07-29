package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"sync"
	"time"

	"github.com/lib/pq"
	"github.com/nbd-wtf/go-nostr"
)

type ScrapedNote struct {
	ID               string    `json:"id"`
	AuthorID         string    `json:"author_id"`
	Kind             int       `json:"kind"`
	Content          string    `json:"content"`
	RawJSON          string    `json:"raw_json"`
	CreatedAt        time.Time `json:"created_at"`
	ScrapedAt        time.Time `json:"scraped_at"`
	InteractionScore int       `json:"interaction_score"`
	ViralScore       float64   `json:"viral_score"`
	TrendingScore    float64   `json:"trending_score"`
	IsViral          bool      `json:"is_viral"`
	IsTrending       bool      `json:"is_trending"`
}

type ViralNote struct {
	ID         string    `json:"id"`
	NoteID     string    `json:"note_id"`
	ViralScore float64   `json:"viral_score"`
	DetectedAt time.Time `json:"detected_at"`
	ExpiresAt  time.Time `json:"expires_at"`
}

type TrendingNote struct {
	ID            string    `json:"id"`
	NoteID        string    `json:"note_id"`
	TrendingScore float64   `json:"trending_score"`
	DetectedAt    time.Time `json:"detected_at"`
	ExpiresAt     time.Time `json:"expires_at"`
}

type NoteScraper struct {
	db               *sql.DB
	pool             *nostr.SimplePool
	relays           []string
	scrapingMutex    sync.Mutex
	isBackupAfkRelay bool
}

func NewNoteScraper(db *sql.DB, isBackupAfkRelay bool) *NoteScraper {
	return &NoteScraper{
		db:               db,
		pool:             nostr.NewSimplePool(context.Background()),
		relays:           relays, // Use the global relays from main.go
		isBackupAfkRelay: isBackupAfkRelay,
	}
}

// StartScrapingCron starts the cron job for scraping notes
func (s *NoteScraper) StartScrapingCron() {
	// Scrape every 15 minutes
	ticker := time.NewTicker(15 * time.Minute)
	defer ticker.Stop()

	log.Println("🚀 Starting note scraping cron job (every 15 minutes)")

	// Run initial scrape
	s.ScrapeNotes()

	for {
		select {
		case <-ticker.C:
			s.ScrapeNotes()
		}
	}
}

// StartArticleVideoScrapingCron starts a separate cron job for ArticleKind and Video events
func (s *NoteScraper) StartArticleVideoScrapingCron() {
	// Scrape ArticleKind and Video events every 30 minutes (less frequent due to larger content)
	ticker := time.NewTicker(30 * time.Minute)
	defer ticker.Stop()

	log.Println("📰🎥 Starting ArticleKind and Video scraping cron job (every 30 minutes)")

	// Run initial scrape
	log.Println("📰🎥 Running initial article and video scrape...")
	s.ScrapeArticleVideoNotes()

	for {
		select {
		case <-ticker.C:
			log.Println("📰🎥 Cron ticker triggered - running article and video scrape...")
			s.ScrapeArticleVideoNotes()
		}
	}
}

// ScrapeNotes scrapes recent notes from relays and saves them to the database
func (s *NoteScraper) ScrapeNotes() {
	s.scrapingMutex.Lock()
	defer s.scrapingMutex.Unlock()

	log.Println("📝 Starting note scraping...")
	startTime := time.Now()

	// Get notes from the last 2 hours
	since := time.Now().Add(-2 * time.Hour)
	sinceTimestamp := nostr.Timestamp(since.Unix())
	filters := nostr.Filters{{
		Kinds: []int{
			nostr.KindTextNote,
			nostr.KindReaction,
			nostr.KindZap,
			nostr.KindReply,
			nostr.KindArticle,
			nostr.KindGenericRepost,
			20,    // KindImage
			22,    // Short video
			31000, // VerticalVideo
			31001, // HorizontalVideo
			34236, // VerticalVideo
			34235, // HorizontalVideo
		},
		Since: &sinceTimestamp,
	}}

	// Fetch events directly from all relays using QuerySync
	var eventList []*nostr.Event

	for _, relayURL := range s.relays {
		relay, err := s.pool.EnsureRelay(relayURL)
		if err != nil {
			log.Printf("❌ Error ensuring relay %s: %v", relayURL, err)
			continue
		}

		log.Printf("🔍 Querying relay %s for notes...", relayURL)
		events, err := relay.QuerySync(context.Background(), filters[0])
		if err != nil {
			log.Printf("❌ Error querying relay %s: %v", relayURL, err)
			continue
		}

		log.Printf("📊 Found %d events from relay %s", len(events), relayURL)
		eventList = append(eventList, events...)
	}

	// Remove duplicates based on event ID
	uniqueEvents := make(map[string]*nostr.Event)
	for _, ev := range eventList {
		uniqueEvents[ev.ID] = ev
	}

	// Convert back to slice
	eventList = make([]*nostr.Event, 0, len(uniqueEvents))
	for _, ev := range uniqueEvents {
		eventList = append(eventList, ev)
	}

	log.Printf("📊 After deduplication: %d unique events", len(eventList))

	// Sort events to handle dependencies (parent notes before comments)
	eventList = s.sortEventsByDependencies(eventList)

	log.Println("eventList sorted", len(eventList))

	scrapedCount := 0
	viralCount := 0
	trendingCount := 0

	for _, ev := range eventList {
		// Calculate scores
		interactionScore := s.calculateInteractionScore(ev)
		viralScore := s.calculateViralScore(ev, interactionScore)
		trendingScore := s.calculateTrendingScore(ev, interactionScore)

		// Determine if note is viral or trending
		isViral := viralScore >= viralThreshold
		isTrending := trendingScore >= 50.0 // Lower threshold for trending

		// Save to the main notes table first
		if err := repository.SaveNostrEvent(ev); err != nil {
			// Log error but continue processing other events
			log.Printf("Error saving note to main table %s: %v", ev.ID, err)
			continue
		}

		// Save to scraped notes table with scores and metadata
		scrapedNote := &ScrapedNote{
			ID:               ev.ID,
			AuthorID:         ev.PubKey,
			Kind:             ev.Kind,
			Content:          ev.Content,
			RawJSON:          ev.String(),
			CreatedAt:        ev.CreatedAt.Time(),
			ScrapedAt:        time.Now(),
			InteractionScore: interactionScore,
			ViralScore:       viralScore,
			TrendingScore:    trendingScore,
			IsViral:          isViral,
			IsTrending:       isTrending,
		}

		if err := s.saveScrapedNote(scrapedNote); err != nil {
			log.Printf("Error saving scraped note %s: %v", ev.ID, err)
			continue
		}
		scrapedCount++

		// Save viral note if applicable
		if isViral {
			viralNote := &ViralNote{
				ID:         fmt.Sprintf("%s_viral", ev.ID),
				NoteID:     ev.ID,
				ViralScore: viralScore,
				DetectedAt: time.Now(),
				ExpiresAt:  time.Now().AddDate(0, 0, 7), // 7 days
			}
			if err := s.saveViralNote(viralNote); err != nil {
				log.Printf("Error saving viral note %s: %v", ev.ID, err)
			} else {
				viralCount++
			}
		}

		// Save trending note if applicable
		if isTrending {
			trendingNote := &TrendingNote{
				ID:            fmt.Sprintf("%s_trending", ev.ID),
				NoteID:        ev.ID,
				TrendingScore: trendingScore,
				DetectedAt:    time.Now(),
				ExpiresAt:     time.Now().AddDate(0, 0, 3), // 3 days
			}
			if err := s.saveTrendingNote(trendingNote); err != nil {
				log.Printf("Error saving trending note %s: %v", ev.ID, err)
			} else {
				trendingCount++
			}
		}
	}

	// Clean up expired viral and trending notes
	s.cleanupExpiredNotes()

	// Backup articles and videos to AFK relay if enabled
	if s.isBackupAfkRelay {
		log.Println("🔄 Backing up articles and videos from regular scraping to AFK relay...")
		backupCount := 0

		for _, ev := range eventList {
			// Only backup articles and videos
			if ev.Kind == nostr.KindArticle ||
				ev.Kind == 1063 || // KindVideo
				ev.Kind == 22 || // Short video
				ev.Kind == 31000 || // VerticalVideo
				ev.Kind == 31001 || // HorizontalVideo
				ev.Kind == 34236 || // VerticalVideo
				ev.Kind == 34235 { // HorizontalVideo

				// Publish the event to each AFK relay
				for _, relayURL := range afkRelays {
					relay, err := s.pool.EnsureRelay(relayURL)
					if err != nil {
						log.Printf("❌ Error ensuring relay %s: %v", relayURL, err)
						continue
					}

					err = relay.Publish(context.Background(), *ev)
					if err != nil {
						log.Printf("❌ Error backing up event %s to relay %s: %v", ev.ID, relayURL, err)
					} else {
						backupCount++
						log.Printf("✅ Backed up event %s (kind: %d) to relay %s", ev.ID, ev.Kind, relayURL)
					}
				}
			}
		}

		log.Printf("🔄 Backup completed: %d articles/videos backed up to AFK relays", backupCount)
	}

	log.Printf("✅ Scraping completed in %v: %d notes scraped, %d viral notes, %d trending notes",
		time.Since(startTime), scrapedCount, viralCount, trendingCount)
}

// ScrapeArticleVideoNotes scrapes ArticleKind and Video events specifically
func (s *NoteScraper) ScrapeArticleVideoNotes() {
	s.scrapingMutex.Lock()
	defer s.scrapingMutex.Unlock()

	log.Println("📰🎥 Starting ArticleKind and Video note scraping...")
	startTime := time.Now()

	// Get notes from the last 4 hours (longer window for articles and videos)
	since := time.Now().Add(-4 * time.Hour)
	sinceTimestamp := nostr.Timestamp(since.Unix())
	filters := nostr.Filters{{
		Kinds: []int{
			nostr.KindArticle, // 30023
			1063,              // KindVideo
			22,                // Short video
			31000,             // VerticalVideo
			31001,             // HorizontalVideo
			34236,             // VerticalVideo
			34235,             // HorizontalVideo
		},
		Since: &sinceTimestamp,
	}}

	log.Printf("🔍 Searching for articles and videos with filters: %+v", filters)

	// Fetch events directly from all relays using QuerySync
	var eventList []*nostr.Event
	allRelayURLs := append(s.relays, allRelays...)

	for _, relayURL := range allRelayURLs {
		relay, err := s.pool.EnsureRelay(relayURL)
		if err != nil {
			log.Printf("❌ Error ensuring relay %s: %v", relayURL, err)
			continue
		}

		log.Printf("🔍 Querying relay %s for articles and videos...", relayURL)
		events, err := relay.QuerySync(context.Background(), filters[0])
		if err != nil {
			log.Printf("❌ Error querying relay %s: %v", relayURL, err)
			continue
		}

		log.Printf("📊 Found %d events from relay %s", len(events), relayURL)
		eventList = append(eventList, events...)
	}

	log.Printf("📊 Found %d total events, processing articles and videos...", len(eventList))

	// Remove duplicates based on event ID
	uniqueEvents := make(map[string]*nostr.Event)
	for _, ev := range eventList {
		uniqueEvents[ev.ID] = ev
	}

	// Convert back to slice
	eventList = make([]*nostr.Event, 0, len(uniqueEvents))
	for _, ev := range uniqueEvents {
		eventList = append(eventList, ev)
	}

	log.Printf("📊 After deduplication: %d unique events", len(eventList))

	// Sort events to handle dependencies (parent notes before comments)
	eventList = s.sortEventsByDependencies(eventList)

	log.Println("eventList sorted", len(eventList))

	scrapedCount := 0
	viralCount := 0
	trendingCount := 0

	for _, ev := range eventList {
		// Calculate scores
		interactionScore := s.calculateInteractionScore(ev)
		viralScore := s.calculateViralScore(ev, interactionScore)
		trendingScore := s.calculateTrendingScore(ev, interactionScore)

		// Determine if note is viral or trending
		isViral := viralScore >= viralThreshold
		isTrending := trendingScore >= 50.0 // Lower threshold for trending

		// Save to the main notes table first
		if err := repository.SaveNostrEvent(ev); err != nil {
			// Log error but continue processing other events
			log.Printf("Error saving note to main table %s: %v", ev.ID, err)
			continue
		}

		// Save to scraped notes table with scores and metadata
		scrapedNote := &ScrapedNote{
			ID:               ev.ID,
			AuthorID:         ev.PubKey,
			Kind:             ev.Kind,
			Content:          ev.Content,
			RawJSON:          ev.String(),
			CreatedAt:        ev.CreatedAt.Time(),
			ScrapedAt:        time.Now(),
			InteractionScore: interactionScore,
			ViralScore:       viralScore,
			TrendingScore:    trendingScore,
			IsViral:          isViral,
			IsTrending:       isTrending,
		}

		if err := s.saveScrapedNote(scrapedNote); err != nil {
			log.Printf("Error saving scraped note %s: %v", ev.ID, err)
			continue
		}
		scrapedCount++

		// Save viral note if applicable
		if isViral {
			viralNote := &ViralNote{
				ID:         fmt.Sprintf("%s_viral", ev.ID),
				NoteID:     ev.ID,
				ViralScore: viralScore,
				DetectedAt: time.Now(),
				ExpiresAt:  time.Now().AddDate(0, 0, 7), // 7 days
			}
			if err := s.saveViralNote(viralNote); err != nil {
				log.Printf("Error saving viral note %s: %v", ev.ID, err)
			} else {
				viralCount++
			}
		}

		// Save trending note if applicable
		if isTrending {
			trendingNote := &TrendingNote{
				ID:            fmt.Sprintf("%s_trending", ev.ID),
				NoteID:        ev.ID,
				TrendingScore: trendingScore,
				DetectedAt:    time.Now(),
				ExpiresAt:     time.Now().AddDate(0, 0, 3), // 3 days
			}
			if err := s.saveTrendingNote(trendingNote); err != nil {
				log.Printf("Error saving trending note %s: %v", ev.ID, err)
			} else {
				trendingCount++
			}
		}
	}

	if s.isBackupAfkRelay {
		log.Println("🔄 Backing up articles and videos to AFK relay...")
		log.Printf("🔧 Backup enabled: %v, eventList length: %d", s.isBackupAfkRelay, len(eventList))
		backupCount := 0

		fmt.Println("eventList", len(eventList))

		for _, ev := range eventList {
			log.Printf("🔍 Checking event %s (kind: %d) for backup eligibility", ev.ID, ev.Kind)
			// Only backup articles and videos
			if ev.Kind == nostr.KindArticle ||
				ev.Kind == 1063 || // KindVideo
				ev.Kind == 22 || // Short video
				ev.Kind == 31000 || // VerticalVideo
				ev.Kind == 31001 || // HorizontalVideo
				ev.Kind == 34236 || // VerticalVideo
				ev.Kind == 34235 { // HorizontalVideo

				log.Printf("✅ Event %s (kind: %d) is eligible for backup", ev.ID, ev.Kind)
				// Publish the event to each AFK relay
				for _, relayURL := range afkRelays {
					relay, err := s.pool.EnsureRelay(relayURL)
					if err != nil {
						log.Printf("❌ Error ensuring relay %s: %v", relayURL, err)
						continue
					}

					err = relay.Publish(context.Background(), *ev)
					if err != nil {
						log.Printf("❌ Error backing up event %s to relay %s: %v", ev.ID, relayURL, err)
					} else {
						backupCount++
						log.Printf("✅ Backed up event %s (kind: %d) to relay %s", ev.ID, ev.Kind, relayURL)
					}
				}
			} else {
				log.Printf("❌ Event %s (kind: %d) is NOT eligible for backup", ev.ID, ev.Kind)
			}
		}

		log.Printf("🔄 Backup completed: %d articles/videos backed up to AFK relays", backupCount)
	} else {
		log.Printf("⚠️ Backup disabled: isBackupAfkRelay = %v", s.isBackupAfkRelay)
	}

	log.Printf("📰🎥 ArticleKind and Video scraping completed in %v: %d scraped, %d viral, %d trending",
		time.Since(startTime), scrapedCount, viralCount, trendingCount)
}

// calculateInteractionScore calculates the total interaction score for a note
func (s *NoteScraper) calculateInteractionScore(event *nostr.Event) int {
	// Query the database for actual interaction counts
	query := `
		SELECT 
			COALESCE(comment_count, 0) + 
			COALESCE(reaction_count, 0) + 
			COALESCE(zap_count, 0) as total_interactions
		FROM (
			SELECT 
				(SELECT COUNT(*) FROM comments WHERE note_id = $1) as comment_count,
				(SELECT COUNT(*) FROM reactions WHERE note_id = $1) as reaction_count,
				(SELECT COUNT(*) FROM zaps WHERE note_id = $1) as zap_count
		) as interactions
	`

	var totalInteractions int
	err := s.db.QueryRowContext(context.Background(), query, event.ID).Scan(&totalInteractions)
	if err != nil {
		// Fallback to heuristic if database query fails
		score := 0

		// Base score from content length (longer content might be more engaging)
		score += len(event.Content) / 100

		// Bonus for having tags
		if len(event.Tags) > 0 {
			score += len(event.Tags) * 2
		}

		// Bonus for specific kinds
		switch event.Kind {
		case nostr.KindArticle:
			score += 10
		case 20: // KindImage
			score += 5
		}

		return score
	}

	return totalInteractions
}

// calculateViralScore calculates the viral score for a note
func (s *NoteScraper) calculateViralScore(event *nostr.Event, interactionScore int) float64 {
	// Calculate time decay
	hoursSinceCreation := time.Since(event.CreatedAt.Time()).Hours()
	timeDecay := math.Exp(-decayRate * hoursSinceCreation)

	// Base viral score from interaction score
	viralScore := float64(interactionScore) * timeDecay

	// Apply viral dampening
	viralScore *= viralNoteDampening

	return viralScore
}

// calculateTrendingScore calculates the trending score for a note
func (s *NoteScraper) calculateTrendingScore(event *nostr.Event, interactionScore int) float64 {
	// Trending score is similar to viral but with different weights
	hoursSinceCreation := time.Since(event.CreatedAt.Time()).Hours()
	timeDecay := math.Exp(-0.1 * hoursSinceCreation) // Faster decay for trending

	// Base trending score
	trendingScore := float64(interactionScore) * timeDecay

	// Additional factors for trending
	if len(event.Content) > 200 {
		trendingScore *= 1.2 // Bonus for longer content
	}

	if len(event.Tags) > 2 {
		trendingScore *= 1.1 // Bonus for more tags
	}

	return trendingScore
}

// saveScrapedNote saves a scraped note to the database
func (s *NoteScraper) saveScrapedNote(note *ScrapedNote) error {
	query := `
		INSERT INTO scraped_notes (id, author_id, kind, content, raw_json, created_at, scraped_at, 
			interaction_score, viral_score, trending_score, is_viral, is_trending)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		ON CONFLICT (id) DO UPDATE SET
			scraped_at = $7,
			interaction_score = $8,
			viral_score = $9,
			trending_score = $10,
			is_viral = $11,
			is_trending = $12
	`

	_, err := s.db.ExecContext(context.Background(), query,
		note.ID, note.AuthorID, note.Kind, note.Content, note.RawJSON,
		note.CreatedAt, note.ScrapedAt, note.InteractionScore,
		note.ViralScore, note.TrendingScore, note.IsViral, note.IsTrending)

	return err
}

// saveViralNote saves a viral note to the database
func (s *NoteScraper) saveViralNote(note *ViralNote) error {
	query := `
		INSERT INTO viral_notes (id, note_id, viral_score, detected_at, expires_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (id) DO UPDATE SET
			viral_score = $3,
			detected_at = $4,
			expires_at = $5
	`

	_, err := s.db.ExecContext(context.Background(), query,
		note.ID, note.NoteID, note.ViralScore, note.DetectedAt, note.ExpiresAt)

	return err
}

// saveTrendingNote saves a trending note to the database
func (s *NoteScraper) saveTrendingNote(note *TrendingNote) error {
	query := `
		INSERT INTO trending_notes (id, note_id, trending_score, detected_at, expires_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (id) DO UPDATE SET
			trending_score = $3,
			detected_at = $4,
			expires_at = $5
	`

	_, err := s.db.ExecContext(context.Background(), query,
		note.ID, note.NoteID, note.TrendingScore, note.DetectedAt, note.ExpiresAt)

	return err
}

// cleanupExpiredNotes removes expired viral and trending notes
func (s *NoteScraper) cleanupExpiredNotes() {
	now := time.Now()

	// Clean up expired viral notes
	viralQuery := `DELETE FROM viral_notes WHERE expires_at < $1`
	result, err := s.db.ExecContext(context.Background(), viralQuery, now)
	if err != nil {
		log.Printf("Error cleaning up expired viral notes: %v", err)
	} else {
		rowsAffected, _ := result.RowsAffected()
		if rowsAffected > 0 {
			log.Printf("Cleaned up %d expired viral notes", rowsAffected)
		}
	}

	// Clean up expired trending notes
	trendingQuery := `DELETE FROM trending_notes WHERE expires_at < $1`
	result, err = s.db.ExecContext(context.Background(), trendingQuery, now)
	if err != nil {
		log.Printf("Error cleaning up expired trending notes: %v", err)
	} else {
		rowsAffected, _ := result.RowsAffected()
		if rowsAffected > 0 {
			log.Printf("Cleaned up %d expired trending notes", rowsAffected)
		}
	}
}

// GetViralNotes retrieves current viral notes
func (s *NoteScraper) GetViralNotes(limit int) ([]ScrapedNote, error) {
	query := `
		SELECT id, author_id, kind, content, raw_json, 
		       created_at, scraped_at, interaction_score, 
		       viral_score, trending_score, is_viral, is_trending
		FROM scraped_notes
		WHERE is_viral = true OR viral_score > 0
		ORDER BY viral_score DESC, created_at DESC
		LIMIT $1
	`

	rows, err := s.db.QueryContext(context.Background(), query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []ScrapedNote
	for rows.Next() {
		var note ScrapedNote
		err := rows.Scan(
			&note.ID, &note.AuthorID, &note.Kind, &note.Content, &note.RawJSON,
			&note.CreatedAt, &note.ScrapedAt, &note.InteractionScore,
			&note.ViralScore, &note.TrendingScore, &note.IsViral, &note.IsTrending,
		)
		if err != nil {
			return nil, err
		}
		notes = append(notes, note)
	}

	return notes, nil
}

// GetTrendingNotes retrieves current trending notes
func (s *NoteScraper) GetTrendingNotes(limit int) ([]ScrapedNote, error) {
	query := `
		SELECT id, author_id, kind, content, raw_json, 
		       created_at, scraped_at, interaction_score, 
		       viral_score, trending_score, is_viral, is_trending
		FROM scraped_notes
		WHERE is_trending = true OR trending_score > 0
		ORDER BY trending_score DESC, created_at DESC
		LIMIT $1
	`

	rows, err := s.db.QueryContext(context.Background(), query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []ScrapedNote
	for rows.Next() {
		var note ScrapedNote
		err := rows.Scan(
			&note.ID, &note.AuthorID, &note.Kind, &note.Content, &note.RawJSON,
			&note.CreatedAt, &note.ScrapedAt, &note.InteractionScore,
			&note.ViralScore, &note.TrendingScore, &note.IsViral, &note.IsTrending,
		)
		if err != nil {
			return nil, err
		}
		notes = append(notes, note)
	}

	return notes, nil
}

// GetScrapedNotes retrieves scraped notes with optional filters
func (s *NoteScraper) GetScrapedNotes(limit int, kind int, since time.Time) ([]ScrapedNote, error) {
	query := `
		SELECT id, author_id, kind, content, raw_json, created_at, scraped_at,
		       interaction_score, viral_score, trending_score, is_viral, is_trending
		FROM scraped_notes
		WHERE created_at >= $1
		AND ($2 = 0 OR kind = $2)
		ORDER BY created_at DESC
		LIMIT $3
	`

	rows, err := s.db.QueryContext(context.Background(), query, since, kind, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []ScrapedNote
	for rows.Next() {
		var note ScrapedNote
		err := rows.Scan(
			&note.ID, &note.AuthorID, &note.Kind, &note.Content, &note.RawJSON,
			&note.CreatedAt, &note.ScrapedAt, &note.InteractionScore,
			&note.ViralScore, &note.TrendingScore, &note.IsViral, &note.IsTrending,
		)
		if err != nil {
			return nil, err
		}
		notes = append(notes, note)
	}

	return notes, nil
}

// GetViralNotesWithFilters retrieves viral notes with enhanced filtering and pagination
func (s *NoteScraper) GetViralNotesWithFilters(limit int, offset int, kinds []int, searchQuery string, timeRange string, minViralScore float64, tags []string, authors []string) ([]ScrapedNote, error) {
	// Calculate the time cutoff based on timeRange
	var timeCutoff time.Time
	switch timeRange {
	case "1h":
		timeCutoff = time.Now().Add(-1 * time.Hour)
	case "6h":
		timeCutoff = time.Now().Add(-6 * time.Hour)
	case "24h", "1d":
		timeCutoff = time.Now().Add(-24 * time.Hour)
	case "7d":
		timeCutoff = time.Now().Add(-7 * 24 * time.Hour)
	case "30d":
		timeCutoff = time.Now().Add(-30 * 24 * time.Hour)
	default:
		timeCutoff = time.Now().Add(-7 * 24 * time.Hour) // Default to 7 days
	}

	// Build the base query - make it less restrictive
	baseQuery := `
		SELECT id, author_id, kind, content, raw_json, 
		       created_at, scraped_at, interaction_score, 
		       viral_score, trending_score, is_viral, is_trending
		FROM scraped_notes
		WHERE created_at >= $1
	`

	// Build parameters slice
	params := []interface{}{timeCutoff}
	paramIndex := 2

	// Add viral score filter if specified
	if minViralScore > 0 {
		baseQuery += fmt.Sprintf(" AND (is_viral = true OR viral_score >= $%d)", paramIndex)
		params = append(params, minViralScore)
		paramIndex++
	}

	// Add kinds filter if specified
	if len(kinds) > 0 {
		baseQuery += fmt.Sprintf(" AND kind = ANY($%d)", paramIndex)
		params = append(params, pq.Array(kinds))
		paramIndex++
	}

	// Add search filter if specified
	if searchQuery != "" {
		baseQuery += fmt.Sprintf(" AND (content ILIKE $%d OR author_id ILIKE $%d)", paramIndex, paramIndex)
		params = append(params, "%"+searchQuery+"%")
		paramIndex++
	}

	// Add authors filter if specified
	if len(authors) > 0 {
		baseQuery += fmt.Sprintf(" AND author_id = ANY($%d)", paramIndex)
		params = append(params, pq.Array(authors))
		paramIndex++
	}

	// Add ordering and pagination - order by viral score first, then by interaction score as fallback
	baseQuery += `
		ORDER BY viral_score DESC, interaction_score DESC, created_at DESC
		LIMIT $` + fmt.Sprintf("%d", paramIndex) + ` OFFSET $` + fmt.Sprintf("%d", paramIndex+1)
	params = append(params, limit, offset)

	// Debug: Log the query and parameters
	log.Printf("🔍 [VIRAL] Query: %s", baseQuery)
	log.Printf("🔍 [VIRAL] Params: %v", params)
	log.Printf("🔍 [VIRAL] Limit: %d, Offset: %d", limit, offset)

	// Execute the query
	rows, err := s.db.QueryContext(context.Background(), baseQuery, params...)
	if err != nil {
		log.Printf("❌ [VIRAL] Query error: %v", err)
		return nil, err
	}
	defer rows.Close()

	var notes []ScrapedNote
	for rows.Next() {
		var note ScrapedNote
		err := rows.Scan(
			&note.ID, &note.AuthorID, &note.Kind, &note.Content, &note.RawJSON,
			&note.CreatedAt, &note.ScrapedAt, &note.InteractionScore,
			&note.ViralScore, &note.TrendingScore, &note.IsViral, &note.IsTrending,
		)
		if err != nil {
			log.Printf("❌ [VIRAL] Row scan error: %v", err)
			return nil, err
		}
		notes = append(notes, note)
	}

	log.Printf("✅ [VIRAL] Found %d viral notes", len(notes))
	return notes, nil
}

// GetTrendingNotesWithFilters retrieves trending notes with enhanced filtering and pagination
func (s *NoteScraper) GetTrendingNotesWithFilters(limit int, offset int, kinds []int, searchQuery string, timeRange string, minTrendingScore float64, tags []string, authors []string) ([]ScrapedNote, error) {
	// Calculate the time cutoff based on timeRange
	var timeCutoff time.Time
	switch timeRange {
	case "1h":
		timeCutoff = time.Now().Add(-1 * time.Hour)
	case "6h":
		timeCutoff = time.Now().Add(-6 * time.Hour)
	case "24h", "1d":
		timeCutoff = time.Now().Add(-24 * time.Hour)
	case "7d":
		timeCutoff = time.Now().Add(-7 * 24 * time.Hour)
	case "30d":
		timeCutoff = time.Now().Add(-30 * 24 * time.Hour)
	default:
		timeCutoff = time.Now().Add(-7 * 24 * time.Hour) // Default to 7 days
	}

	// Build the base query
	baseQuery := `
		SELECT id, author_id, kind, content, raw_json, 
		       created_at, scraped_at, interaction_score, 
		       viral_score, trending_score, is_viral, is_trending
		FROM scraped_notes
		WHERE (is_trending = true OR trending_score > $1)
		AND created_at >= $2
	`

	// Build parameters slice
	params := []interface{}{minTrendingScore, timeCutoff}
	paramIndex := 3

	// Add kinds filter if specified
	if len(kinds) > 0 {
		baseQuery += fmt.Sprintf(" AND kind = ANY($%d)", paramIndex)
		params = append(params, pq.Array(kinds))
		paramIndex++
	}

	// Add search filter if specified
	if searchQuery != "" {
		baseQuery += fmt.Sprintf(" AND (content ILIKE $%d OR author_id ILIKE $%d)", paramIndex, paramIndex)
		params = append(params, "%"+searchQuery+"%")
		paramIndex++
	}

	// Add authors filter if specified
	if len(authors) > 0 {
		baseQuery += fmt.Sprintf(" AND author_id = ANY($%d)", paramIndex)
		params = append(params, pq.Array(authors))
		paramIndex++
	}

	// Add ordering and pagination
	baseQuery += `
		ORDER BY trending_score DESC, created_at DESC
		LIMIT $` + fmt.Sprintf("%d", paramIndex) + ` OFFSET $` + fmt.Sprintf("%d", paramIndex+1)
	params = append(params, limit, offset)

	// Debug: Log the query and parameters
	log.Printf("🔍 [TRENDING] Query: %s", baseQuery)
	log.Printf("🔍 [TRENDING] Params: %v", params)
	log.Printf("🔍 [TRENDING] Limit: %d, Offset: %d", limit, offset)

	// Execute the query
	rows, err := s.db.QueryContext(context.Background(), baseQuery, params...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []ScrapedNote
	for rows.Next() {
		var note ScrapedNote
		err := rows.Scan(
			&note.ID, &note.AuthorID, &note.Kind, &note.Content, &note.RawJSON,
			&note.CreatedAt, &note.ScrapedAt, &note.InteractionScore,
			&note.ViralScore, &note.TrendingScore, &note.IsViral, &note.IsTrending,
		)
		if err != nil {
			return nil, err
		}
		notes = append(notes, note)
	}

	return notes, nil
}

// GetScrapedNotesWithFilters retrieves scraped notes with enhanced filtering and pagination
func (s *NoteScraper) GetScrapedNotesWithFilters(limit int, offset int, kinds []int, searchQuery string, since time.Time, until time.Time, minInteractionScore int, sortOrder string, tags []string, authors []string) ([]ScrapedNote, error) {
	// Build the base query
	baseQuery := `
		SELECT id, author_id, kind, content, raw_json, created_at, scraped_at,
		       interaction_score, viral_score, trending_score, is_viral, is_trending
		FROM scraped_notes
		WHERE created_at >= $1 AND created_at <= $2
		AND interaction_score >= $3
	`

	// Build parameters slice
	params := []interface{}{since, until, minInteractionScore}
	paramIndex := 4

	// Add kinds filter if specified
	if len(kinds) > 0 {
		baseQuery += fmt.Sprintf(" AND kind = ANY($%d)", paramIndex)
		params = append(params, pq.Array(kinds))
		paramIndex++
	}

	// Add search filter if specified
	if searchQuery != "" {
		baseQuery += fmt.Sprintf(" AND (content ILIKE $%d OR author_id ILIKE $%d)", paramIndex, paramIndex)
		params = append(params, "%"+searchQuery+"%")
		paramIndex++
	}

	// Add authors filter if specified
	if len(authors) > 0 {
		baseQuery += fmt.Sprintf(" AND author_id = ANY($%d)", paramIndex)
		params = append(params, pq.Array(authors))
		paramIndex++
	}

	// Add ordering based on sortOrder parameter
	switch sortOrder {
	case "created_at_asc":
		baseQuery += " ORDER BY created_at ASC"
	case "created_at_desc":
		baseQuery += " ORDER BY created_at DESC"
	case "interaction_score_desc":
		baseQuery += " ORDER BY interaction_score DESC"
	case "viral_score_desc":
		baseQuery += " ORDER BY viral_score DESC"
	case "trending_score_desc":
		baseQuery += " ORDER BY trending_score DESC"
	default:
		baseQuery += " ORDER BY created_at DESC" // Default sort order
	}

	// Add pagination
	baseQuery += " LIMIT $" + fmt.Sprintf("%d", paramIndex) + " OFFSET $" + fmt.Sprintf("%d", paramIndex+1)
	params = append(params, limit, offset)

	// Debug: Log the query and parameters
	log.Printf("🔍 [SCRAPED] Query: %s", baseQuery)
	log.Printf("🔍 [SCRAPED] Params: %v", params)
	log.Printf("🔍 [SCRAPED] Limit: %d, Offset: %d", limit, offset)

	// Execute the query
	rows, err := s.db.QueryContext(context.Background(), baseQuery, params...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []ScrapedNote
	for rows.Next() {
		var note ScrapedNote
		err := rows.Scan(
			&note.ID, &note.AuthorID, &note.Kind, &note.Content, &note.RawJSON,
			&note.CreatedAt, &note.ScrapedAt, &note.InteractionScore,
			&note.ViralScore, &note.TrendingScore, &note.IsViral, &note.IsTrending,
		)
		if err != nil {
			return nil, err
		}
		notes = append(notes, note)
	}

	return notes, nil
}

// Search methods

// SearchTrendingNotes searches for trending notes
func (s *NoteScraper) SearchTrendingNotes(searchQuery string, limit int, offset int, kinds []int, timeRange string, tags []string, authors []string) ([]ScrapedNote, error) {
	// Calculate the time cutoff based on timeRange
	var timeCutoff time.Time
	switch timeRange {
	case "1h":
		timeCutoff = time.Now().Add(-1 * time.Hour)
	case "6h":
		timeCutoff = time.Now().Add(-6 * time.Hour)
	case "24h", "1d":
		timeCutoff = time.Now().Add(-24 * time.Hour)
	case "7d":
		timeCutoff = time.Now().Add(-7 * 24 * time.Hour)
	case "30d":
		timeCutoff = time.Now().Add(-30 * 24 * time.Hour)
	default:
		timeCutoff = time.Now().Add(-30 * 24 * time.Hour) // Default to 30 days
	}

	// Build the base query
	baseQuery := `
		SELECT id, author_id, kind, content, raw_json, 
		       created_at, scraped_at, interaction_score, 
		       viral_score, trending_score, is_viral, is_trending
		FROM scraped_notes
		WHERE (is_trending = true OR trending_score > 0)
		AND created_at >= $1
		AND (
			content ILIKE $2 
			OR author_id ILIKE $2
			OR raw_json::text ILIKE $2
		)
	`

	// Build parameters slice
	params := []interface{}{timeCutoff, "%" + searchQuery + "%"}
	paramIndex := 3

	// Add kinds filter if specified
	if len(kinds) > 0 {
		baseQuery += fmt.Sprintf(" AND kind = ANY($%d)", paramIndex)
		params = append(params, pq.Array(kinds))
		paramIndex++
	}

	// Add authors filter if specified
	if len(authors) > 0 {
		baseQuery += fmt.Sprintf(" AND author_id = ANY($%d)", paramIndex)
		params = append(params, pq.Array(authors))
		paramIndex++
	}

	// Add ordering and pagination
	baseQuery += `
		ORDER BY trending_score DESC, created_at DESC
		LIMIT $` + fmt.Sprintf("%d", paramIndex) + ` OFFSET $` + fmt.Sprintf("%d", paramIndex+1)
	params = append(params, limit, offset)

	// Execute the query
	rows, err := s.db.QueryContext(context.Background(), baseQuery, params...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []ScrapedNote
	for rows.Next() {
		var note ScrapedNote
		err := rows.Scan(
			&note.ID, &note.AuthorID, &note.Kind, &note.Content, &note.RawJSON,
			&note.CreatedAt, &note.ScrapedAt, &note.InteractionScore,
			&note.ViralScore, &note.TrendingScore, &note.IsViral, &note.IsTrending,
		)
		if err != nil {
			return nil, err
		}
		notes = append(notes, note)
	}

	return notes, nil
}

// SearchViralNotes searches for viral notes
func (s *NoteScraper) SearchViralNotes(searchQuery string, limit int, offset int, kinds []int, timeRange string, tags []string, authors []string) ([]ScrapedNote, error) {
	// Calculate the time cutoff based on timeRange
	var timeCutoff time.Time
	switch timeRange {
	case "1h":
		timeCutoff = time.Now().Add(-1 * time.Hour)
	case "6h":
		timeCutoff = time.Now().Add(-6 * time.Hour)
	case "24h", "1d":
		timeCutoff = time.Now().Add(-24 * time.Hour)
	case "7d":
		timeCutoff = time.Now().Add(-7 * 24 * time.Hour)
	case "30d":
		timeCutoff = time.Now().Add(-30 * 24 * time.Hour)
	default:
		timeCutoff = time.Now().Add(-30 * 24 * time.Hour) // Default to 30 days
	}

	// Build the base query
	baseQuery := `
		SELECT id, author_id, kind, content, raw_json, 
		       created_at, scraped_at, interaction_score, 
		       viral_score, trending_score, is_viral, is_trending
		FROM scraped_notes
		WHERE (is_viral = true OR viral_score > 0)
		AND created_at >= $1
		AND (
			content ILIKE $2 
			OR author_id ILIKE $2
			OR raw_json::text ILIKE $2
		)
	`

	// Build parameters slice
	params := []interface{}{timeCutoff, "%" + searchQuery + "%"}
	paramIndex := 3

	// Add kinds filter if specified
	if len(kinds) > 0 {
		baseQuery += fmt.Sprintf(" AND kind = ANY($%d)", paramIndex)
		params = append(params, pq.Array(kinds))
		paramIndex++
	}

	// Add authors filter if specified
	if len(authors) > 0 {
		baseQuery += fmt.Sprintf(" AND author_id = ANY($%d)", paramIndex)
		params = append(params, pq.Array(authors))
		paramIndex++
	}

	// Add ordering and pagination
	baseQuery += `
		ORDER BY viral_score DESC, created_at DESC
		LIMIT $` + fmt.Sprintf("%d", paramIndex) + ` OFFSET $` + fmt.Sprintf("%d", paramIndex+1)
	params = append(params, limit, offset)

	// Execute the query
	rows, err := s.db.QueryContext(context.Background(), baseQuery, params...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []ScrapedNote
	for rows.Next() {
		var note ScrapedNote
		err := rows.Scan(
			&note.ID, &note.AuthorID, &note.Kind, &note.Content, &note.RawJSON,
			&note.CreatedAt, &note.ScrapedAt, &note.InteractionScore,
			&note.ViralScore, &note.TrendingScore, &note.IsViral, &note.IsTrending,
		)
		if err != nil {
			return nil, err
		}
		notes = append(notes, note)
	}

	return notes, nil
}

// SearchScrapedNotes searches for scraped notes
func (s *NoteScraper) SearchScrapedNotes(searchQuery string, limit int, offset int, kinds []int, timeRange string, tags []string, authors []string) ([]ScrapedNote, error) {
	// Calculate the time cutoff based on timeRange
	var timeCutoff time.Time
	switch timeRange {
	case "1h":
		timeCutoff = time.Now().Add(-1 * time.Hour)
	case "6h":
		timeCutoff = time.Now().Add(-6 * time.Hour)
	case "24h", "1d":
		timeCutoff = time.Now().Add(-24 * time.Hour)
	case "7d":
		timeCutoff = time.Now().Add(-7 * 24 * time.Hour)
	case "30d":
		timeCutoff = time.Now().Add(-30 * 24 * time.Hour)
	default:
		timeCutoff = time.Now().Add(-30 * 24 * time.Hour) // Default to 30 days
	}

	// Build the base query
	baseQuery := `
		SELECT id, author_id, kind, content, raw_json, 
		       created_at, scraped_at, interaction_score, 
		       viral_score, trending_score, is_viral, is_trending
		FROM scraped_notes
		WHERE created_at >= $1
		AND (
			content ILIKE $2 
			OR author_id ILIKE $2
			OR raw_json::text ILIKE $2
		)
	`

	// Build parameters slice
	params := []interface{}{timeCutoff, "%" + searchQuery + "%"}
	paramIndex := 3

	// Add kinds filter if specified
	if len(kinds) > 0 {
		baseQuery += fmt.Sprintf(" AND kind = ANY($%d)", paramIndex)
		params = append(params, pq.Array(kinds))
		paramIndex++
	}

	// Add authors filter if specified
	if len(authors) > 0 {
		baseQuery += fmt.Sprintf(" AND author_id = ANY($%d)", paramIndex)
		params = append(params, pq.Array(authors))
		paramIndex++
	}

	// Add ordering and pagination
	baseQuery += `
		ORDER BY created_at DESC
		LIMIT $` + fmt.Sprintf("%d", paramIndex) + ` OFFSET $` + fmt.Sprintf("%d", paramIndex+1)
	params = append(params, limit, offset)

	// Execute the query
	rows, err := s.db.QueryContext(context.Background(), baseQuery, params...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []ScrapedNote
	for rows.Next() {
		var note ScrapedNote
		err := rows.Scan(
			&note.ID, &note.AuthorID, &note.Kind, &note.Content, &note.RawJSON,
			&note.CreatedAt, &note.ScrapedAt, &note.InteractionScore,
			&note.ViralScore, &note.TrendingScore, &note.IsViral, &note.IsTrending,
		)
		if err != nil {
			return nil, err
		}
		notes = append(notes, note)
	}

	return notes, nil
}

// SearchAllNotes searches across all note types
func (s *NoteScraper) SearchAllNotes(searchQuery string, limit int, offset int, kinds []int, timeRange string, tags []string, authors []string) (map[string]interface{}, error) {
	// Search in trending notes
	trendingNotes, err := s.SearchTrendingNotes(searchQuery, limit/3, 0, kinds, timeRange, tags, authors)
	if err != nil {
		return nil, err
	}

	// Search in viral notes
	viralNotes, err := s.SearchViralNotes(searchQuery, limit/3, 0, kinds, timeRange, tags, authors)
	if err != nil {
		return nil, err
	}

	// Search in scraped notes
	scrapedNotes, err := s.SearchScrapedNotes(searchQuery, limit/3, 0, kinds, timeRange, tags, authors)
	if err != nil {
		return nil, err
	}

	// Combine results
	result := map[string]interface{}{
		"trending": trendingNotes,
		"viral":    viralNotes,
		"scraped":  scrapedNotes,
		"total":    len(trendingNotes) + len(viralNotes) + len(scrapedNotes),
	}

	return result, nil
}

// StartDataSetupCron starts the cron job for comprehensive data setup and import
func (s *NoteScraper) StartDataSetupCron() {
	// Run data setup every 6 hours
	ticker := time.NewTicker(6 * time.Hour)
	defer ticker.Stop()

	log.Println("🚀 Starting comprehensive data setup cron job (every 6 hours)")

	// Run initial data setup
	s.RunDataSetup()

	for {
		select {
		case <-ticker.C:
			s.RunDataSetup()
		}
	}
}

// RunDataSetup performs comprehensive data collection and import
func (s *NoteScraper) RunDataSetup() {
	s.scrapingMutex.Lock()
	defer s.scrapingMutex.Unlock()

	log.Println("📊 Starting comprehensive data setup...")
	startTime := time.Now()

	// 1. Import notes from different kinds
	s.importNotesByKind(nostr.KindTextNote)
	s.importNotesByKind(nostr.KindArticle)
	s.importNotesByKind(20) // KindImage
	s.importNotesByKind(nostr.KindReaction)
	s.importNotesByKind(nostr.KindZap)

	// 2. Import follow lists to build user networks
	s.importFollowLists()

	// 3. Import reactions and zaps for interaction data
	s.importInteractions()

	// 4. Update viral and trending scores based on new data
	s.updateViralTrendingScores()

	// 5. Sync existing notes to scraped_notes table
	s.SyncExistingNotesToScraped()

	// 6. Clean up old data
	s.cleanupOldData()

	log.Printf("✅ Data setup completed in %v", time.Since(startTime))
}

// importNotesByKind imports notes of a specific kind from the last 24 hours
func (s *NoteScraper) importNotesByKind(kind int) {
	log.Printf("📝 Importing notes of kind %d...", kind)

	// Get notes from the last 24 hours
	since := time.Now().Add(-24 * time.Hour)
	sinceTimestamp := nostr.Timestamp(since.Unix())

	filters := nostr.Filters{{
		Kinds: []int{kind},
		Since: &sinceTimestamp,
	}}

	// Fetch events directly from all relays using QuerySync
	var eventList []*nostr.Event

	for _, relayURL := range s.relays {
		relay, err := s.pool.EnsureRelay(relayURL)
		if err != nil {
			log.Printf("❌ Error ensuring relay %s: %v", relayURL, err)
			continue
		}

		log.Printf("🔍 Querying relay %s for kind %d...", relayURL, kind)
		events, err := relay.QuerySync(context.Background(), filters[0])
		if err != nil {
			log.Printf("❌ Error querying relay %s: %v", relayURL, err)
			continue
		}

		log.Printf("📊 Found %d events of kind %d from relay %s", len(events), kind, relayURL)
		eventList = append(eventList, events...)
	}

	// Remove duplicates based on event ID
	uniqueEvents := make(map[string]*nostr.Event)
	for _, ev := range eventList {
		uniqueEvents[ev.ID] = ev
	}

	// Convert back to slice
	eventList = make([]*nostr.Event, 0, len(uniqueEvents))
	for _, ev := range uniqueEvents {
		eventList = append(eventList, ev)
	}

	log.Printf("📊 After deduplication: %d unique events of kind %d", len(eventList), kind)

	// Sort events to handle dependencies (parent notes before comments)
	eventList = s.sortEventsByDependencies(eventList)

	importedCount := 0
	for _, ev := range eventList {
		// Save to the main notes table first
		if err := repository.SaveNostrEvent(ev); err != nil {
			// Log error but continue processing other events
			log.Printf("Error saving note to main table %s: %v", ev.ID, err)
			continue
		}

		// Calculate scores for viral/trending detection
		interactionScore := s.calculateInteractionScore(ev)
		viralScore := s.calculateViralScore(ev, interactionScore)
		trendingScore := s.calculateTrendingScore(ev, interactionScore)

		isViral := viralScore >= viralThreshold
		isTrending := trendingScore >= 50.0

		// Save to scraped notes table with scores and metadata
		scrapedNote := &ScrapedNote{
			ID:               ev.ID,
			AuthorID:         ev.PubKey,
			Kind:             ev.Kind,
			Content:          ev.Content,
			RawJSON:          ev.String(),
			CreatedAt:        ev.CreatedAt.Time(),
			ScrapedAt:        time.Now(),
			InteractionScore: interactionScore,
			ViralScore:       viralScore,
			TrendingScore:    trendingScore,
			IsViral:          isViral,
			IsTrending:       isTrending,
		}

		if err := s.saveScrapedNote(scrapedNote); err != nil {
			log.Printf("Error saving scraped note %s: %v", ev.ID, err)
			continue
		}

		// Update viral/trending status if applicable
		if isViral {
			viralNote := &ViralNote{
				ID:         fmt.Sprintf("%s_viral", ev.ID),
				NoteID:     ev.ID,
				ViralScore: viralScore,
				DetectedAt: time.Now(),
				ExpiresAt:  time.Now().AddDate(0, 0, 7),
			}
			s.saveViralNote(viralNote)
		}

		if isTrending {
			trendingNote := &TrendingNote{
				ID:            fmt.Sprintf("%s_trending", ev.ID),
				NoteID:        ev.ID,
				TrendingScore: trendingScore,
				DetectedAt:    time.Now(),
				ExpiresAt:     time.Now().AddDate(0, 0, 3),
			}
			s.saveTrendingNote(trendingNote)
		}

		importedCount++
	}

	// Backup articles and videos to AFK relay if enabled
	if s.isBackupAfkRelay && (kind == nostr.KindArticle || kind == 20 || kind == 1063 || kind == 22 || kind == 31000 || kind == 31001 || kind == 34236 || kind == 34235) {
		log.Printf("🔄 Backing up imported notes of kind %d to AFK relay...", kind)
		backupCount := 0

		for _, ev := range eventList {
			// Publish the event to each AFK relay
			for _, relayURL := range afkRelays {
				relay, err := s.pool.EnsureRelay(relayURL)
				if err != nil {
					log.Printf("❌ Error ensuring relay %s: %v", relayURL, err)
					continue
				}

				err = relay.Publish(context.Background(), *ev)
				if err != nil {
					log.Printf("❌ Error backing up event %s to relay %s: %v", ev.ID, relayURL, err)
				} else {
					backupCount++
					log.Printf("✅ Backed up event %s (kind: %d) to relay %s", ev.ID, ev.Kind, relayURL)
				}
			}
		}

		log.Printf("🔄 Backup completed: %d notes of kind %d backed up to AFK relays", backupCount, kind)
	}

	log.Printf("✅ Imported %d notes of kind %d", importedCount, kind)
}

// importFollowLists imports follow lists to build user networks
func (s *NoteScraper) importFollowLists() {
	log.Println("👥 Importing follow lists...")

	// Get follow lists from the last 7 days
	since := time.Now().AddDate(0, 0, -7)
	sinceTimestamp := nostr.Timestamp(since.Unix())

	filters := nostr.Filters{{
		Kinds: []int{nostr.KindFollowList},
		Since: &sinceTimestamp,
	}}

	events := s.pool.SubMany(context.Background(), s.relays, filters)

	importedCount := 0
	for ev := range events {
		if ev.Event == nil {
			continue
		}

		if err := repository.SaveNostrEvent(ev.Event); err != nil {
			log.Printf("Error saving follow list %s: %v", ev.Event.ID, err)
			continue
		}

		importedCount++
	}

	log.Printf("✅ Imported %d follow lists", importedCount)
}

// importInteractions imports reactions and zaps for interaction data
func (s *NoteScraper) importInteractions() {
	log.Println("💬 Importing interactions (reactions and zaps)...")

	// Get interactions from the last 24 hours
	since := time.Now().Add(-24 * time.Hour)
	sinceTimestamp := nostr.Timestamp(since.Unix())

	filters := nostr.Filters{{
		Kinds: []int{nostr.KindReaction, nostr.KindZap},
		Since: &sinceTimestamp,
	}}

	events := s.pool.SubMany(context.Background(), s.relays, filters)

	reactionCount := 0
	zapCount := 0

	for ev := range events {
		if ev.Event == nil {
			continue
		}

		if err := repository.SaveNostrEvent(ev.Event); err != nil {
			log.Printf("Error saving interaction %s: %v", ev.Event.ID, err)
			continue
		}

		if ev.Event.Kind == nostr.KindReaction {
			reactionCount++
		} else if ev.Event.Kind == nostr.KindZap {
			zapCount++
		}
	}

	log.Printf("✅ Imported %d reactions and %d zaps", reactionCount, zapCount)
}

// updateViralTrendingScores updates viral and trending scores for existing notes
func (s *NoteScraper) updateViralTrendingScores() {
	log.Println("📈 Updating viral and trending scores...")

	// Get notes from the last 7 days that need score updates
	query := `
		SELECT id, author_id, kind, content, raw_json, created_at, scraped_at
		FROM scraped_notes
		WHERE scraped_at < NOW() - INTERVAL '1 hour'
		AND created_at >= NOW() - INTERVAL '7 days'
		ORDER BY created_at DESC
		LIMIT 1000
	`

	rows, err := s.db.QueryContext(context.Background(), query)
	if err != nil {
		log.Printf("Error querying notes for score update: %v", err)
		return
	}
	defer rows.Close()

	updatedCount := 0
	for rows.Next() {
		var note ScrapedNote
		err := rows.Scan(
			&note.ID, &note.AuthorID, &note.Kind, &note.Content, &note.RawJSON,
			&note.CreatedAt, &note.ScrapedAt,
		)
		if err != nil {
			continue
		}

		// Parse the raw JSON to get the event
		var event nostr.Event
		if err := json.Unmarshal([]byte(note.RawJSON), &event); err != nil {
			continue
		}

		// Recalculate scores
		interactionScore := s.calculateInteractionScore(&event)
		viralScore := s.calculateViralScore(&event, interactionScore)
		trendingScore := s.calculateTrendingScore(&event, interactionScore)

		isViral := viralScore >= viralThreshold
		isTrending := trendingScore >= 50.0

		// Update the scraped note
		updateQuery := `
			UPDATE scraped_notes 
			SET interaction_score = $1, viral_score = $2, trending_score = $3, 
				is_viral = $4, is_trending = $5, scraped_at = $6
			WHERE id = $7
		`

		_, err = s.db.ExecContext(context.Background(), updateQuery,
			interactionScore, viralScore, trendingScore, isViral, isTrending, time.Now(), note.ID)
		if err != nil {
			log.Printf("Error updating note %s: %v", note.ID, err)
			continue
		}

		// Update viral/trending status if changed
		if isViral {
			viralNote := &ViralNote{
				ID:         fmt.Sprintf("%s_viral", note.ID),
				NoteID:     note.ID,
				ViralScore: viralScore,
				DetectedAt: time.Now(),
				ExpiresAt:  time.Now().AddDate(0, 0, 7),
			}
			s.saveViralNote(viralNote)
		}

		if isTrending {
			trendingNote := &TrendingNote{
				ID:            fmt.Sprintf("%s_trending", note.ID),
				NoteID:        note.ID,
				TrendingScore: trendingScore,
				DetectedAt:    time.Now(),
				ExpiresAt:     time.Now().AddDate(0, 0, 3),
			}
			s.saveTrendingNote(trendingNote)
		}

		updatedCount++
	}

	log.Printf("✅ Updated scores for %d notes", updatedCount)
}

// SyncExistingNotesToScraped syncs existing notes from the main notes table to scraped_notes
func (s *NoteScraper) SyncExistingNotesToScraped() {
	log.Println("🔄 Syncing existing notes to scraped_notes table...")

	// Get notes from the main table that aren't in scraped_notes
	query := `
		SELECT n.id, n.author_id, n.kind, n.content, n.raw_json, n.created_at
		FROM notes n
		LEFT JOIN scraped_notes sn ON n.id = sn.id
		WHERE sn.id IS NULL
		AND n.created_at >= NOW() - INTERVAL '7 days'
		ORDER BY n.created_at DESC
		LIMIT 1000
	`

	rows, err := s.db.QueryContext(context.Background(), query)
	if err != nil {
		log.Printf("Error querying existing notes: %v", err)
		return
	}
	defer rows.Close()

	syncedCount := 0
	for rows.Next() {
		var noteID, authorID, content, rawJSON string
		var kind int
		var createdAt time.Time

		err := rows.Scan(&noteID, &authorID, &kind, &content, &rawJSON, &createdAt)
		if err != nil {
			continue
		}

		// Parse the raw JSON to get the event
		var event nostr.Event
		if err := json.Unmarshal([]byte(rawJSON), &event); err != nil {
			continue
		}

		// Calculate scores
		interactionScore := s.calculateInteractionScore(&event)
		viralScore := s.calculateViralScore(&event, interactionScore)
		trendingScore := s.calculateTrendingScore(&event, interactionScore)

		isViral := viralScore >= viralThreshold
		isTrending := trendingScore >= 50.0

		// Save to scraped notes table
		scrapedNote := &ScrapedNote{
			ID:               noteID,
			AuthorID:         authorID,
			Kind:             kind,
			Content:          content,
			RawJSON:          rawJSON,
			CreatedAt:        createdAt,
			ScrapedAt:        time.Now(),
			InteractionScore: interactionScore,
			ViralScore:       viralScore,
			TrendingScore:    trendingScore,
			IsViral:          isViral,
			IsTrending:       isTrending,
		}

		if err := s.saveScrapedNote(scrapedNote); err != nil {
			log.Printf("Error saving synced note %s: %v", noteID, err)
			continue
		}

		// Update viral/trending status if applicable
		if isViral {
			viralNote := &ViralNote{
				ID:         fmt.Sprintf("%s_viral", noteID),
				NoteID:     noteID,
				ViralScore: viralScore,
				DetectedAt: time.Now(),
				ExpiresAt:  time.Now().AddDate(0, 0, 7),
			}
			s.saveViralNote(viralNote)
		}

		if isTrending {
			trendingNote := &TrendingNote{
				ID:            fmt.Sprintf("%s_trending", noteID),
				NoteID:        noteID,
				TrendingScore: trendingScore,
				DetectedAt:    time.Now(),
				ExpiresAt:     time.Now().AddDate(0, 0, 3),
			}
			s.saveTrendingNote(trendingNote)
		}

		syncedCount++
	}

	log.Printf("✅ Synced %d existing notes to scraped_notes table", syncedCount)
}

// cleanupOldData removes old data to keep the database manageable
func (s *NoteScraper) cleanupOldData() {
	log.Println("🧹 Cleaning up old data...")

	// Clean up scraped notes older than 30 days
	cleanupQuery := `
		DELETE FROM scraped_notes 
		WHERE created_at < NOW() - INTERVAL '30 days'
	`

	result, err := s.db.ExecContext(context.Background(), cleanupQuery)
	if err != nil {
		log.Printf("Error cleaning up old scraped notes: %v", err)
	} else {
		rowsAffected, _ := result.RowsAffected()
		if rowsAffected > 0 {
			log.Printf("🧹 Cleaned up %d old scraped notes", rowsAffected)
		}
	}

	// Clean up expired viral and trending notes
	s.cleanupExpiredNotes()
}

// sortEventsByDependencies sorts events so that parent notes are saved before comments
func (s *NoteScraper) sortEventsByDependencies(events []*nostr.Event) []*nostr.Event {
	// Create a map to track which events are comments (replies)
	commentEvents := make(map[string]bool)
	parentNoteIDs := make(map[string]bool)

	// First pass: identify comments and their parent notes
	for _, event := range events {
		if event.Kind == nostr.KindTextNote {
			// Check if this is a comment (has "e" tag with root reference)
			for _, tag := range event.Tags {
				if len(tag) > 0 && tag[0] == "e" {
					if len(tag) >= 3 && (tag[2] == "root" || tag[2] == "") {
						commentEvents[event.ID] = true
						parentNoteIDs[tag[1]] = true
						break
					}
				}
			}
		}
	}

	// Separate parent notes and comments
	var parentNotes []*nostr.Event
	var comments []*nostr.Event
	var otherEvents []*nostr.Event

	for _, event := range events {
		if commentEvents[event.ID] {
			comments = append(comments, event)
		} else if parentNoteIDs[event.ID] || event.Kind == nostr.KindTextNote {
			parentNotes = append(parentNotes, event)
		} else {
			otherEvents = append(otherEvents, event)
		}
	}

	// Return in order: parent notes first, then comments, then other events
	var result []*nostr.Event
	result = append(result, parentNotes...)
	result = append(result, comments...)
	result = append(result, otherEvents...)

	log.Printf("📋 Sorted events: %d parent notes, %d comments, %d other events",
		len(parentNotes), len(comments), len(otherEvents))

	return result
}
