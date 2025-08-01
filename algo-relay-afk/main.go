package main

import (
	"context"
	"database/sql"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/fiatjaf/khatru"
	"github.com/fiatjaf/khatru/policies"
	"github.com/joho/godotenv"
	"github.com/nbd-wtf/go-nostr"
	"github.com/rs/cors"
)

var ctx = context.Background()
var pool = nostr.NewSimplePool(ctx)
var repository *NostrRepository
var scraper *NoteScraper
var wsManager *WebSocketManager
var relays = []string{
	"wss://relay.primal.net",
	"wss://nos.lol",
	"wss://nostr-relay-nestjs-production.up.railway.app",

	// "wss://relay.nostr.band",
	// "wss://relay.snort.social",

	// "wss://relay.damus.io",
	// "wss://news.utxo.one",
	// "wss://relay.lexingtonbitcoin.org",
	// "wss://nostr.600.wtf",
	// "wss://nostr.hexhex.online",
	// "wss://wot.utxo.one",
	// "wss://nostrelites.org",
	// "wss://wot.nostr.party",
	// "wss://wot.puhcho.me",
	// "wss://wot.girino.org",
	// "wss://relay.beeola.me",
	// "wss://zap.watch",
	// "wss://wot.yeghro.site",
	// "wss://wot.innovativecerebrum.ai",
	// "wss://wot.swarmstr.com",
	// "wss://wot.azzamo.net",
	// "wss://satsage.xyz",
	// "wss://wot.sandwich.farm",
	// "wss://wons.calva.dev",
	// "wss://wot.shaving.kiwi",
	// "wss://wot.tealeaf.dev",
	// "wss://wot.dtonon.com",
	// "wss://wot.relay.vanderwarker.family",
	// "wss://wot.zacoos.com",
	// "wss://nostr.mom",
	// "wss://purplepag.es",
	// "wss://purplerelay.com",

	// "wss://relayable.org",
	// "wss://relay.nostr.bg",
	// "wss://no.str.cr",
	// "wss://nostr21.com",
	// "wss://nostrue.com",
	// "wss://relay.siamstr.com",
}

var afkRelays = []string{
	// "wss://nostr-relay-nestjs-production.up.railway.app",
	"wss://nostr-relay-nestjs-staging.up.railway.app",
}

var allRelays = []string{
	"wss://relay.nostr.band",
	"wss://relay.snort.social",

	"wss://relay.damus.io",
	// "wss://news.utxo.one",
	// "wss://relay.lexingtonbitcoin.org",
	// "wss://nostr.600.wtf",
	// "wss://nostr.hexhex.online",
	// "wss://wot.utxo.one",
	// "wss://nostrelites.org",
	// "wss://wot.nostr.party",
	// "wss://wot.puhcho.me",
	// "wss://wot.girino.org",
	// "wss://relay.beeola.me",
	// "wss://zap.watch",
	// "wss://wot.yeghro.site",
	// "wss://wot.innovativecerebrum.ai",
	// "wss://wot.swarmstr.com",
	// "wss://wot.azzamo.net",
	// "wss://satsage.xyz",
	// "wss://wot.sandwich.farm",
	// "wss://wons.calva.dev",
	// "wss://wot.shaving.kiwi",
	// "wss://wot.tealeaf.dev",
	// "wss://wot.dtonon.com",
	// "wss://wot.relay.vanderwarker.family",
	// "wss://wot.zacoos.com",
	// "wss://nostr.mom",
	// "wss://purplepag.es",
	// "wss://purplerelay.com",

	// "wss://relayable.org",
	// "wss://relay.nostr.bg",
	// "wss://no.str.cr",
	// "wss://nostr21.com",
	// "wss://nostrue.com",
	// "wss://relay.siamstr.com",
}

