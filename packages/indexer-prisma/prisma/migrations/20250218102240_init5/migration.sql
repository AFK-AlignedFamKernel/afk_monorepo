-- AlterTable
ALTER TABLE "token_launch" ADD COLUMN     "market_cap" TEXT;

-- CreateTable
CREATE TABLE "token_metadata" (
    "transaction_hash" TEXT NOT NULL,
    "network" TEXT,
    "block_hash" TEXT,
    "block_number" BIGINT,
    "contract_address" TEXT,
    "block_timestamp" TIMESTAMP(6),
    "memecoin_address" TEXT,
    "url" TEXT,
    "nostr_id" TEXT,
    "name" TEXT,
    "symbol" TEXT,
    "_cursor" BIGINT,
    "time_stamp" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_metadata_pkey" PRIMARY KEY ("transaction_hash")
);
