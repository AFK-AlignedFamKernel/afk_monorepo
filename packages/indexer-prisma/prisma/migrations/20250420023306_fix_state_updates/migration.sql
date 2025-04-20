/*
  Warnings:

  - You are about to drop the `overall_vote_data` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "overall_vote_data";

-- CreateTable
CREATE TABLE "BaseBlockchainEvent" (
    "id" SERIAL NOT NULL,
    "network" TEXT,
    "block_hash" TEXT,
    "block_number" BIGINT,
    "block_timestamp" TIMESTAMP(6),
    "transaction_hash" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "_cursor" BIGINT,
    "time_stamp" TIMESTAMP(6),
    "version" INTEGER DEFAULT 1,
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "BaseBlockchainEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractState" (
    "id" SERIAL NOT NULL,
    "contract_address" TEXT NOT NULL,
    "network" TEXT,
    "current_epoch_index" TEXT,
    "total_ai_score" INTEGER DEFAULT 0,
    "total_vote_score" INTEGER DEFAULT 0,
    "total_tips" INTEGER DEFAULT 0,
    "total_amount_deposit" INTEGER DEFAULT 0,
    "total_to_claimed" INTEGER DEFAULT 0,
    "percentage_algo_distribution" INTEGER DEFAULT 50,
    "quote_address" TEXT,
    "main_token_address" TEXT,
    "current_epoch_duration" INTEGER DEFAULT 0,
    "current_epoch_start" TIMESTAMP(3),
    "current_epoch_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpochState" (
    "id" SERIAL NOT NULL,
    "epoch_index" TEXT NOT NULL,
    "contract_address" TEXT NOT NULL,
    "total_ai_score" INTEGER DEFAULT 0,
    "total_vote_score" INTEGER DEFAULT 0,
    "total_amount_deposit" INTEGER DEFAULT 0,
    "total_tip" INTEGER DEFAULT 0,
    "amount_claimed" INTEGER DEFAULT 0,
    "amount_vote" INTEGER DEFAULT 0,
    "amount_algo" INTEGER DEFAULT 0,
    "epoch_duration" INTEGER,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EpochState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" SERIAL NOT NULL,
    "nostr_id" TEXT NOT NULL,
    "starknet_address" TEXT,
    "total_ai_score" INTEGER DEFAULT 0,
    "total_tip" INTEGER DEFAULT 0,
    "total_vote_score" INTEGER DEFAULT 0,
    "amount_claimed" INTEGER DEFAULT 0,
    "is_add_by_admin" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEpochState" (
    "id" SERIAL NOT NULL,
    "nostr_id" TEXT NOT NULL,
    "epoch_index" TEXT NOT NULL,
    "contract_address" TEXT NOT NULL,
    "total_tip" INTEGER DEFAULT 0,
    "total_ai_score" INTEGER DEFAULT 0,
    "total_vote_score" INTEGER DEFAULT 0,
    "amount_claimed" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEpochState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ContractStateToUserProfile" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractState_contract_address_key" ON "ContractState"("contract_address");

-- CreateIndex
CREATE INDEX "ContractState_contract_address_idx" ON "ContractState"("contract_address");

-- CreateIndex
CREATE INDEX "ContractState_current_epoch_index_idx" ON "ContractState"("current_epoch_index");

-- CreateIndex
CREATE INDEX "ContractState_main_token_address_idx" ON "ContractState"("main_token_address");

-- CreateIndex
CREATE INDEX "EpochState_epoch_index_idx" ON "EpochState"("epoch_index");

-- CreateIndex
CREATE INDEX "EpochState_contract_address_idx" ON "EpochState"("contract_address");

-- CreateIndex
CREATE INDEX "EpochState_start_time_idx" ON "EpochState"("start_time");

-- CreateIndex
CREATE INDEX "EpochState_end_time_idx" ON "EpochState"("end_time");

-- CreateIndex
CREATE UNIQUE INDEX "EpochState_epoch_index_contract_address_key" ON "EpochState"("epoch_index", "contract_address");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_nostr_id_key" ON "UserProfile"("nostr_id");

-- CreateIndex
CREATE INDEX "UserProfile_nostr_id_idx" ON "UserProfile"("nostr_id");

-- CreateIndex
CREATE INDEX "UserProfile_starknet_address_idx" ON "UserProfile"("starknet_address");

-- CreateIndex
CREATE INDEX "UserEpochState_nostr_id_idx" ON "UserEpochState"("nostr_id");

-- CreateIndex
CREATE INDEX "UserEpochState_epoch_index_idx" ON "UserEpochState"("epoch_index");

-- CreateIndex
CREATE INDEX "UserEpochState_contract_address_idx" ON "UserEpochState"("contract_address");

-- CreateIndex
CREATE UNIQUE INDEX "UserEpochState_nostr_id_epoch_index_contract_address_key" ON "UserEpochState"("nostr_id", "epoch_index", "contract_address");

-- CreateIndex
CREATE UNIQUE INDEX "_ContractStateToUserProfile_AB_unique" ON "_ContractStateToUserProfile"("A", "B");

-- CreateIndex
CREATE INDEX "_ContractStateToUserProfile_B_index" ON "_ContractStateToUserProfile"("B");

-- CreateIndex
CREATE INDEX "epoch_data_contract_address_idx" ON "epoch_data"("contract_address");

-- CreateIndex
CREATE INDEX "epoch_data_epoch_index_idx" ON "epoch_data"("epoch_index");

-- CreateIndex
CREATE INDEX "overall_data_contract_address_idx" ON "overall_data"("contract_address");

-- CreateIndex
CREATE INDEX "overall_data_epoch_index_idx" ON "overall_data"("epoch_index");

-- AddForeignKey
ALTER TABLE "EpochState" ADD CONSTRAINT "EpochState_contract_address_fkey" FOREIGN KEY ("contract_address") REFERENCES "ContractState"("contract_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEpochState" ADD CONSTRAINT "UserEpochState_nostr_id_fkey" FOREIGN KEY ("nostr_id") REFERENCES "UserProfile"("nostr_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEpochState" ADD CONSTRAINT "UserEpochState_epoch_index_contract_address_fkey" FOREIGN KEY ("epoch_index", "contract_address") REFERENCES "EpochState"("epoch_index", "contract_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContractStateToUserProfile" ADD CONSTRAINT "_ContractStateToUserProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "ContractState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContractStateToUserProfile" ADD CONSTRAINT "_ContractStateToUserProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
