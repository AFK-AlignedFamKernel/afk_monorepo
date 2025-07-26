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

func (r *NostrRepository) fetchTopInteractedAuthors(userID string) ([]AuthorInteraction, error) {
	start := time.Now()
	query := `
		WITH zap_counts AS (
			SELECT p.author_id, COUNT(z.id) AS interaction_count
			FROM notes p
			JOIN zaps z ON p.id = z.note_id
			WHERE z.zapper_id = $1
			GROUP BY p.author_id
		),
		reaction_counts AS (
			SELECT p.author_id, COUNT(r.id) AS interaction_count
			FROM notes p
			JOIN reactions r ON p.id = r.note_id
			WHERE r.reactor_id = $1
			GROUP BY p.author_id
		),
		comment_counts AS (
			SELECT p.author_id, COUNT(c.id) AS interaction_count
			FROM notes p
			JOIN comments c ON p.id = c.note_id
			WHERE c.commenter_id = $1
			GROUP BY p.author_id
		)
		SELECT author_id, SUM(interaction_count) AS interaction_count
		FROM (
			SELECT author_id, interaction_count FROM zap_counts
			UNION ALL
			SELECT author_id, interaction_count FROM reaction_counts
			UNION ALL
			SELECT author_id, interaction_count FROM comment_counts
		) AS interactions
		GROUP BY author_id
		ORDER BY interaction_count DESC;
	`
	rows, err := r.db.QueryContext(context.Background(), query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	authors := make([]AuthorInteraction, 0, 128)
	for rows.Next() {
		var authorID string
		var interactionCount int
		if err := rows.Scan(&authorID, &interactionCount); err != nil {
			return nil, err
		}
		authors = append(authors, AuthorInteraction{
			AuthorID:         authorID,
			InteractionCount: interactionCount,
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

func (r *NostrRepository) fetchNotesFromAuthors(authorInteractions []AuthorInteraction, kind int) ([]EventWithMeta, error) {
	// Extract author IDs and interaction counts
	start := time.Now()
	authorIDs := make([]string, 0, len(authorInteractions))
	interactionCounts := make([]int, 0, len(authorInteractions))

	for _, authorInteraction := range authorInteractions {
		// Only include authors with an interaction count >= 5
		if authorInteraction.InteractionCount >= 5 {
			authorIDs = append(authorIDs, authorInteraction.AuthorID)
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
