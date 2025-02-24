/*
  Warnings:

  - The primary key for the `candlesticks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `candlesticks` table. All the data in the column will be lost.
  - You are about to alter the column `open` on the `candlesticks` table. The data in that column could be lost. The data in that column will be cast from `Decimal(30,18)` to `DoublePrecision`.
  - You are about to alter the column `close` on the `candlesticks` table. The data in that column could be lost. The data in that column will be cast from `Decimal(30,18)` to `DoublePrecision`.
  - You are about to alter the column `high` on the `candlesticks` table. The data in that column could be lost. The data in that column will be cast from `Decimal(30,18)` to `DoublePrecision`.
  - You are about to alter the column `low` on the `candlesticks` table. The data in that column could be lost. The data in that column will be cast from `Decimal(30,18)` to `DoublePrecision`.
  - Made the column `created_at` on table `candlesticks` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "candlesticks_interval_minutes_idx";

-- DropIndex
DROP INDEX "candlesticks_timestamp_idx";

-- DropIndex
DROP INDEX "candlesticks_token_address_idx";

-- AlterTable
ALTER TABLE "candlesticks" DROP CONSTRAINT "candlesticks_pkey",
DROP COLUMN "id",
ALTER COLUMN "open" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "close" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "high" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "low" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "candlesticks_pkey" PRIMARY KEY ("token_address", "interval_minutes", "timestamp");
