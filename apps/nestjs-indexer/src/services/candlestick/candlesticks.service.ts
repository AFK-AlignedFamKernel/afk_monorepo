import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CandlestickService {
  private readonly logger = new Logger(CandlestickService.name);

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Generate candlestick data for a specific token at predefined intervals (5, 10, 60 minutes).
   * @param tokenAddress - The token address.
   */
  async generateCandles(tokenAddress: string) {
    const intervals = [5, 10, 60];

    const transactions = await this.prismaService.token_transactions.findMany({
      where: { memecoin_address: tokenAddress },
      orderBy: { time_stamp: 'asc' },
    });

    if (transactions.length === 0) {
      this.logger.warn(`No transactions found for token ${tokenAddress}`);
      return;
    }

    const candlesByInterval: Record<number, any[]> = {};
    intervals.forEach((interval) => (candlesByInterval[interval] = []));

    for (const interval of intervals) {
      let currentCandle = null;
      const intervalMs = interval * 60 * 1000;

      for (const transaction of transactions) {
        const price = Number(transaction.price);
        if (!this.isValidPrice(price)) continue;

        const intervalStart = this.getIntervalStart(
          transaction.time_stamp,
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
            open: price,
            high: price,
            low: price,
            close: price,
            timestamp: new Date(intervalStart),
          };
        } else {
          currentCandle.high = Math.max(currentCandle.high, price);
          currentCandle.low = Math.min(currentCandle.low, price);
          currentCandle.close = price;
        }
      }

      if (currentCandle) {
        candlesByInterval[interval].push(currentCandle);
      }
    }

    for (const interval of intervals) {
      const candles = candlesByInterval[interval];
      if (candles.length > 0) {
        for (const candle of candles) {
          await this.prismaService.candlesticks.upsert({
            where: {
              token_address_interval_minutes_timestamp: {
                token_address: candle.token_address,
                interval_minutes: candle.interval_minutes,
                timestamp: candle.timestamp,
              },
            },
            update: {
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
            },
            create: candle,
          });
        }

        this.logger.log(
          `Generated ${candles.length} candles for token ${tokenAddress} at ${interval}m interval`,
        );
      }
    }
  }

  /**
   * Check if a price value is valid for database storage.
   * @param value - The number to validate.
   * @returns boolean indicating if the value is valid
   */
  private isValidPrice(value: number): boolean {
    return Number.isFinite(value) && value > 0;
  }

  /**
   * Get the start of the interval for a given timestamp.
   * @param timestamp - The timestamp to align.
   * @param intervalMs - The interval duration in milliseconds.
   */
  private getIntervalStart(timestamp: Date, intervalMs: number): number {
    return Math.floor(timestamp.getTime() / intervalMs) * intervalMs;
  }
}
