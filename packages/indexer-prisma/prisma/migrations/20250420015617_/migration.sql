-- AlterTable
ALTER TABLE "IndexerStats" ALTER COLUMN "lastBlockScraped" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "token_deploy" ADD COLUMN     "github" TEXT,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "nostr_event_id" TEXT,
ADD COLUMN     "telegram" TEXT,
ADD COLUMN     "twitter" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "token_launch" ADD COLUMN     "description" TEXT,
ADD COLUMN     "github" TEXT,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "ipfs_hash" TEXT,
ADD COLUMN     "ipfs_metadata_url" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "nostr_event_id" TEXT,
ADD COLUMN     "nostr_id" TEXT,
ADD COLUMN     "telegram" TEXT,
ADD COLUMN     "twitter" TEXT,
ADD COLUMN     "url" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "token_metadata" ADD COLUMN     "nostr_event_id" TEXT;

-- CreateTable
CREATE TABLE "overall_data" (
    "transaction_hash" TEXT NOT NULL,
    "network" TEXT,
    "epoch_index" TEXT,
    "block_hash" TEXT,
    "block_number" BIGINT,
    "starknet_address" TEXT,
    "block_timestamp" TIMESTAMP(6),
    "_cursor" BIGINT,
    "time_stamp" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "last_deposit_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "amount_claimed" INTEGER DEFAULT 0,
    "amount_vote" INTEGER DEFAULT 0,
    "amount_algo" INTEGER DEFAULT 0,
    "total_ai_score" INTEGER DEFAULT 0,
    "total_vote_score" INTEGER DEFAULT 0,
    "total_tips" INTEGER DEFAULT 0,
    "total_to_claimed" INTEGER DEFAULT 0,
    "total_amount_deposit" INTEGER DEFAULT 0,
    "percentage_algo_distribution" INTEGER DEFAULT 50,
    "quote_address" TEXT,
    "main_token_address" TEXT,
    "end_duration" TIMESTAMP(3),
    "start_duration" TIMESTAMP(3),
    "epoch_duration" INTEGER DEFAULT 0,
    "contract_address" TEXT NOT NULL,

    CONSTRAINT "overall_data_pkey" PRIMARY KEY ("contract_address")
);

-- CreateTable
CREATE TABLE "epoch_data" (
    "transaction_hash" TEXT NOT NULL,
    "network" TEXT,
    "epoch_index" TEXT NOT NULL,
    "total_ai_score" INTEGER DEFAULT 0,
    "total_vote_score" INTEGER DEFAULT 0,
    "total_amount_deposit" INTEGER DEFAULT 0,
    "block_hash" TEXT,
    "block_number" BIGINT,
    "starknet_address" TEXT,
    "block_timestamp" TIMESTAMP(6),
    "_cursor" BIGINT,
    "time_stamp" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "last_deposit_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "amount_claimed" INTEGER DEFAULT 0,
    "amount_algo" INTEGER DEFAULT 0,
    "amount_vote" INTEGER DEFAULT 0,
    "end_duration" TIMESTAMP(3),
    "epoch_duration" INTEGER,
    "main_token_address" TEXT,
    "percentage_algo_distribution" INTEGER,
    "quote_address" TEXT,
    "start_duration" TIMESTAMP(3),
    "total_tip" INTEGER DEFAULT 0,
    "contract_address" TEXT,

    CONSTRAINT "epoch_data_pkey" PRIMARY KEY ("epoch_index")
);

-- CreateTable
CREATE TABLE "profile_data" (
    "transaction_hash" TEXT,
    "network" TEXT,
    "block_hash" TEXT,
    "block_number" BIGINT,
    "starknet_address" TEXT,
    "block_timestamp" TIMESTAMP(6),
    "nostr_id" TEXT NOT NULL,
    "_cursor" BIGINT,
    "time_stamp" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "nostr_event_id" TEXT,
    "total_ai_score" INTEGER DEFAULT 0,
    "total_tip" INTEGER DEFAULT 0,
    "total_vote_score" INTEGER DEFAULT 0,
    "amount_claimed" INTEGER DEFAULT 0,
    "is_add_by_admin" BOOLEAN DEFAULT false,

    CONSTRAINT "profile_data_pkey" PRIMARY KEY ("nostr_id")
);

-- CreateTable
CREATE TABLE "profile_data_per_epoch" (
    "id" SERIAL NOT NULL,
    "nostr_id" TEXT NOT NULL,
    "epoch_index" INTEGER NOT NULL,
    "transaction_hash" TEXT,
    "network" TEXT,
    "block_hash" TEXT,
    "block_number" BIGINT,
    "starknet_address" TEXT,
    "block_timestamp" TIMESTAMP(6),
    "_cursor" BIGINT,
    "time_stamp" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "nostr_event_id" TEXT,
    "total_tip" INTEGER DEFAULT 0,
    "total_ai_score" INTEGER DEFAULT 0,
    "total_vote_score" INTEGER DEFAULT 0,
    "amount_claimed" INTEGER DEFAULT 0,

    CONSTRAINT "profile_data_per_epoch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overall_vote_data" (
    "transaction_hash" TEXT NOT NULL,
    "network" TEXT,
    "epoch_index" TEXT,
    "total_ai_score" INTEGER DEFAULT 0,
    "total_vote_score" INTEGER DEFAULT 0,
    "total_amount_deposit" INTEGER DEFAULT 0,
    "block_hash" TEXT,
    "block_number" BIGINT,
    "starknet_address" TEXT,
    "block_timestamp" TIMESTAMP(6),
    "_cursor" BIGINT,
    "time_stamp" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "last_deposit_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "amount_claimed" INTEGER DEFAULT 0,
    "amount_vote" INTEGER DEFAULT 0,
    "amount_algo" INTEGER DEFAULT 0,
    "percentage_algo_distribution" INTEGER DEFAULT 50,
    "quote_address" TEXT,
    "main_token_address" TEXT,
    "end_duration" TIMESTAMP(3),
    "start_duration" TIMESTAMP(3),
    "epoch_duration" INTEGER,

    CONSTRAINT "overall_vote_data_pkey" PRIMARY KEY ("transaction_hash")
);

-- AddForeignKey
ALTER TABLE "epoch_data" ADD CONSTRAINT "epoch_data_epoch_index_fkey" FOREIGN KEY ("epoch_index") REFERENCES "overall_data"("contract_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_data_per_epoch" ADD CONSTRAINT "profile_data_per_epoch_nostr_id_fkey" FOREIGN KEY ("nostr_id") REFERENCES "profile_data"("nostr_id") ON DELETE RESTRICT ON UPDATE CASCADE;
