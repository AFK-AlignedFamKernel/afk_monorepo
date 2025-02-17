-- CreateTable
CREATE TABLE "token_deploy" (
    "transaction_hash" TEXT NOT NULL,
    "network" TEXT,
    "block_hash" TEXT,
    "block_number" BIGINT,
    "block_timestamp" TIMESTAMP(6),
    "memecoin_address" TEXT,
    "owner_address" TEXT,
    "name" TEXT,
    "symbol" TEXT,
    "initial_supply" TEXT,
    "total_supply" TEXT,
    "_cursor" BIGINT,
    "time_stamp" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_launched" BOOLEAN,

    CONSTRAINT "token_deploy_pkey" PRIMARY KEY ("transaction_hash")
);

-- CreateTable
CREATE TABLE "token_launch" (
    "transaction_hash" TEXT NOT NULL,
    "network" TEXT,
    "block_hash" TEXT,
    "owner_address" TEXT,
    "block_number" BIGINT,
    "block_timestamp" TIMESTAMP(6),
    "memecoin_address" TEXT,
    "quote_token" TEXT,
    "exchange_name" TEXT,
    "total_supply" TEXT,
    "threshold_liquidity" TEXT,
    "current_supply" TEXT,
    "liquidity_raised" TEXT,
    "is_liquidity_added" BOOLEAN,
    "total_token_holded" TEXT,
    "price" TEXT,
    "bonding_type" TEXT,
    "_cursor" BIGINT,
    "time_stamp" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "initial_pool_supply_dex" TEXT,

    CONSTRAINT "token_launch_pkey" PRIMARY KEY ("transaction_hash")
);

-- CreateTable
CREATE TABLE "unrugmeme_deploy" (
    "network" TEXT,
    "block_hash" TEXT,
    "block_number" BIGINT,
    "block_timestamp" TIMESTAMP(6),
    "transaction_hash" TEXT,
    "memecoin_address" TEXT NOT NULL,
    "owner_address" TEXT,
    "name" TEXT,
    "symbol" TEXT,
    "initial_supply" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "_cursor" BIGINT,

    CONSTRAINT "unrugmeme_deploy_pkey" PRIMARY KEY ("memecoin_address")
);

-- CreateTable
CREATE TABLE "unrugmeme_launch" (
    "network" TEXT,
    "block_hash" TEXT,
    "block_number" BIGINT,
    "block_timestamp" TIMESTAMP(6),
    "transaction_hash" TEXT,
    "memecoin_address" TEXT NOT NULL,
    "quote_token" TEXT,
    "exchange_name" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "_cursor" BIGINT,

    CONSTRAINT "unrugmeme_launch_pkey" PRIMARY KEY ("memecoin_address")
);

-- CreateTable
CREATE TABLE "unrugmeme_transfers" (
    "network" TEXT,
    "block_hash" TEXT,
    "block_number" BIGINT,
    "block_timestamp" TIMESTAMP(6),
    "transaction_hash" TEXT,
    "transfer_id" TEXT NOT NULL,
    "from_address" TEXT,
    "to_address" TEXT,
    "memecoin_address" TEXT,
    "amount" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "_cursor" BIGINT,

    CONSTRAINT "unrugmeme_transfers_pkey" PRIMARY KEY ("transfer_id")
);

-- CreateTable
CREATE TABLE "token_transactions" (
    "transfer_id" TEXT NOT NULL,
    "network" TEXT,
    "block_hash" TEXT,
    "block_number" BIGINT,
    "block_timestamp" TIMESTAMP(6),
    "transaction_hash" TEXT,
    "memecoin_address" TEXT,
    "owner_address" TEXT,
    "last_price" TEXT,
    "quote_amount" TEXT,
    "coin_received" TEXT,
    "initial_supply" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "total_supply" TEXT,
    "current_supply" TEXT,
    "liquidity_raised" TEXT,
    "price" TEXT,
    "protocol_fee" TEXT,
    "amount" DECIMAL,
    "_cursor" BIGINT,
    "transaction_type" TEXT NOT NULL,
    "time_stamp" TIMESTAMP(6),

    CONSTRAINT "token_transactions_pkey" PRIMARY KEY ("transfer_id")
);

-- CreateTable
CREATE TABLE "renew_subscription" (
    "owner_address" TEXT,
    "network" TEXT,
    "block_hash" TEXT,
    "block_number" BIGINT,
    "block_timestamp" TIMESTAMP(6),
    "transaction_hash" TEXT NOT NULL,
    "name" TEXT,
    "old_name" TEXT,
    "paid" TEXT,
    "quote_address" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "_cursor" BIGINT,
    "time_stamp" TEXT,

    CONSTRAINT "renew_subscription_pkey" PRIMARY KEY ("transaction_hash")
);

-- CreateTable
CREATE TABLE "username_changed" (
    "owner_address" TEXT,
    "network" TEXT,
    "block_hash" TEXT,
    "block_number" BIGINT,
    "block_timestamp" TIMESTAMP(6),
    "transaction_hash" TEXT NOT NULL,
    "name" TEXT,
    "old_name" TEXT,
    "paid" TEXT,
    "quote_address" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "_cursor" BIGINT,
    "time_stamp" TEXT,

    CONSTRAINT "username_changed_pkey" PRIMARY KEY ("transaction_hash")
);

-- CreateTable
CREATE TABLE "username_claimed" (
    "owner_address" TEXT,
    "network" TEXT,
    "block_hash" TEXT,
    "block_number" BIGINT,
    "block_timestamp" TIMESTAMP(6),
    "transaction_hash" TEXT NOT NULL,
    "expiry" TIMESTAMP(6),
    "username" TEXT,
    "name" TEXT,
    "symbol" TEXT,
    "paid" TEXT,
    "quote_address" TEXT,
    "_cursor" BIGINT,
    "time_stamp" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "username_claimed_pkey" PRIMARY KEY ("transaction_hash")
);

-- CreateTable
CREATE TABLE "shares_token_user" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "token_address" TEXT NOT NULL,
    "amount_owned" DECIMAL DEFAULT 0,
    "is_claimable" BOOLEAN DEFAULT false,
    "amount_claimed" DECIMAL DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shares_token_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tip_deposit" (
    "network" TEXT,
    "block_hash" TEXT,
    "block_number" BIGINT,
    "block_timestamp" TIMESTAMP(6),
    "transaction_hash" TEXT,
    "deposit_id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "nostr_recipient" TEXT NOT NULL,
    "starknet_recipient" TEXT,
    "token_address" TEXT NOT NULL,
    "amount" DECIMAL,
    "gas_amount" DECIMAL,
    "gas_token_address" TEXT,
    "is_cancelled" BOOLEAN NOT NULL DEFAULT false,
    "is_claimed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "tip_deposit_pkey" PRIMARY KEY ("deposit_id")
);

-- CreateTable
CREATE TABLE "tip_transfer" (
    "network" TEXT,
    "block_hash" TEXT,
    "block_number" BIGINT,
    "block_timestamp" TIMESTAMP(6),
    "transaction_hash" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "nostr_recipient" TEXT NOT NULL,
    "starknet_recipient" TEXT,
    "token_address" TEXT NOT NULL,
    "amount" DECIMAL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "tip_transfer_pkey" PRIMARY KEY ("transaction_hash")
);

-- CreateTable
CREATE TABLE "IndexerStats" (
    "id" SERIAL NOT NULL,
    "lastBlockScraped" INTEGER NOT NULL,
    "lastTx" TEXT NOT NULL,
    "lastTimestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexerStats_pkey" PRIMARY KEY ("id")
);
