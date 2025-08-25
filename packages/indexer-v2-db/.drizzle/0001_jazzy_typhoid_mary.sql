ALTER TABLE "token_deploy" DROP CONSTRAINT "token_deploy_transaction_hash_unique";--> statement-breakpoint
ALTER TABLE "token_deploy" ADD PRIMARY KEY ("transaction_hash");--> statement-breakpoint
ALTER TABLE "token_deploy" ALTER COLUMN "transaction_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "token_deploy" DROP COLUMN IF EXISTS "id";