var db *sql.DB
var art = `
 █████╗ ██╗      ██████╗  ██████╗     ██████╗ ███████╗██╗      █████╗ ██╗   ██╗
██╔══██╗██║     ██╔════╝ ██╔═══██╗    ██╔══██╗██╔════╝██║     ██╔══██╗╚██╗ ██╔╝
███████║██║     ██║  ███╗██║   ██║    ██████╔╝█████╗  ██║     ███████║ ╚████╔╝ 
██╔══██║██║     ██║   ██║██║   ██║    ██╔══██╗██╔══╝  ██║     ██╔══██║  ╚██╔╝  
██║  ██║███████╗╚██████╔╝╚██████╔╝    ██║  ██║███████╗███████╗██║  ██║   ██║   
╚═╝  ╚═╝╚══════╝ ╚═════╝  ╚═════╝     ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝   ╚═╝   
	`

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found (this is normal in production)")
	}
	nostr.InfoLogger = log.New(io.Discard, "", 0)
	green := "\033[32m"
	reset := "\033[0m"
	fmt.Println(green + art + reset)

	importFlag := flag.Bool("import", false, "Run the importNotes function after initializing relays")
	flag.Parse()
	conn, err := getDBConnection()

	if err != nil {
		log.Fatalf("Error getting db connection: %v", err)
	}
	defer conn.Close()
	db = conn
	repository = NewNostrRepository(db)

	backupAfkRelay := os.Getenv("BACKUP_AFK_RELAY")
	fmt.Println("backupAfkRelay", backupAfkRelay)
	scraper = NewNoteScraper(db, backupAfkRelay == "true")
	wsManager = NewWebSocketManager()
	InitWeights() // <-- call this after setting up the environment

	purgeMonthsStr := os.Getenv("PURGE_MONTHS")
	if purgeMonthsStr == "" {
		log.Fatal("PURGE_MONTHS environment variable is not set")
	}

	purgeMonths, err := strconv.Atoi(purgeMonthsStr)
	if err != nil {
		log.Fatalf("Invalid PURGE_MONTHS value: %v\n", err)
	}

	if *importFlag {
		log.Println("📦 importing notes")
		importNotes(nostr.KindArticle)
		importNotes(20) // KindImage
		importNotes(nostr.KindTextNote)
		importNotes(nostr.KindReaction)
		importNotes(nostr.KindZap)

		log.Println("📦 done importing notes. Please restart relay")
		return
	}

	go subscribeAll()
	go purgeData(purgeMonths)

	go func() {
		refreshViralNotes(ctx)                // Immediate refresh when the application starts
		go refreshViralNotesPeriodically(ctx) // Start the periodic refresh
	}()

	// Start the note scraping cron job
	go scraper.StartScrapingCron()

	// Start the ArticleKind and Video scraping cron job
	go scraper.StartArticleVideoScrapingCron()

	// Start the comprehensive data setup cron job
	go scraper.StartDataSetupCron()

	// Start the WebSocket manager
	go wsManager.Start()

	relay := khatru.NewRelay()
	relay.Info.Description = os.Getenv("RELAY_DESCRIPTION")
	relay.Info.Name = os.Getenv("RELAY_NAME")
	relay.Info.PubKey = os.Getenv("RELAY_PUBKEY")
	relay.Info.Software = "https://github.com/bitvora/algo-relay"
	relay.Info.Version = "0.1.1"
	relay.Info.Icon = os.Getenv("RELAY_ICON")

	relay.RejectConnection = append(relay.RejectConnection,
		policies.ConnectionRateLimiter(
			10,
			time.Minute*1,
			10,
		),
	)

	relay.RejectFilter = append(relay.RejectFilter,
		policies.FilterIPRateLimiter(
			10,
			time.Second*10,
			10,
		),
	)

	relay.OnConnect = append(relay.OnConnect, func(ctx context.Context) {
		khatru.RequestAuth(ctx)
	})
	relay.RejectFilter = append(relay.RejectFilter, func(ctx context.Context, filter nostr.Filter) (bool, string) {
		authenticatedUser := khatru.GetAuthed(ctx)
		if authenticatedUser == "" {
			return true, "auth-required: this query requires you to be authenticated"
		}

		if len(filter.Authors) > 0 {
			return true, "this relay is only for algorithmic feeds"
		}

		return false, ""
	})
	relay.RejectEvent = append(relay.RejectEvent, func(ctx context.Context, event *nostr.Event) (bool, string) {
		return true, "you cannot publish to this relay"
	})

	relay.QueryEvents = append(relay.QueryEvents, func(ctx context.Context, filter nostr.Filter) (chan *nostr.Event, error) {
		ch := make(chan *nostr.Event)
		copyFilter := filter
		authenticatedUser := khatru.GetAuthed(ctx)

		go func() {
			defer close(ch)

			limit := copyFilter.Limit
			if limit == 0 {
				limit = 50
			}

			kinds := copyFilter.Kinds
			var kind int
			if len(kinds) == 0 {
				kind = nostr.KindTextNote
			} else {
				kind = kinds[0]
			}

			events, err := GetUserFeed(ctx, authenticatedUser, limit, kind)
			fmt.Println("getting events of kind:", kind)
			if err != nil {
				log.Println("Error fetching most reacted posts:", err)
				return
			}

			for _, event := range events {
				ch <- &event
			}
		}()

		return ch, nil
	})

	log.Println("🚀 Relay started on port 3334")
	mux := relay.Router()

	mux.HandleFunc("/", handleHomePage)
	mux.HandleFunc("/dashboard.html", handleDashboardPage)
	mux.HandleFunc("/scraper-dashboard.html", handleScraperDashboardPage)
	mux.HandleFunc("/api/top-authors", handleTopAuthorsAPI)
	mux.HandleFunc("/auth", handleAuth)
	mux.HandleFunc("/api/settings", handleUserSettings)
	mux.HandleFunc("/api/user-metrics", handleUserMetricsAPI)
	mux.HandleFunc("/api/viral-notes", handleViralNotesAPI)
	mux.HandleFunc("/api/viral-notes-scraper", handleViralNotesScraperAPI)
	mux.HandleFunc("/api/get-notes", handleGetNotesAPI)
	mux.HandleFunc("/api/main-notes", handleMainNotesAPI)
	mux.HandleFunc("/api/trending-notes", handleTrendingNotesAPI)
	mux.HandleFunc("/api/trending-top-authors", handleTrendingTopAuthorsAPI)
	mux.HandleFunc("/api/scraped-notes", handleScrapedNotesAPI)
	mux.HandleFunc("/api/trigger-data-setup", handleTriggerDataSetupAPI)
	mux.HandleFunc("/api/sync-notes", handleSyncNotesAPI)
	mux.HandleFunc("/api/trigger-article-video-scraping", handleTriggerArticleVideoScrapingAPI)
	mux.HandleFunc("/api/trigger-note-scraping", handleTriggerNoteScrapingAPI)
	mux.HandleFunc("/api/test-backup", handleTestBackupAPI)
	mux.HandleFunc("/ws", handleWebSocket)

	// New search endpoints
	mux.HandleFunc("/api/search", handleSearchAPI)
	mux.HandleFunc("/api/search/authors", handleSearchAuthorsAPI)
	mux.HandleFunc("/api/search/tags", handleSearchTagsAPI)
	mux.HandleFunc("/api/search/topics", handleSearchTopicsAPI)
	mux.HandleFunc("/api/diagnostic", handleDiagnosticAPI)

	// Configure CORS
	corsHandler := configureCORS(mux)

	log.Printf("listening at http://0.0.0.0:3334")
	err = http.ListenAndServe("0.0.0.0:3334", corsHandler)
	if err != nil {
		log.Fatal(err)
	}

	// Auto-trigger data setup on startup if database is empty
	go func() {
		// Check if auto data setup is enabled (default: true)
		autoDataSetup := os.Getenv("AUTO_DATA_SETUP")

		if autoDataSetup == "false" {
			log.Println("⚠️  Auto data setup disabled by AUTO_DATA_SETUP=false")
			return
		}

		// Always run initial article and video scraping on startup
		log.Println("📰🎥 Running initial article and video scraping...")
		go func() {
			scraper.ScrapeArticleVideoNotes()
			log.Println("✅ Initial article and video scraping completed")
		}()

		// Wait a bit for other services to initialize
		time.Sleep(5 * time.Second)

		log.Println("🔍 Checking if database needs initial data setup...")

		// Check if scraped_notes table is empty
		var count int
		err := scraper.db.QueryRow("SELECT COUNT(*) FROM scraped_notes").Scan(&count)
		if err != nil {
			log.Printf("❌ Error checking scraped_notes count: %v", err)
			return
		}

		if count == 0 {
			log.Println("📊 Database is empty - triggering initial data setup...")
			scraper.RunDataSetup()
			log.Println("✅ Initial data setup completed")
		} else {
			log.Printf("✅ Database already has %d scraped notes - skipping initial setup", count)
		}

	}()

	// scraper.ScrapeArticleVideoNotes()

}

