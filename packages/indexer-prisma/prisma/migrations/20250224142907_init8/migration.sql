/*
  Warnings:

  - The primary key for the `candlesticks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `open` on the `candlesticks` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(30,18)`.
  - You are about to alter the column `close` on the `candlesticks` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(30,18)`.
  - You are about to alter the column `high` on the `candlesticks` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(30,18)`.
  - You are about to alter the column `low` on the `candlesticks` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(30,18)`.

*/
-- AlterTable
ALTER TABLE "candlesticks" DROP CONSTRAINT "candlesticks_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "open" SET DATA TYPE DECIMAL(30,18),
ALTER COLUMN "close" SET DATA TYPE DECIMAL(30,18),
ALTER COLUMN "high" SET DATA TYPE DECIMAL(30,18),
ALTER COLUMN "low" SET DATA TYPE DECIMAL(30,18),
ALTER COLUMN "created_at" DROP NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(6),
ADD CONSTRAINT "candlesticks_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "candlesticks_token_address_idx" ON "candlesticks"("token_address");

-- CreateIndex
CREATE INDEX "candlesticks_timestamp_idx" ON "candlesticks"("timestamp");

-- CreateIndex
CREATE INDEX "candlesticks_interval_minutes_idx" ON "candlesticks"("interval_minutes");
