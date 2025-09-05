CREATE TABLE IF NOT EXISTS "candlesticks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_address" text NOT NULL,
	"interval_minutes" integer NOT NULL,
	"timestamp" timestamp NOT NULL,
	"open" numeric(30, 18) NOT NULL,
	"high" numeric(30, 18) NOT NULL,
	"low" numeric(30, 18) NOT NULL,
	"close" numeric(30, 18) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "candlesticks_token_interval_timestamp_idx" ON "candlesticks" USING btree ("token_address","interval_minutes","timestamp");