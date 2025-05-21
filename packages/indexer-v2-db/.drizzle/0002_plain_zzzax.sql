CREATE TABLE IF NOT EXISTS "shares_token_user" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"token_address" text NOT NULL,
	"amount_owned" numeric(30, 18) DEFAULT '0',
	"amount_buy" numeric(30, 18) DEFAULT '0',
	"amount_sell" numeric(30, 18) DEFAULT '0',
	"total_paid" numeric(30, 18) DEFAULT '0',
	"is_claimable" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
