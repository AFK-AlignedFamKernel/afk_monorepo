package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/lib/pq"
	"github.com/nbd-wtf/go-nostr"
)

type NostrRepository struct {
	db *sql.DB
}

type FeedNote struct {
	Event nostr.Event
	Score float64
}

type EventWithMeta struct {
	Event                nostr.Event
	GlobalCommentsCount  int
	GlobalReactionsCount int
	GlobalZapsCount      int
	InteractionCount     int
	CreatedAt            time.Time
}

type AuthorInteraction struct {
	AuthorID         string
	InteractionCount int
}

type TopAuthor struct {
	Pubkey           string `json:"pubkey"`
	Name             string `json:"name,omitempty"`
	Picture          string `json:"picture,omitempty"`
	InteractionCount int    `json:"interaction_count"`
	LastInteraction  int64  `json:"last_interaction"`
}

type TrendingTopAuthor struct {
	Pubkey            string  `json:"pubkey"`
	Name              string  `json:"name,omitempty"`
	Picture           string  `json:"picture,omitempty"`
	TotalInteractions int     `json:"total_interactions"`
	ReactionsReceived int     `json:"reactions_received"`
	ZapsReceived      int     `json:"zaps_received"`
	RepliesReceived   int     `json:"replies_received"`
	NotesCount        int     `json:"notes_count"`
	EngagementScore   float64 `json:"engagement_score"`
	LastActivity      int64   `json:"last_activity"`
}

var viralNoteCache struct {
	notes     []FeedNote
	Timestamp time.Time
}
var viralNoteCacheMutex sync.Mutex

const PubkeyLength = 64

// UserSettings represents the algorithm settings for a specific user
type UserSettings struct {
	PubKey             string  `json:"pubkey"`
	AuthorInteractions float64 `json:"authorInteractions"`
	GlobalComments     float64 `json:"globalComments"`
	GlobalReactions    float64 `json:"globalReactions"`
	GlobalZaps         float64 `json:"globalZaps"`
	Recency            float64 `json:"recency"`
	DecayRate          float64 `json:"decayRate"`
	ViralThreshold     float64 `json:"viralThreshold"`
	ViralDampening     float64 `json:"viralDampening"`
}

// UserMetrics represents the user's activity metrics on Nostr
type UserMetrics struct {
	NetworkSize   int `json:"networkSize"`   // Number of unique authors interacted with
	Reactions     int `json:"reactions"`     // Number of reactions given
	Conversations int `json:"conversations"` // Number of comments/replies made
	Zaps          int `json:"zaps"`          // Number of zaps sent
}

func NewNostrRepository(db *sql.DB) *NostrRepository {
	return &NostrRepository{db: db}
}

func (r *NostrRepository) SaveNostrEvent(event *nostr.Event) error {
	switch event.Kind {
	case 1: // note
		return r.saveNoteOrComment(event)
	case 7: // Reaction
		return r.saveReaction(event)
	case 9735: // Zap
		return r.saveZap(event)
	case 3: // Follow
		return r.upsertFollowList(event)
	case 2: // Comment
		return r.saveNoteOrComment(event)
	default:
		return r.saveNoteWithKind(event)
	}
}

func (r *NostrRepository) saveNoteWithKind(event *nostr.Event) error {
	query := `
        INSERT INTO notes (id, author_id, kind, content, raw_json, created_at)
        VALUES ($1, $2, $3, $4, $5, to_timestamp($6))
        ON CONFLICT (id) DO NOTHING;
    `
	_, err := r.db.ExecContext(context.Background(), query,
		event.ID, event.PubKey, event.Kind, event.Content, event.String(), event.CreatedAt)
	return err
}

func (r *NostrRepository) saveNoteOrComment(event *nostr.Event) error {
	rootID := getRootNoteID(event)
	if rootID == "" {
		return r.saveNoteWithKind(event)
	}
	return r.saveComment(event, rootID)
}

func (r *NostrRepository) saveComment(event *nostr.Event, rootID string) error {
	query := `
        INSERT INTO comments (id, note_id, commenter_id, created_at)
        VALUES ($1, $2, $3, to_timestamp($4))
        ON CONFLICT (id) DO NOTHING;
    `
	_, err := r.db.ExecContext(context.Background(), query,
		event.ID, rootID, event.PubKey, event.CreatedAt)
	return err
}

func getRootNoteID(event *nostr.Event) string {
	var rootID string
	for _, tag := range event.Tags {
		if len(tag) > 0 && tag[0] == "e" {
			if len(tag) >= 3 && (tag[2] == "root" || tag[2] == "") {
				rootID = tag[1]
				break
			}
		}
	}
	return rootID
}

func (r *NostrRepository) saveReaction(event *nostr.Event) error {
	noteID, err := getTaggedNoteID(event)
	if err != nil {
		return err
	}
	query := `
        INSERT INTO reactions (id, note_id, reactor_id, created_at)
        VALUES ($1, $2, $3, to_timestamp($4))
        ON CONFLICT (id) DO NOTHING;
    `
	_, err = r.db.ExecContext(context.Background(), query,
		event.ID, noteID, event.PubKey, event.CreatedAt)
	return err
}

func (r *NostrRepository) saveZap(event *nostr.Event) error {
	noteID, err := getTaggedNoteID(event)
	if err != nil {
		return err
	}
	amount, err := getZapAmount(event)
	if err != nil {
		return err
	}
	zapperID, err := getZapperID(event)
	if err != nil {
		return err
	}
	query := `
        INSERT INTO zaps (id, note_id, zapper_id, amount, created_at)
        VALUES ($1, $2, $3, $4, to_timestamp($5))
        ON CONFLICT (id) DO NOTHING;
    `
	_, err = r.db.ExecContext(context.Background(), query,
		event.ID, noteID, zapperID, amount, event.CreatedAt)
	return err
}

func getZapperID(event *nostr.Event) (string, error) {
	for _, tag := range event.Tags {
		if len(tag) > 0 && tag[0] == "description" {
			// Parse the description JSON
			var descriptionData struct {
				PubKey string `json:"pubkey"`
			}
			err := json.Unmarshal([]byte(tag[1]), &descriptionData)
			if err != nil {
				return "", fmt.Errorf("error parsing description tag: %v", err)
			}
			return descriptionData.PubKey, nil
		}
	}
	return "", fmt.Errorf("no zapper pubkey found in description tag")
}

func getTaggedNoteID(event *nostr.Event) (string, error) {
	for _, tag := range event.Tags {
		if len(tag) > 0 && tag[0] == "e" {
			return tag[1], nil
		}
	}
	return "", fmt.Errorf("no note ID found in event tags")
}

