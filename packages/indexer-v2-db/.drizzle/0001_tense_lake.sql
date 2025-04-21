CREATE TABLE IF NOT EXISTS "indexer_cursor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cursor" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_block_number" bigint,
	"last_block_hash" text,
	"last_tx_hash" text
);
