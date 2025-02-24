/*
  Warnings:

  - A unique constraint covering the columns `[token_address,interval_minutes,timestamp]` on the table `candlesticks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "candlesticks_token_address_interval_minutes_timestamp_key" ON "candlesticks"("token_address", "interval_minutes", "timestamp");