func getZapAmount(event *nostr.Event) (int64, error) {
	for _, tag := range event.Tags {
		if len(tag) > 0 && tag[0] == "bolt11" {
			return decodeBolt11Invoice(tag[1])
		}
	}
	return 0, fmt.Errorf("no zap amount found in event tags")
}

func decodeBolt11Invoice(bolt11 string) (int64, error) {
	millisat, err := hrpToMillisat(bolt11)
	if err != nil {
		return 0, err
	}
	satsInt64 := millisat.Int64() / 1000
	return satsInt64, nil
}

func (r *NostrRepository) fetchTopInteractedAuthors(userID string) ([]TopAuthor, error) {
	start := time.Now()
	query := `
		WITH zap_counts AS (
			SELECT p.author_id, COUNT(z.id) AS interaction_count, MAX(z.created_at) AS last_interaction
			FROM notes p
			JOIN zaps z ON p.id = z.note_id
			WHERE z.zapper_id = $1
			GROUP BY p.author_id
		),
		reaction_counts AS (
			SELECT p.author_id, COUNT(r.id) AS interaction_count, MAX(r.created_at) AS last_interaction
			FROM notes p
			JOIN reactions r ON p.id = r.note_id
			WHERE r.reactor_id = $1
			GROUP BY p.author_id
		),
		comment_counts AS (
			SELECT p.author_id, COUNT(c.id) AS interaction_count, MAX(c.created_at) AS last_interaction
			FROM notes p
			JOIN comments c ON p.id = c.note_id
			WHERE c.commenter_id = $1
			GROUP BY p.author_id
		),
		combined_interactions AS (
			SELECT author_id, SUM(interaction_count) AS total_interactions, MAX(last_interaction) AS last_interaction
			FROM (
				SELECT author_id, interaction_count, last_interaction FROM zap_counts
				UNION ALL
				SELECT author_id, interaction_count, last_interaction FROM reaction_counts
				UNION ALL
				SELECT author_id, interaction_count, last_interaction FROM comment_counts
			) AS interactions
			GROUP BY author_id
		)
		SELECT ci.author_id, ci.total_interactions, ci.last_interaction,
		       COALESCE(p.settings->>'name', '') as name,
		       COALESCE(p.settings->>'picture', '') as picture
		FROM combined_interactions ci
		LEFT JOIN pubkey_settings p ON ci.author_id = p.pubkey
		ORDER BY ci.total_interactions DESC, ci.last_interaction DESC;
	`
	rows, err := r.db.QueryContext(context.Background(), query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	authors := make([]TopAuthor, 0, 128)
	for rows.Next() {
		var authorID, name, picture string
		var interactionCount int
		var lastInteraction sql.NullTime
		if err := rows.Scan(&authorID, &interactionCount, &lastInteraction, &name, &picture); err != nil {
			return nil, err
		}

		lastInteractionTime := int64(0)
		if lastInteraction.Valid {
			lastInteractionTime = lastInteraction.Time.Unix()
		}

		authors = append(authors, TopAuthor{
			Pubkey:           authorID,
			Name:             name,
			Picture:          picture,
			InteractionCount: interactionCount,
			LastInteraction:  lastInteractionTime,
		})
	}
	log.Printf("Fetched top interacted authors in %v", time.Since(start))
	return authors, nil
}

func (r *NostrRepository) GetViralnotes(ctx context.Context, limit int) ([]FeedNote, error) {
	// Calculate the date 3 days ago
	threeDaysAgo := time.Now().AddDate(0, 0, -3)

	query := `
    SELECT p.raw_json, COUNT(c.id) AS comment_count, COUNT(r.id) AS reaction_count, COUNT(z.id) AS zap_count
    FROM notes p
    LEFT JOIN comments c ON p.id = c.note_id
    LEFT JOIN reactions r ON p.id = r.note_id
    LEFT JOIN zaps z ON p.id = z.note_id
    WHERE p.created_at >= $3  -- Filter to only include notes from the last 3 days
    GROUP BY p.id
    HAVING COUNT(c.id) + COUNT(r.id) + COUNT(z.id) >= $1
    ORDER BY COUNT(c.id) + COUNT(r.id) + COUNT(z.id) DESC
    LIMIT $2;
`

	rows, err := r.db.QueryContext(context.Background(), query, viralThreshold, limit, threeDaysAgo)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	viralnotes := make([]FeedNote, 0, limit)
	for rows.Next() {
		var rawJSON string
		var commentCount, reactionCount, zapCount int

		if err := rows.Scan(&rawJSON, &commentCount, &reactionCount, &zapCount); err != nil {
			return nil, err
		}

		var event nostr.Event
		if err := json.Unmarshal([]byte(rawJSON), &event); err != nil {
			log.Printf("Failed to unmarshal raw JSON: %v", err)
			continue
		}

		recencyFactor := calculateRecencyFactorWithDecay(event.CreatedAt.Time(), decayRate)
		score := (float64(commentCount)*weightCommentsGlobal +
			float64(reactionCount)*weightReactionsGlobal +
			float64(zapCount)*weightZapsGlobal +
			recencyFactor*weightRecency) * viralNoteDampening

		fmt.Println("score", score)
		viralnotes = append(viralnotes, FeedNote{
			Event: event,
			Score: score,
		})
	}

	fmt.Println("viralnotes", viralnotes)

	return viralnotes, nil
}

func (r *NostrRepository) GetNotes(ctx context.Context, limit int) ([]FeedNote, error) {
	// Calculate the date 3 days ago
	threeDaysAgo := time.Now().AddDate(0, 0, -3)

	query := `
    SELECT 
        p.raw_json,
        COALESCE(comment_counts.comment_count, 0) AS comment_count,
        COALESCE(reaction_counts.reaction_count, 0) AS reaction_count,
        COALESCE(zap_counts.zap_count, 0) AS zap_count
    FROM notes p
    LEFT JOIN (
        SELECT note_id, COUNT(*) AS comment_count
        FROM comments
        WHERE created_at >= $2
        GROUP BY note_id
    ) comment_counts ON p.id = comment_counts.note_id
    LEFT JOIN (
        SELECT note_id, COUNT(*) AS reaction_count
        FROM reactions
        WHERE created_at >= $2
        GROUP BY note_id
    ) reaction_counts ON p.id = reaction_counts.note_id
    LEFT JOIN (
        SELECT note_id, COUNT(*) AS zap_count
        FROM zaps
        WHERE created_at >= $2
        GROUP BY note_id
    ) zap_counts ON p.id = zap_counts.note_id
    WHERE p.created_at >= $2  -- Filter to only include notes from the last 3 days
    ORDER BY p.created_at DESC
    LIMIT $1;
`

	rows, err := r.db.QueryContext(context.Background(), query, limit, threeDaysAgo)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	viralnotes := make([]FeedNote, 0, limit)
	for rows.Next() {
		var rawJSON string
		var commentCount, reactionCount, zapCount int

		if err := rows.Scan(&rawJSON, &commentCount, &reactionCount, &zapCount); err != nil {
			return nil, err
		}

		var event nostr.Event
		if err := json.Unmarshal([]byte(rawJSON), &event); err != nil {
			log.Printf("Failed to unmarshal raw JSON: %v", err)
			continue
		}

		recencyFactor := calculateRecencyFactorWithDecay(event.CreatedAt.Time(), decayRate)
		score := (float64(commentCount)*weightCommentsGlobal +
			float64(reactionCount)*weightReactionsGlobal +
			float64(zapCount)*weightZapsGlobal +
			recencyFactor*weightRecency) * viralNoteDampening

		fmt.Println("score", score)
		viralnotes = append(viralnotes, FeedNote{
			Event: event,
			Score: score,
		})
	}

	fmt.Println("viralnotes", viralnotes)

	return viralnotes, nil
}

func (r *NostrRepository) fetchNotesFromAuthors(authorInteractions []TopAuthor, kind int) ([]EventWithMeta, error) {
	// Extract author IDs and interaction counts
	start := time.Now()
	authorIDs := make([]string, 0, len(authorInteractions))
	interactionCounts := make([]int, 0, len(authorInteractions))

	for _, authorInteraction := range authorInteractions {
		// Only include authors with an interaction count >= 5
		if authorInteraction.InteractionCount >= 5 {
			authorIDs = append(authorIDs, authorInteraction.Pubkey)
			interactionCounts = append(interactionCounts, authorInteraction.InteractionCount)
		}
	}

	// If no authors meet the interaction count threshold, return early
	if len(authorIDs) == 0 {
		return nil, nil
	}

	// Get the cutoff date for notes older than 1 week
	oneWeekAgo := time.Now().AddDate(0, 0, -30)

	query := `
		WITH author_interactions AS (
			SELECT unnest($2::text[]) AS author_id, unnest($3::int[]) AS interaction_count
		)
		SELECT p.raw_json,
			COALESCE(comment_counts.comment_count, 0) AS comment_count,
			COALESCE(reaction_counts.reaction_count, 0) AS reaction_count,
			COALESCE(zap_counts.zap_count, 0) AS zap_count,
			ai.interaction_count
		FROM notes p
		JOIN author_interactions ai ON p.author_id = ai.author_id
		LEFT JOIN (
			SELECT note_id, COUNT(*) AS comment_count
			FROM comments
			WHERE created_at >= $4
			GROUP BY note_id
		) comment_counts ON p.id = comment_counts.note_id
		LEFT JOIN (
			SELECT note_id, COUNT(*) AS reaction_count
			FROM reactions
			WHERE created_at >= $4
			GROUP BY note_id
		) reaction_counts ON p.id = reaction_counts.note_id
		LEFT JOIN (
			SELECT note_id, COUNT(*) AS zap_count
			FROM zaps
			WHERE created_at >= $4
			GROUP BY note_id
		) zap_counts ON p.id = zap_counts.note_id
		WHERE p.author_id = ANY($1)
		AND ai.interaction_count >= 5  -- Filter by interaction count
		AND p.created_at >= $4         -- Filter notes created within the last week
		AND p.kind = $5                -- Filter by kind
		ORDER BY p.created_at DESC;
	`

	rows, err := r.db.QueryContext(context.Background(), query, pq.Array(authorIDs), pq.Array(authorIDs), pq.Array(interactionCounts), oneWeekAgo, kind)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	notes := make([]EventWithMeta, 0, len(interactionCounts))
	for rows.Next() {
		var rawJSON string
		var commentCount, reactionCount, zapCount, interactionCount int

		if err := rows.Scan(&rawJSON, &commentCount, &reactionCount, &zapCount, &interactionCount); err != nil {
			return nil, err
		}

		var event nostr.Event
		if err := json.Unmarshal([]byte(rawJSON), &event); err != nil {
			log.Printf("Failed to unmarshal raw JSON: %v", err)
			continue
		}

		notes = append(notes, EventWithMeta{
			Event:                event,
			GlobalCommentsCount:  commentCount,
			GlobalReactionsCount: reactionCount,
			GlobalZapsCount:      zapCount,
			InteractionCount:     interactionCount,
			CreatedAt:            event.CreatedAt.Time(),
		})
	}

	fmt.Printf("Fetched this many notes in this many seconds: %d, %v\n", len(notes), time.Since(start))
	return notes, nil
}

func refreshViralNotesPeriodically(ctx context.Context) {
	ticker := time.NewTicker(time.Hour) // Refresh every hour
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			refreshViralNotes(ctx)
		case <-ctx.Done():
			log.Println("Stopping viral note refresh")
			return
		}
	}
}

