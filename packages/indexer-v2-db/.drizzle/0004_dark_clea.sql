ALTER TABLE "token_deploy" ALTER COLUMN "block_number" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "token_launch" ALTER COLUMN "block_number" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "token_metadata" ALTER COLUMN "block_number" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "token_transactions" ALTER COLUMN "block_number" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "token_launch" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "token_launch" ADD COLUMN "symbol" text;