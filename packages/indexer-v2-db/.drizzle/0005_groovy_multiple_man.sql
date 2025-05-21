ALTER TABLE "token_deploy" DROP COLUMN IF EXISTS "block_hash";--> statement-breakpoint
ALTER TABLE "token_deploy" DROP COLUMN IF EXISTS "block_number";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "block_hash";--> statement-breakpoint
ALTER TABLE "token_launch" DROP COLUMN IF EXISTS "block_number";--> statement-breakpoint
ALTER TABLE "token_metadata" DROP COLUMN IF EXISTS "block_hash";--> statement-breakpoint
ALTER TABLE "token_metadata" DROP COLUMN IF EXISTS "block_number";--> statement-breakpoint
ALTER TABLE "token_transactions" DROP COLUMN IF EXISTS "block_hash";--> statement-breakpoint
ALTER TABLE "token_transactions" DROP COLUMN IF EXISTS "block_number";