func refreshViralNotes(ctx context.Context) {
	// Fetch new viral notes
	viralnotes, err := repository.GetViralnotes(ctx, 100) // Set a reasonable limit for viral notes
	if err != nil {
		log.Printf("Failed to refresh viral notes: %v", err)
		return
	}

	// Cache the viral notes
	viralNoteCacheMutex.Lock()
	viralNoteCache.notes = viralnotes
	viralNoteCache.Timestamp = time.Now()
	viralNoteCacheMutex.Unlock()

	log.Println("Viral notes refreshed")
}

func (r *NostrRepository) upsertFollowList(event *nostr.Event) error {
	// Validate the pubkey
	if len(event.PubKey) != PubkeyLength {
		return fmt.Errorf("invalid pubkey length")
	}

	// Extract "p" tags
	var followPubkeys []string
	for _, tag := range event.Tags {
		if len(tag) < 2 || tag[0] != "p" {
			continue
		}
		followPubkey := tag[1]
		if len(followPubkey) == PubkeyLength {
			followPubkeys = append(followPubkeys, followPubkey)
		}
	}

	if len(followPubkeys) == 0 {
		return fmt.Errorf("no valid follow pubkeys found in event tags")
	}

	// Begin a transaction
	ctx := context.Background()
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %v", err)
	}
	defer tx.Rollback()

	deleteQuery := `DELETE FROM follows WHERE pubkey = $1`
	_, err = tx.ExecContext(ctx, deleteQuery, event.PubKey)
	if err != nil {
		return fmt.Errorf("failed to delete existing follows: %v", err)
	}

	insertQuery := `INSERT INTO follows (pubkey, follow_id) VALUES `
	valueStrings := []string{}
	values := []interface{}{event.PubKey}

	for i, followPubkey := range followPubkeys {
		valueStrings = append(valueStrings, fmt.Sprintf("($1, $%d)", i+2))
		values = append(values, followPubkey)
	}
	insertQuery += strings.Join(valueStrings, ",")
	_, err = tx.ExecContext(ctx, insertQuery, values...)
	if err != nil {
		return fmt.Errorf("failed to insert new follows: %v", err)
	}

	err = tx.Commit()
	if err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
}

