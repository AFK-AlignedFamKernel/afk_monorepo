ALTER TABLE "shares_token_user" ALTER COLUMN "amount_owned" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "shares_token_user" ALTER COLUMN "amount_buy" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "shares_token_user" ALTER COLUMN "amount_sell" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "shares_token_user" ALTER COLUMN "total_paid" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "token_deploy" ALTER COLUMN "is_launched" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "token_launch" ALTER COLUMN "is_liquidity_added" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "token_transactions" ALTER COLUMN "amount" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "token_metadata" ADD COLUMN "twitter" text;--> statement-breakpoint
ALTER TABLE "token_metadata" ADD COLUMN "telegram" text;--> statement-breakpoint
ALTER TABLE "token_metadata" ADD COLUMN "github" text;--> statement-breakpoint
ALTER TABLE "token_metadata" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "token_deploy" DROP COLUMN IF EXISTS "_cursor";--> statement-breakpoint
ALTER TABLE "token_deploy" DROP COLUMN IF EXISTS "time_stamp";--> statement-breakpoint
ALTER TABLE "token_deploy" DROP COLUMN IF EXISTS "description";--> statement-breakpoint
ALTER TABLE "token_deploy" DROP COLUMN IF EXISTS "ipfs_hash";--> statement-breakpoint
ALTER TABLE "token_deploy" DROP COLUMN IF EXISTS "ipfs_metadata_url";--> statement-breakpoint
ALTER TABLE "token_deploy" DROP COLUMN IF EXISTS "nostr_id";--> statement-breakpoint
ALTER TABLE "token_deploy" DROP COLUMN IF EXISTS "url";--> statement-breakpoint
ALTER TABLE "token_deploy" DROP COLUMN IF EXISTS "github";--> statement-breakpoint
ALTER TABLE "token_deploy" DROP COLUMN IF EXISTS "image_url";--> statement-breakpoint
ALTER TABLE "token_deploy" DROP COLUMN IF EXISTS "metadata";--> statement-breakpoint
ALTER TABLE "token_deploy" DROP COLUMN IF EXISTS "nostr_event_id";--> statement-breakpoint
ALTER TABLE "token_deploy" DROP COLUMN IF EXISTS "telegram";--> statement-breakpoint
ALTER TABLE "token_deploy" DROP COLUMN IF EXISTS "twitter";--> statement-breakpoint
ALTER TABLE "token_deploy" DROP COLUMN IF EXISTS "website";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "exchange_name";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "_cursor";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "time_stamp";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "description";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "github";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "image_url";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "ipfs_hash";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "ipfs_metadata_url";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "metadata";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "nostr_event_id";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "nostr_id";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "telegram";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "twitter";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "url";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "website";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "name";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "symbol";--> statement-breakpoint
ALTER TABLE "token_metadata" DROP COLUMN IF EXISTS "contract_address";--> statement-breakpoint
ALTER TABLE "token_metadata" DROP COLUMN IF EXISTS "name";--> statement-breakpoint
ALTER TABLE "token_metadata" DROP COLUMN IF EXISTS "symbol";--> statement-breakpoint
ALTER TABLE "token_metadata" DROP COLUMN IF EXISTS "_cursor";--> statement-breakpoint
ALTER TABLE "token_metadata" DROP COLUMN IF EXISTS "time_stamp";--> statement-breakpoint
ALTER TABLE "token_metadata" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "token_transactions" DROP COLUMN IF EXISTS "coin_received";--> statement-breakpoint
ALTER TABLE "token_transactions" DROP COLUMN IF EXISTS "initial_supply";--> statement-breakpoint
ALTER TABLE "token_transactions" DROP COLUMN IF EXISTS "total_supply";--> statement-breakpoint
ALTER TABLE "token_transactions" DROP COLUMN IF EXISTS "current_supply";--> statement-breakpoint
ALTER TABLE "token_transactions" DROP COLUMN IF EXISTS "liquidity_raised";--> statement-breakpoint
ALTER TABLE "token_transactions" DROP COLUMN IF EXISTS "_cursor";