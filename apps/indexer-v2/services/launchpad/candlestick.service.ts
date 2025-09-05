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
    
    // Debug: Log first few transactions to understand the structure
    if (transactions.length > 0) {
      console.log("Sample transactions:", transactions.slice(0, 3).map(t => ({
        transfer_id: t.transfer_id,
        price: t.price,
        transaction_type: t.transaction_type,
        time_stamp: t.time_stamp,
        amount: t.amount
      })));
    }

    const candlesByInterval: Record<number, any[]> = {};
    intervals.forEach((interval) => (candlesByInterval[interval] = []));

    // Generate candlesticks for each interval
    for (const interval of intervals) {
      let currentCandle = null;
      const intervalMs = interval * 60 * 1000;
      let validTransactionsCount = 0;

      for (const transaction of transactions) {
        let price: number;
        
        // Try to get price from different sources
        if (transaction.price && transaction.price !== null && transaction.price !== undefined) {
          price = Number(transaction.price);
        } else if (transaction.last_price && transaction.last_price !== null && transaction.last_price !== undefined) {
          price = Number(transaction.last_price);
          console.log("Using last_price as fallback:", transaction.last_price);
        } else if (transaction.quote_amount && transaction.amount && 
                   transaction.quote_amount !== '0' && transaction.amount !== '0') {
          // Calculate price from quote_amount / amount
          const quoteAmount = Number(transaction.quote_amount);
          const amount = Number(transaction.amount);
          if (amount > 0) {
            price = quoteAmount / amount;
            console.log("Calculated price from quote_amount/amount:", price);
          } else {
            console.log("Skipping transaction with zero amount:", transaction.transfer_id);
            continue;
          }
        } else {
          console.log("Skipping transaction with no valid price data:", {
            transfer_id: transaction.transfer_id,
            price: transaction.price,
            last_price: transaction.last_price,
            quote_amount: transaction.quote_amount,
            amount: transaction.amount
          });
          continue;
        }

        console.log("Processing transaction:", {
          transfer_id: transaction.transfer_id,
          price: price,
          raw_price: transaction.price,
          last_price: transaction.last_price,
          transaction_type: transaction.transaction_type,
          timestamp: transaction.time_stamp
        });
        
        if (!isValidPrice(price)) {
          console.log("Price is not valid:", {
            price: price,
            raw_price: transaction.price,
            transfer_id: transaction.transfer_id
          });
          continue;
        }

        validTransactionsCount++;

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

      console.log(`Interval ${interval}m: Processed ${validTransactionsCount} valid transactions out of ${transactions.length} total`);
    }

    console.log("candlesByInterval", candlesByInterval);
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
  // Allow 0 prices as they might be valid in certain trading scenarios
  // Only reject NaN, Infinity, or negative values
  return Number.isFinite(value) && value >= 0;
};

/**
 * Get the start of the interval for a given timestamp.
 * @param timestamp - The timestamp to align.
 * @param intervalMs - The interval duration in milliseconds.
 */
const getIntervalStart = (timestamp: Date, intervalMs: number): number => {
  return Math.floor(timestamp.getTime() / intervalMs) * intervalMs;
};