func (r *NostrRepository) PurgeCommentsOlderThan(months int) error {
	cutoffDate := time.Now().AddDate(0, -months, 0)
	query := `
        DELETE FROM comments
        WHERE created_at < $1;
    `
	result, err := r.db.ExecContext(context.Background(), query, cutoffDate)
	if err != nil {
		return fmt.Errorf("failed to purge comments: %v", err)
	}
	rowsAffected, _ := result.RowsAffected()
	fmt.Printf("Purged %d comments older than %d months\n", rowsAffected, months)
	return nil
}

func (r *NostrRepository) PurgeNotesOlderThan(months int) error {
	cutoffDate := time.Now().AddDate(0, -months, 0)

	// Delete reactions associated with old notes
	reactionsQuery := `
        DELETE FROM reactions
        WHERE note_id IN (
            SELECT id FROM notes WHERE created_at < $1
        );
    `
	if _, err := r.db.ExecContext(context.Background(), reactionsQuery, cutoffDate); err != nil {
		return fmt.Errorf("failed to purge reactions for old notes: %v", err)
	}

	// Delete comments associated with old notes
	commentsQuery := `
        DELETE FROM comments
        WHERE note_id IN (
            SELECT id FROM notes WHERE created_at < $1
        );
    `
	if _, err := r.db.ExecContext(context.Background(), commentsQuery, cutoffDate); err != nil {
		return fmt.Errorf("failed to purge comments for old notes: %v", err)
	}

	// Delete zaps associated with old notes
	zapsQuery := `
        DELETE FROM zaps
        WHERE note_id IN (
            SELECT id FROM notes WHERE created_at < $1
        );
    `
	if _, err := r.db.ExecContext(context.Background(), zapsQuery, cutoffDate); err != nil {
		return fmt.Errorf("failed to purge zaps for old notes: %v", err)
	}

	// Delete the old notes
	notesQuery := `
        DELETE FROM notes
        WHERE created_at < $1;
    `
	result, err := r.db.ExecContext(context.Background(), notesQuery, cutoffDate)
	if err != nil {
		return fmt.Errorf("failed to purge notes: %v", err)
	}
	rowsAffected, _ := result.RowsAffected()
	log.Printf("Purged %d notes older than %d months\n", rowsAffected, months)
	return nil
}

func (r *NostrRepository) PurgeReactionsOlderThan(months int) error {
	cutoffDate := time.Now().AddDate(0, -months, 0)
	query := `
        DELETE FROM reactions
        WHERE created_at < $1;
    `
	result, err := r.db.ExecContext(context.Background(), query, cutoffDate)
	if err != nil {
		return fmt.Errorf("failed to purge reactions: %v", err)
	}
	rowsAffected, _ := result.RowsAffected()
	fmt.Printf("Purged %d reactions older than %d months\n", rowsAffected, months)
	return nil
}

func (r *NostrRepository) PurgeZapsOlderThan(months int) error {
	cutoffDate := time.Now().AddDate(0, -months, 0)
	query := `
        DELETE FROM zaps
        WHERE created_at < $1;
    `
	result, err := r.db.ExecContext(context.Background(), query, cutoffDate)
	if err != nil {
		return fmt.Errorf("failed to purge zaps: %v", err)
	}
	rowsAffected, _ := result.RowsAffected()
	fmt.Printf("Purged %d zaps older than %d months\n", rowsAffected, months)
	return nil
}

// SaveUserSettings saves or updates a user's algorithm settings
func (r *NostrRepository) SaveUserSettings(settings UserSettings) error {
	// Convert settings to JSON
	settingsJSON, err := json.Marshal(settings)
	if err != nil {
		return fmt.Errorf("error marshaling settings: %v", err)
	}

	query := `
		INSERT INTO pubkey_settings (pubkey, settings)
		VALUES ($1, $2)
		ON CONFLICT (pubkey) DO UPDATE SET
			settings = $2
	`

	_, err = r.db.ExecContext(
		context.Background(),
		query,
		settings.PubKey,
		settingsJSON,
	)

	return err
}

// GetUserSettings retrieves a user's algorithm settings or returns default settings if none exist
func (r *NostrRepository) GetUserSettings(pubkey string) (UserSettings, error) {
	query := `
		SELECT settings
		FROM pubkey_settings
		WHERE pubkey = $1
	`

	var settingsJSON []byte
	err := r.db.QueryRowContext(context.Background(), query, pubkey).Scan(&settingsJSON)

	if err == sql.ErrNoRows {
		// Return default settings from environment variables
		return UserSettings{
			PubKey:             pubkey,
			AuthorInteractions: weightInteractionsWithAuthor,
			GlobalComments:     weightCommentsGlobal,
			GlobalReactions:    weightReactionsGlobal,
			GlobalZaps:         weightZapsGlobal,
			Recency:            weightRecency,
			DecayRate:          decayRate,
			ViralThreshold:     viralThreshold,
			ViralDampening:     viralNoteDampening,
		}, nil
	}

	if err != nil {
		return UserSettings{}, err
	}

	// Unmarshal the JSON settings
	var settings UserSettings
	if err := json.Unmarshal(settingsJSON, &settings); err != nil {
		return UserSettings{}, fmt.Errorf("error unmarshaling settings: %v", err)
	}

	return settings, nil
}

