import { db } from 'indexer-v2-db';
import { candlesticks, tokenTransactions } from 'indexer-v2-db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Generate candlestick data for a specific token at predefined intervals (5, 10, 60 minutes).
 * This function is designed to be non-blocking and should be called asynchronously.
 * @param tokenAddress - The token address.
 */
export const generateCandlesticks = async (tokenAddress: string): Promise<void> => {
  try {
    console.log(`Starting candlestick generation for token: ${tokenAddress}`);
    
    const intervals = [5, 10, 60];

    // Fetch all transactions for the token, ordered by timestamp
    const transactions = await db
      .select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.memecoin_address, tokenAddress))
      .orderBy(tokenTransactions.time_stamp);

    if (transactions.length === 0) {
      console.log(`No transactions found for token ${tokenAddress}`);
      return;
    }

    console.log(`Found ${transactions.length} transactions for token ${tokenAddress}`);

    const candlesByInterval: Record<number, any[]> = {};
    intervals.forEach((interval) => (candlesByInterval[interval] = []));

    // Generate candlesticks for each interval
    for (const interval of intervals) {
      let currentCandle = null;
      const intervalMs = interval * 60 * 1000;

      for (const transaction of transactions) {
        const price = Number(transaction.price);
        if (!isValidPrice(price)) continue;

        const intervalStart = getIntervalStart(
          transaction.time_stamp || new Date(),
          intervalMs,
        );

        if (
          !currentCandle ||
          currentCandle.timestamp.getTime() !== intervalStart
        ) {
          if (currentCandle) {
            candlesByInterval[interval].push(currentCandle);
          }

          currentCandle = {
            token_address: tokenAddress,
            interval_minutes: interval,
            open: price.toString(),
            high: price.toString(),
            low: price.toString(),
            close: price.toString(),
            timestamp: new Date(intervalStart),
          };
        } else {
          currentCandle.high = Math.max(Number(currentCandle.high), price).toString();
          currentCandle.low = Math.min(Number(currentCandle.low), price).toString();
          currentCandle.close = price.toString();
        }
      }

      if (currentCandle) {
        candlesByInterval[interval].push(currentCandle);
      }
    }

    // Save candlesticks to database
    for (const interval of intervals) {
      const candles = candlesByInterval[interval];
      if (candles.length > 0) {
        for (const candle of candles) {
          try {
            await db
              .insert(candlesticks)
              .values({
                token_address: candle.token_address,
                interval_minutes: candle.interval_minutes,
                timestamp: candle.timestamp,
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
              })
              .onConflictDoUpdate({
                target: [candlesticks.token_address, candlesticks.interval_minutes, candlesticks.timestamp],
                set: {
                  open: candle.open,
                  high: candle.high,
                  low: candle.low,
                  close: candle.close,
                  updated_at: new Date(),
                },
              });
          } catch (error) {
            console.error(`Error upserting candlestick for interval ${interval}:`, error);
          }
        }

        console.log(
          `Generated ${candles.length} candles for token ${tokenAddress} at ${interval}m interval`,
        );
      }
    }
  } catch (error) {
    console.error(`Error generating candlesticks for token ${tokenAddress}:`, error);
  }
};

/**
 * Non-blocking candlestick generation that runs in the background
 * @param tokenAddress - The token address.
 */
export const generateCandlesticksAsync = (tokenAddress: string): void => {
  // Fire and forget - don't await to prevent blocking the indexer
  generateCandlesticks(tokenAddress).catch(error => {
    console.error(`Async candlestick generation failed for token ${tokenAddress}:`, error);
  });
};

/**
 * Check if a price value is valid for database storage.
 * @param value - The number to validate.
 * @returns boolean indicating if the value is valid
 */
const isValidPrice = (value: number): boolean => {
  return Number.isFinite(value) && value > 0;
};

/**
 * Get the start of the interval for a given timestamp.
 * @param timestamp - The timestamp to align.
 * @param intervalMs - The interval duration in milliseconds.
 */
const getIntervalStart = (timestamp: Date, intervalMs: number): number => {
  return Math.floor(timestamp.getTime() / intervalMs) * intervalMs;
};