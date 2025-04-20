CREATE TABLE IF NOT EXISTS "contract_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_address" text NOT NULL,
	"network" text,
	"current_epoch_index" text,
	"total_ai_score" numeric(30, 18) DEFAULT '0',
	"total_vote_score" numeric(30, 18) DEFAULT '0',
	"total_tips" numeric(30, 18) DEFAULT '0',
	"total_amount_deposit" numeric(30, 18) DEFAULT '0',
	"total_to_claimed" numeric(30, 18) DEFAULT '0',
	"percentage_algo_distribution" integer DEFAULT 50,
	"quote_address" text,
	"main_token_address" text,
	"current_epoch_duration" integer DEFAULT 0,
	"current_epoch_start" timestamp,
	"current_epoch_end" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"topic_metadata" text,
	"nostr_metadata" text,
	"name" text,
	"about" text,
	"main_tag" text,
	"keyword" text,
	"keywords" text[],
	"event_id_nip_29" text,
	"event_id_nip_72" text,
	CONSTRAINT "contract_state_contract_address_unique" UNIQUE("contract_address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "epoch_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"epoch_index" text NOT NULL,
	"contract_address" text NOT NULL,
	"total_ai_score" numeric(30, 18) DEFAULT '0',
	"total_vote_score" numeric(30, 18) DEFAULT '0',
	"total_amount_deposit" numeric(30, 18) DEFAULT '0',
	"total_tip" numeric(30, 18) DEFAULT '0',
	"amount_claimed" numeric(30, 18) DEFAULT '0',
	"amount_vote" numeric(30, 18) DEFAULT '0',
	"amount_algo" numeric(30, 18) DEFAULT '0',
	"epoch_duration" integer,
	"start_time" timestamp,
	"end_time" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "epoch_state_epoch_index_contract_address_pk" PRIMARY KEY("epoch_index","contract_address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_epoch_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nostr_id" text NOT NULL,
	"epoch_index" text NOT NULL,
	"contract_address" text NOT NULL,
	"total_tip" numeric(30, 18) DEFAULT '0',
	"total_ai_score" numeric(30, 18) DEFAULT '0',
	"total_vote_score" numeric(30, 18) DEFAULT '0',
	"amount_claimed" numeric(30, 18) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_epoch_state_nostr_id_epoch_index_contract_address_pk" PRIMARY KEY("nostr_id","epoch_index","contract_address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nostr_id" text NOT NULL,
	"starknet_address" text,
	"total_ai_score" numeric(30, 18) DEFAULT '0',
	"total_tip" numeric(30, 18) DEFAULT '0',
	"total_vote_score" numeric(30, 18) DEFAULT '0',
	"amount_claimed" numeric(30, 18) DEFAULT '0',
	"is_add_by_admin" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profile_nostr_id_unique" UNIQUE("nostr_id")
);