// GetUserMetrics retrieves activity metrics for a specific user
func (r *NostrRepository) GetUserMetrics(pubkey string) (UserMetrics, error) {
	// Get network size (unique authors interacted with)
	networkSizeQuery := `
		WITH author_interactions AS (
			-- Authors of notes the user has reacted to
			SELECT DISTINCT n.author_id
			FROM notes n
			JOIN reactions r ON n.id = r.note_id
			WHERE r.reactor_id = $1
			
			UNION
			
			-- Authors of notes the user has commented on
			SELECT DISTINCT n.author_id
			FROM notes n
			JOIN comments c ON n.id = c.note_id
			WHERE c.commenter_id = $1
			
			UNION
			
			-- Authors of notes the user has zapped
			SELECT DISTINCT n.author_id
			FROM notes n
			JOIN zaps z ON n.id = z.note_id
			WHERE z.zapper_id = $1
		)
		SELECT COUNT(DISTINCT author_id) FROM author_interactions;
	`

	var networkSize int
	err := r.db.QueryRowContext(context.Background(), networkSizeQuery, pubkey).Scan(&networkSize)
	if err != nil {
		return UserMetrics{}, fmt.Errorf("error fetching network size: %v", err)
	}

	// Get reactions count
	reactionsQuery := `
		SELECT COUNT(*) FROM reactions WHERE reactor_id = $1;
	`

	var reactions int
	err = r.db.QueryRowContext(context.Background(), reactionsQuery, pubkey).Scan(&reactions)
	if err != nil {
		return UserMetrics{}, fmt.Errorf("error fetching reactions count: %v", err)
	}

	// Get conversations (comments) count
	conversationsQuery := `
		SELECT COUNT(*) FROM comments WHERE commenter_id = $1;
	`

	var conversations int
	err = r.db.QueryRowContext(context.Background(), conversationsQuery, pubkey).Scan(&conversations)
	if err != nil {
		return UserMetrics{}, fmt.Errorf("error fetching conversations count: %v", err)
	}

	// Get zaps count
	zapsQuery := `
		SELECT COUNT(*) FROM zaps WHERE zapper_id = $1;
	`

	var zaps int
	err = r.db.QueryRowContext(context.Background(), zapsQuery, pubkey).Scan(&zaps)
	if err != nil {
		return UserMetrics{}, fmt.Errorf("error fetching zaps count: %v", err)
	}

	return UserMetrics{
		NetworkSize:   networkSize,
		Reactions:     reactions,
		Conversations: conversations,
		Zaps:          zaps,
	}, nil
}

