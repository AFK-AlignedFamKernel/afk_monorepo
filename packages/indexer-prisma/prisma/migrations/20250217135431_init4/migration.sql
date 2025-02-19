-- CreateTable
CREATE TABLE "candlesticks" (
    "id" SERIAL NOT NULL,
    "token_address" TEXT NOT NULL,
    "interval_minutes" INTEGER NOT NULL,
    "open" DECIMAL(30,18) NOT NULL,
    "close" DECIMAL(30,18) NOT NULL,
    "high" DECIMAL(30,18) NOT NULL,
    "low" DECIMAL(30,18) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candlesticks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "candlesticks_token_address_idx" ON "candlesticks"("token_address");

-- CreateIndex
CREATE INDEX "candlesticks_timestamp_idx" ON "candlesticks"("timestamp");

-- CreateIndex
CREATE INDEX "candlesticks_interval_minutes_idx" ON "candlesticks"("interval_minutes");