// configureCORS sets up CORS middleware with environment-based configuration
func configureCORS(handler http.Handler) http.Handler {
	// Get allowed origins from environment variable
	allowedOriginsStr := os.Getenv("ALLOWED_ORIGINS")
	var allowedOrigins []string

	if allowedOriginsStr == "" {
		// Default origins for development
		allowedOrigins = []string{
			"http://localhost:3000",
			"http://localhost:3001",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:3001",
			"https://localhost:3000",
			"https://localhost:3001",
		}
		log.Println("⚠️  No ALLOWED_ORIGINS set, using default development origins")
	} else {
		// Parse comma-separated origins
		allowedOrigins = strings.Split(allowedOriginsStr, ",")
		for i, origin := range allowedOrigins {
			allowedOrigins[i] = strings.TrimSpace(origin)
		}
		log.Printf("✅ CORS allowed origins: %v", allowedOrigins)
	}

	// Configure CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
		Debug:            os.Getenv("CORS_DEBUG") == "true",
	})

	return c.Handler(handler)
}

func subscribeAll() {
	now := nostr.Now()
	filters := nostr.Filters{{
		Kinds: []int{
			nostr.KindTextNote,
			nostr.KindReaction,
			nostr.KindZap,
			nostr.KindFollowList,
			nostr.KindArticle,
			nostr.KindReply,
			20,   // KindImage
			1063, // KindVideo
			nostr.KindGenericRepost,
			22,    // Short video
			31000, // VerticalVideo
			31001, // HorizontalVideo
			34236, // VerticalVideo
			34235, // HorizontalVideo
		},
		Since: &now,
	}}

	for ev := range pool.SubMany(ctx, relays, filters) {
		err := repository.SaveNostrEvent(ev.Event)
		if err != nil {
			continue
		}
	}
}

func loadEnv() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}
}

func purgeData(months int) {
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			repository := NewNostrRepository(db)

			log.Println("Starting data purge...")

			if err := repository.PurgeCommentsOlderThan(months); err != nil {
				log.Printf("Error purging comments: %v\n", err)
			}
			if err := repository.PurgeNotesOlderThan(months); err != nil {
				log.Printf("Error purging posts: %v\n", err)
			}
			if err := repository.PurgeReactionsOlderThan(months); err != nil {
				log.Printf("Error purging reactions: %v\n", err)
			}
			if err := repository.PurgeZapsOlderThan(months); err != nil {
				log.Printf("Error purging zaps: %v\n", err)
			}

			log.Println("Data purge completed.")
		}
	}
}
