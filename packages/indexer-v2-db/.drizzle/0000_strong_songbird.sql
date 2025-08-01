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
CREATE TABLE IF NOT EXISTS "dao_creation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" bigint,
	"hash" text,
	"creator" text,
	"token_address" text,
	"contract_address" text NOT NULL,
	"starknet_address" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dao_proposal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_address" text NOT NULL,
	"proposal_id" bigint NOT NULL,
	"creator" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"end_at" integer,
	"is_canceled" boolean DEFAULT false,
	"result" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "dao_proposal_pkey" PRIMARY KEY("contract_address","proposal_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dao_proposal_vote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_address" text NOT NULL,
	"proposal_id" bigint NOT NULL,
	"voter" text NOT NULL,
	"vote" text,
	"votes" bigint,
	"total_votes" bigint,
	"voted_at" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "dao_proposal_vote_pkey" PRIMARY KEY("contract_address","proposal_id","voter")
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
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "indexer_cursor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cursor" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_block_number" bigint,
	"last_block_hash" text,
	"last_tx_hash" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shares_token_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner" text NOT NULL,
	"token_address" text NOT NULL,
	"amount_owned" text DEFAULT '0',
	"amount_buy" text DEFAULT '0',
	"amount_sell" text DEFAULT '0',
	"total_paid" text DEFAULT '0',
	"is_claimable" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token_deploy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_hash" text,
	"network" text,
	"block_timestamp" timestamp,
	"memecoin_address" text,
	"owner_address" text,
	"name" text,
	"symbol" text,
	"initial_supply" text,
	"total_supply" text,
	"created_at" timestamp DEFAULT now(),
	"is_launched" boolean DEFAULT false,
	CONSTRAINT "token_deploy_transaction_hash_unique" UNIQUE("transaction_hash"),
	CONSTRAINT "token_deploy_memecoin_address_unique" UNIQUE("memecoin_address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token_launch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_hash" text,
	"network" text,
	"block_timestamp" timestamp,
	"memecoin_address" text,
	"owner_address" text,
	"name" text,
	"symbol" text,
	"quote_token" text,
	"total_supply" text,
	"threshold_liquidity" text,
	"current_supply" text,
	"liquidity_raised" text,
	"is_liquidity_added" boolean DEFAULT false,
	"total_token_holded" text,
	"price" text,
	"bonding_type" text,
	"initial_pool_supply_dex" text,
	"market_cap" text,
	"created_at" timestamp DEFAULT now(),
	"token_deploy_tx_hash" text,
	CONSTRAINT "token_launch_transaction_hash_unique" UNIQUE("transaction_hash"),
	CONSTRAINT "token_launch_memecoin_address_unique" UNIQUE("memecoin_address"),
	CONSTRAINT "token_launch_token_deploy_tx_hash_unique" UNIQUE("token_deploy_tx_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_hash" text,
	"network" text,
	"block_timestamp" timestamp,
	"memecoin_address" text,
	"url" text,
	"nostr_id" text,
	"nostr_event_id" text,
	"twitter" text,
	"telegram" text,
	"github" text,
	"website" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "token_metadata_transaction_hash_unique" UNIQUE("transaction_hash"),
	CONSTRAINT "token_metadata_memecoin_address_unique" UNIQUE("memecoin_address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_id" text,
	"network" text,
	"block_timestamp" timestamp,
	"transaction_hash" text,
	"memecoin_address" text,
	"owner_address" text,
	"last_price" text,
	"quote_amount" text,
	"price" text,
	"protocol_fee" text,
	"amount" text,
	"transaction_type" text,
	"time_stamp" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "token_transactions_transfer_id_unique" UNIQUE("transfer_id")
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
	"contract_address" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profile_nostr_id_unique" UNIQUE("nostr_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dao_proposal" ADD CONSTRAINT "dao_proposal_contract_address_fkey" FOREIGN KEY ("contract_address") REFERENCES "public"."dao_creation"("contract_address") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dao_proposal_vote" ADD CONSTRAINT "dao_proposal_vote_proposal_fkey" FOREIGN KEY ("contract_address","proposal_id") REFERENCES "public"."dao_proposal"("contract_address","proposal_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "epoch_state" ADD CONSTRAINT "epoch_state_contract_address_contract_state_contract_address_fk" FOREIGN KEY ("contract_address") REFERENCES "public"."contract_state"("contract_address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "dao_creation_contract_address_idx" ON "dao_creation" USING btree ("contract_address");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "epoch_contract_unique_idx" ON "epoch_state" USING btree ("epoch_index","contract_address");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "shares_token_user_owner_token_idx" ON "shares_token_user" USING btree ("owner","token_address");