func (r *NostrRepository) fetchTrendingTopAuthors(limit int, timeRange string) ([]TrendingTopAuthor, error) {
	start := time.Now()

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

	query := `
		WITH author_stats AS (
			SELECT 
				p.author_id,
				COUNT(DISTINCT p.id) as notes_count,
				COALESCE(SUM(r_count.reaction_count), 0) as reactions_received,
				COALESCE(SUM(z_count.zap_count), 0) as zaps_received,
				COALESCE(SUM(c_count.reply_count), 0) as replies_received,
				MAX(p.created_at) as last_activity
			FROM notes p
			LEFT JOIN (
				SELECT note_id, COUNT(*) as reaction_count
				FROM reactions
				WHERE created_at >= $1
				GROUP BY note_id
			) r_count ON p.id = r_count.note_id
			LEFT JOIN (
				SELECT note_id, COUNT(*) as zap_count
				FROM zaps
				WHERE created_at >= $1
				GROUP BY note_id
			) z_count ON p.id = z_count.note_id
			LEFT JOIN (
				SELECT note_id, COUNT(*) as reply_count
				FROM comments
								WHERE created_at >= $1
				GROUP BY note_id
			) c_count ON p.id = c_count.note_id
			WHERE p.created_at >= $1
			GROUP BY p.author_id
		),
		author_engagement AS (
			SELECT 
				author_id,
				notes_count,
				reactions_received,
				zaps_received,
				replies_received,
				(reactions_received + zaps_received + replies_received) as total_interactions,
				-- Calculate engagement score: (reactions + zaps*2 + replies*1.5) / notes_count
				CASE 
					WHEN notes_count > 0 THEN 
						(reactions_received + (zaps_received * 2.0) + (replies_received * 1.5)) / notes_count::float
					ELSE 0 
				END as engagement_score,
				last_activity
			FROM author_stats
			WHERE notes_count >= 1  -- Only authors with at least 1 note
		)
		SELECT 
			ae.author_id,
			ae.total_interactions,
			ae.reactions_received,
			ae.zaps_received,
			ae.replies_received,
			ae.notes_count,
			ae.engagement_score,
			EXTRACT(EPOCH FROM ae.last_activity)::bigint as last_activity_timestamp,
			COALESCE(ps.settings->>'name', '') as name,
			COALESCE(ps.settings->>'picture', '') as picture
		FROM author_engagement ae
		LEFT JOIN pubkey_settings ps ON ae.author_id = ps.pubkey
		WHERE ae.total_interactions > 0  -- Only authors with some interactions
		ORDER BY ae.engagement_score DESC, ae.total_interactions DESC, ae.last_activity DESC
		LIMIT $2;
	`

	rows, err := r.db.QueryContext(context.Background(), query, timeCutoff, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	authors := make([]TrendingTopAuthor, 0, limit)
	for rows.Next() {
		var authorID, name, picture string
		var totalInteractions, reactionsReceived, zapsReceived, repliesReceived, notesCount int
		var engagementScore float64
		var lastActivityTimestamp int64

		if err := rows.Scan(
			&authorID, &totalInteractions, &reactionsReceived, &zapsReceived, &repliesReceived,
			&notesCount, &engagementScore, &lastActivityTimestamp, &name, &picture,
		); err != nil {
			return nil, err
		}

		authors = append(authors, TrendingTopAuthor{
			Pubkey:            authorID,
			Name:              name,
			Picture:           picture,
			TotalInteractions: totalInteractions,
			ReactionsReceived: reactionsReceived,
			ZapsReceived:      zapsReceived,
			RepliesReceived:   repliesReceived,
			NotesCount:        notesCount,
			EngagementScore:   engagementScore,
			LastActivity:      lastActivityTimestamp,
		})
	}

	log.Printf("Fetched trending top authors in %v (time range: %s, limit: %d)", time.Since(start), timeRange, limit)
	return authors, nil
}

// fetchTopInteractedAuthorsWithPagination fetches top interacted authors with pagination and time range
func (r *NostrRepository) fetchTopInteractedAuthorsWithPagination(userID string, limit int, offset int, timeRange string) ([]TopAuthor, error) {
	start := time.Now()

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

	query := `
		WITH user_interactions AS (
			SELECT DISTINCT
				CASE 
					WHEN r.author_id = $1 THEN r.target_author_id
					WHEN c.author_id = $1 THEN c.target_author_id
					WHEN z.author_id = $1 THEN z.target_author_id
					ELSE NULL
				END as interacted_author_id,
				CASE 
					WHEN r.author_id = $1 THEN r.created_at
					WHEN c.author_id = $1 THEN c.created_at
					WHEN z.author_id = $1 THEN z.created_at
					ELSE NULL
				END as interaction_time
			FROM (
				SELECT author_id, target_author_id, created_at
				FROM reactions
				WHERE author_id = $1 AND created_at >= $2
				UNION ALL
				SELECT author_id, target_author_id, created_at
				FROM comments
				WHERE author_id = $1 AND created_at >= $2
				UNION ALL
				SELECT author_id, target_author_id, created_at
				FROM zaps
				WHERE author_id = $1 AND created_at >= $2
			) AS combined_interactions
		),
		author_interaction_counts AS (
			SELECT 
				interacted_author_id,
				COUNT(*) as interaction_count,
				MAX(interaction_time) as last_interaction
			FROM user_interactions
			WHERE interacted_author_id IS NOT NULL
			GROUP BY interacted_author_id
		)
		SELECT 
			aic.interacted_author_id,
			aic.interaction_count,
			EXTRACT(EPOCH FROM aic.last_interaction)::bigint as last_interaction_timestamp,
			COALESCE(ps.settings->>'name', '') as name,
			COALESCE(ps.settings->>'picture', '') as picture
		FROM author_interaction_counts aic
		LEFT JOIN pubkey_settings ps ON aic.interacted_author_id = ps.pubkey
		ORDER BY aic.interaction_count DESC, aic.last_interaction DESC
		LIMIT $3 OFFSET $4
	`

	rows, err := r.db.QueryContext(context.Background(), query, userID, timeCutoff, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var authors []TopAuthor
	for rows.Next() {
		var authorID, name, picture string
		var interactionCount int
		var lastInteractionTimestamp int64

		if err := rows.Scan(&authorID, &interactionCount, &lastInteractionTimestamp, &name, &picture); err != nil {
			return nil, err
		}

		authors = append(authors, TopAuthor{
			Pubkey:           authorID,
			Name:             name,
			Picture:          picture,
			InteractionCount: interactionCount,
			LastInteraction:  lastInteractionTimestamp,
		})
	}

	log.Printf("Fetched top interacted authors with pagination in %v (user: %s, limit: %d, offset: %d, timeRange: %s)",
		time.Since(start), userID, limit, offset, timeRange)
	return authors, nil
}

// GetNotesWithFilters retrieves notes with enhanced filtering and pagination
func (r *NostrRepository) GetNotesWithFilters(ctx context.Context, limit int, offset int, kinds []int, searchQuery string, timeRange string, tags []string, authors []string) ([]FeedNote, error) {
	start := time.Now()

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
		SELECT 
			n.id, n.author_id, n.kind, n.content, n.created_at,
			COALESCE(r_count.reaction_count, 0) as reaction_count,
			COALESCE(c_count.comment_count, 0) as comment_count,
			COALESCE(z_count.zap_count, 0) as zap_count
		FROM notes n
		LEFT JOIN (
			SELECT note_id, COUNT(*) as reaction_count
			FROM reactions
			WHERE created_at >= $1
			GROUP BY note_id
		) r_count ON n.id = r_count.note_id
		LEFT JOIN (
			SELECT note_id, COUNT(*) as comment_count
			FROM comments
			WHERE created_at >= $1
			GROUP BY note_id
		) c_count ON n.id = c_count.note_id
		LEFT JOIN (
			SELECT note_id, COUNT(*) as zap_count
			FROM zaps
			WHERE created_at >= $1
			GROUP BY note_id
		) z_count ON n.id = z_count.note_id
		WHERE n.created_at >= $1
	`

	// Add kind filter if specified
	if len(kinds) > 0 {
		baseQuery += " AND n.kind = ANY($2)"
	}

	// Add search filter if specified
	if searchQuery != "" {
		baseQuery += " AND (n.content ILIKE $3 OR n.author_id ILIKE $3)"
	}

	// Add authors filter if specified
	if len(authors) > 0 {
		baseQuery += " AND n.author_id = ANY($4)"
	}

	// Add ordering and pagination
	baseQuery += `
		ORDER BY n.created_at DESC
		LIMIT $5 OFFSET $6
	`

	// Execute the query with appropriate parameters
	var rows *sql.Rows
	var err error

	if len(kinds) > 0 && searchQuery != "" && len(authors) > 0 {
		searchPattern := "%" + searchQuery + "%"
		rows, err = r.db.QueryContext(ctx, baseQuery, timeCutoff, pq.Array(kinds), searchPattern, pq.Array(authors), limit, offset)
	} else if len(kinds) > 0 && searchQuery != "" {
		searchPattern := "%" + searchQuery + "%"
		rows, err = r.db.QueryContext(ctx, baseQuery, timeCutoff, pq.Array(kinds), searchPattern, limit, offset)
	} else if len(kinds) > 0 && len(authors) > 0 {
		rows, err = r.db.QueryContext(ctx, baseQuery, timeCutoff, pq.Array(kinds), pq.Array(authors), limit, offset)
	} else if searchQuery != "" && len(authors) > 0 {
		searchPattern := "%" + searchQuery + "%"
		rows, err = r.db.QueryContext(ctx, baseQuery, timeCutoff, searchPattern, pq.Array(authors), limit, offset)
	} else if len(kinds) > 0 {
		rows, err = r.db.QueryContext(ctx, baseQuery, timeCutoff, pq.Array(kinds), limit, offset)
	} else if searchQuery != "" {
		searchPattern := "%" + searchQuery + "%"
		rows, err = r.db.QueryContext(ctx, baseQuery, timeCutoff, searchPattern, limit, offset)
	} else if len(authors) > 0 {
		rows, err = r.db.QueryContext(ctx, baseQuery, timeCutoff, pq.Array(authors), limit, offset)
	} else {
		rows, err = r.db.QueryContext(ctx, baseQuery, timeCutoff, limit, offset)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []FeedNote
	for rows.Next() {
		var id, authorID, content string
		var kind int
		var createdAt time.Time
		var reactionCount, commentCount, zapCount int

		if err := rows.Scan(&id, &authorID, &kind, &content, &createdAt, &reactionCount, &commentCount, &zapCount); err != nil {
			return nil, err
		}

		// Create nostr.Event
		event := nostr.Event{
			ID:        id,
			PubKey:    authorID,
			CreatedAt: nostr.Timestamp(createdAt.Unix()),
			Kind:      kind,
			Content:   content,
		}

		// Calculate score based on interactions
		score := float64(reactionCount + commentCount + zapCount*2)

		notes = append(notes, FeedNote{
			Event: event,
			Score: score,
		})
	}

	log.Printf("Fetched notes with filters in %v (limit: %d, offset: %d, kinds: %v, search: %s, timeRange: %s, authors: %v)",
		time.Since(start), limit, offset, kinds, searchQuery, timeRange, authors)
	return notes, nil
}

// fetchTrendingTopAuthorsWithFilters fetches trending top authors with enhanced filtering
func (r *NostrRepository) fetchTrendingTopAuthorsWithFilters(limit int, offset int, timeRange string, minEngagementScore float64, minNotesCount int, searchQuery string, kinds []int) ([]TrendingTopAuthor, error) {
	start := time.Now()

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

	query := `
		WITH author_stats AS (
			SELECT 
				p.author_id,
				COUNT(DISTINCT p.id) as notes_count,
				COALESCE(SUM(r_count.reaction_count), 0) as reactions_received,
				COALESCE(SUM(z_count.zap_count), 0) as zaps_received,
				COALESCE(SUM(c_count.reply_count), 0) as replies_received,
				MAX(p.created_at) as last_activity
			FROM notes p
			LEFT JOIN (
				SELECT note_id, COUNT(*) as reaction_count
				FROM reactions
				WHERE created_at >= $1
				GROUP BY note_id
			) r_count ON p.id = r_count.note_id
			LEFT JOIN (
				SELECT note_id, COUNT(*) as zap_count
				FROM zaps
				WHERE created_at >= $1
				GROUP BY note_id
			) z_count ON p.id = z_count.note_id
			LEFT JOIN (
				SELECT note_id, COUNT(*) as reply_count
				FROM comments
				WHERE created_at >= $1
				GROUP BY note_id
			) c_count ON p.id = c_count.note_id
			WHERE p.created_at >= $1
	`

	// Add kinds filter if specified
	if len(kinds) > 0 {
		query += " AND p.kind = ANY($2)"
	}

	query += `
			GROUP BY p.author_id
		),
		author_engagement AS (
			SELECT 
				author_id,
				notes_count,
				reactions_received,
				zaps_received,
				replies_received,
				(reactions_received + zaps_received + replies_received) as total_interactions,
				-- Calculate engagement score: (reactions + zaps*2 + replies*1.5) / notes_count
				CASE 
					WHEN notes_count > 0 THEN 
						(reactions_received + (zaps_received * 2.0) + (replies_received * 1.5)) / notes_count::float
					ELSE 0 
				END as engagement_score,
				last_activity
			FROM author_stats
			WHERE notes_count >= $3  -- Minimum notes count filter
		)
		SELECT 
			ae.author_id,
			ae.total_interactions,
			ae.reactions_received,
			ae.zaps_received,
			ae.replies_received,
			ae.notes_count,
			ae.engagement_score,
			EXTRACT(EPOCH FROM ae.last_activity)::bigint as last_activity_timestamp,
			COALESCE(ps.settings->>'name', '') as name,
			COALESCE(ps.settings->>'picture', '') as picture
		FROM author_engagement ae
		LEFT JOIN pubkey_settings ps ON ae.author_id = ps.pubkey
		WHERE ae.total_interactions > 0  -- Only authors with some interactions
		AND ae.engagement_score >= $4  -- Minimum engagement score filter
	`

	// Add search filter if specified
	if searchQuery != "" {
		query += " AND (ps.settings->>'name' ILIKE $5 OR ae.author_id ILIKE $5)"
	}

	query += `
		ORDER BY ae.engagement_score DESC, ae.total_interactions DESC, ae.last_activity DESC
		LIMIT $6 OFFSET $7;
	`

	// Execute the query with appropriate parameters
	var rows *sql.Rows
	var err error

	if len(kinds) > 0 && searchQuery != "" {
		searchPattern := "%" + searchQuery + "%"
		rows, err = r.db.QueryContext(context.Background(), query, timeCutoff, pq.Array(kinds), minNotesCount, minEngagementScore, searchPattern, limit, offset)
	} else if len(kinds) > 0 {
		rows, err = r.db.QueryContext(context.Background(), query, timeCutoff, pq.Array(kinds), minNotesCount, minEngagementScore, limit, offset)
	} else if searchQuery != "" {
		searchPattern := "%" + searchQuery + "%"
		rows, err = r.db.QueryContext(context.Background(), query, timeCutoff, minNotesCount, minEngagementScore, searchPattern, limit, offset)
	} else {
		rows, err = r.db.QueryContext(context.Background(), query, timeCutoff, minNotesCount, minEngagementScore, limit, offset)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	authors := make([]TrendingTopAuthor, 0, limit)
	for rows.Next() {
		var authorID, name, picture string
		var totalInteractions, reactionsReceived, zapsReceived, repliesReceived, notesCount int
		var engagementScore float64
		var lastActivityTimestamp int64

		if err := rows.Scan(
			&authorID, &totalInteractions, &reactionsReceived, &zapsReceived, &repliesReceived,
			&notesCount, &engagementScore, &lastActivityTimestamp, &name, &picture,
		); err != nil {
			return nil, err
		}

		authors = append(authors, TrendingTopAuthor{
			Pubkey:            authorID,
			Name:              name,
			Picture:           picture,
			TotalInteractions: totalInteractions,
			ReactionsReceived: reactionsReceived,
			ZapsReceived:      zapsReceived,
			RepliesReceived:   repliesReceived,
			NotesCount:        notesCount,
			EngagementScore:   engagementScore,
			LastActivity:      lastActivityTimestamp,
		})
	}

	log.Printf("Fetched trending top authors with filters in %v (limit: %d, offset: %d, timeRange: %s, minEngagementScore: %f, minNotesCount: %d, search: %s, kinds: %v)",
		time.Since(start), limit, offset, timeRange, minEngagementScore, minNotesCount, searchQuery, kinds)
	return authors, nil
}

// SearchAuthors searches for authors based on various criteria
func (r *NostrRepository) SearchAuthors(searchQuery string, limit int, offset int, timeRange string, minEngagementScore float64, minNotesCount int, kinds []int) ([]TrendingTopAuthor, error) {
	start := time.Now()

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

	query := `
		WITH author_stats AS (
			SELECT 
				p.author_id,
				COUNT(DISTINCT p.id) as notes_count,
				COALESCE(SUM(r_count.reaction_count), 0) as reactions_received,
				COALESCE(SUM(z_count.zap_count), 0) as zaps_received,
				COALESCE(SUM(c_count.reply_count), 0) as replies_received,
				MAX(p.created_at) as last_activity
			FROM notes p
			LEFT JOIN (
				SELECT note_id, COUNT(*) as reaction_count
				FROM reactions
				WHERE created_at >= $1
				GROUP BY note_id
			) r_count ON p.id = r_count.note_id
			LEFT JOIN (
				SELECT note_id, COUNT(*) as zap_count
				FROM zaps
				WHERE created_at >= $1
				GROUP BY note_id
			) z_count ON p.id = z_count.note_id
			LEFT JOIN (
				SELECT note_id, COUNT(*) as reply_count
				FROM comments
				WHERE created_at >= $1
				GROUP BY note_id
			) c_count ON p.id = c_count.note_id
			WHERE p.created_at >= $1
	`

	// Add kinds filter if specified
	if len(kinds) > 0 {
		query += " AND p.kind = ANY($2)"
	}

	query += `
			GROUP BY p.author_id
		),
		author_engagement AS (
			SELECT 
				author_id,
				notes_count,
				reactions_received,
				zaps_received,
				replies_received,
				(reactions_received + zaps_received + replies_received) as total_interactions,
				CASE 
					WHEN notes_count > 0 THEN 
						(reactions_received + (zaps_received * 2.0) + (replies_received * 1.5)) / notes_count::float
					ELSE 0 
				END as engagement_score,
				last_activity
			FROM author_stats
			WHERE notes_count >= $3
		)
		SELECT 
			ae.author_id,
			ae.total_interactions,
			ae.reactions_received,
			ae.zaps_received,
			ae.replies_received,
			ae.notes_count,
			ae.engagement_score,
			EXTRACT(EPOCH FROM ae.last_activity)::bigint as last_activity_timestamp,
			COALESCE(ps.settings->>'name', '') as name,
			COALESCE(ps.settings->>'picture', '') as picture
		FROM author_engagement ae
		LEFT JOIN pubkey_settings ps ON ae.author_id = ps.pubkey
		WHERE ae.engagement_score >= $4
		AND (
			ps.settings->>'name' ILIKE $5 
			OR ae.author_id ILIKE $5 
			OR ps.settings->>'display_name' ILIKE $5
			OR ps.settings->>'nip05' ILIKE $5
		)
		ORDER BY ae.engagement_score DESC, ae.total_interactions DESC, ae.last_activity DESC
		LIMIT $6 OFFSET $7;
	`

	// Execute the query with appropriate parameters
	var rows *sql.Rows
	var err error

	if len(kinds) > 0 {
		searchPattern := "%" + searchQuery + "%"
		rows, err = r.db.QueryContext(context.Background(), query, timeCutoff, pq.Array(kinds), minNotesCount, minEngagementScore, searchPattern, limit, offset)
	} else {
		searchPattern := "%" + searchQuery + "%"
		rows, err = r.db.QueryContext(context.Background(), query, timeCutoff, minNotesCount, minEngagementScore, searchPattern, limit, offset)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	authors := make([]TrendingTopAuthor, 0, limit)
	for rows.Next() {
		var authorID, name, picture string
		var totalInteractions, reactionsReceived, zapsReceived, repliesReceived, notesCount int
		var engagementScore float64
		var lastActivityTimestamp int64

		if err := rows.Scan(
			&authorID, &totalInteractions, &reactionsReceived, &zapsReceived, &repliesReceived,
			&notesCount, &engagementScore, &lastActivityTimestamp, &name, &picture,
		); err != nil {
			return nil, err
		}

		authors = append(authors, TrendingTopAuthor{
			Pubkey:            authorID,
			Name:              name,
			Picture:           picture,
			TotalInteractions: totalInteractions,
			ReactionsReceived: reactionsReceived,
			ZapsReceived:      zapsReceived,
			RepliesReceived:   repliesReceived,
			NotesCount:        notesCount,
			EngagementScore:   engagementScore,
			LastActivity:      lastActivityTimestamp,
		})
	}

	log.Printf("Searched authors in %v (query: %s, limit: %d, offset: %d, timeRange: %s, minEngagementScore: %f, minNotesCount: %d, kinds: %v)",
		time.Since(start), searchQuery, limit, offset, timeRange, minEngagementScore, minNotesCount, kinds)
	return authors, nil
}

// SearchTags searches for popular tags
func (r *NostrRepository) SearchTags(searchQuery string, limit int, offset int, timeRange string, kinds []int, minUsageCount int) ([]map[string]interface{}, error) {
	start := time.Now()

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

	query := `
		WITH tag_usage AS (
			SELECT 
				tag_value,
				COUNT(*) as usage_count,
				COUNT(DISTINCT n.author_id) as unique_authors,
				MAX(n.created_at) as last_used
			FROM notes n,
			jsonb_array_elements_text(n.tags) as tag_value
			WHERE n.created_at >= $1
			AND tag_value LIKE 't:%'
	`

	// Add kinds filter if specified
	if len(kinds) > 0 {
		query += " AND n.kind = ANY($2)"
	}

	// Add search filter if specified
	if searchQuery != "" {
		query += " AND tag_value ILIKE $3"
	}

	query += `
			GROUP BY tag_value
			HAVING COUNT(*) >= $4
		)
		SELECT 
			REPLACE(tag_value, 't:', '') as tag,
			usage_count,
			unique_authors,
			EXTRACT(EPOCH FROM last_used)::bigint as last_used_timestamp
		FROM tag_usage
		ORDER BY usage_count DESC, unique_authors DESC, last_used DESC
		LIMIT $5 OFFSET $6;
	`

	// Execute the query with appropriate parameters
	var rows *sql.Rows
	var err error

	if len(kinds) > 0 && searchQuery != "" {
		searchPattern := "%t:" + searchQuery + "%"
		rows, err = r.db.QueryContext(context.Background(), query, timeCutoff, pq.Array(kinds), searchPattern, minUsageCount, limit, offset)
	} else if len(kinds) > 0 {
		rows, err = r.db.QueryContext(context.Background(), query, timeCutoff, pq.Array(kinds), minUsageCount, limit, offset)
	} else if searchQuery != "" {
		searchPattern := "%t:" + searchQuery + "%"
		rows, err = r.db.QueryContext(context.Background(), query, timeCutoff, searchPattern, minUsageCount, limit, offset)
	} else {
		rows, err = r.db.QueryContext(context.Background(), query, timeCutoff, minUsageCount, limit, offset)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tags := make([]map[string]interface{}, 0, limit)
	for rows.Next() {
		var tag string
		var usageCount, uniqueAuthors int
		var lastUsedTimestamp int64

		if err := rows.Scan(&tag, &usageCount, &uniqueAuthors, &lastUsedTimestamp); err != nil {
			return nil, err
		}

		tags = append(tags, map[string]interface{}{
			"tag":            tag,
			"usage_count":    usageCount,
			"unique_authors": uniqueAuthors,
			"last_used":      lastUsedTimestamp,
		})
	}

	log.Printf("Searched tags in %v (query: %s, limit: %d, offset: %d, timeRange: %s, kinds: %v, minUsageCount: %d)",
		time.Since(start), searchQuery, limit, offset, timeRange, kinds, minUsageCount)
	return tags, nil
}
