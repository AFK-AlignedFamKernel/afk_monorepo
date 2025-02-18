import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CandlestickService {
  private readonly logger = new Logger(CandlestickService.name);

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Generate candlestick data for a specific token and time interval.
   * @param tokenAddress - The token address.
   * @param intervalMinutes - The time interval in minutes (e.g., 1, 5, 15, 60).
   */
  async generateCandles(tokenAddress: string, intervalMinutes: number) {
    const intervalMs = intervalMinutes * 60 * 1000;
    const priceData = await this.prismaService.token_transactions.findMany({
      where: { memecoin_address: tokenAddress },
      orderBy: { time_stamp: 'asc' },
    });

    if (priceData.length === 0) {
      this.logger.warn(`No price data found for token ${tokenAddress}`);
      return;
    }

    const candles = [];
    let currentIntervalStart = this.getIntervalStart(
      priceData[0].time_stamp,
      intervalMs,
    );
    let currentCandle = {
      open: Number(priceData[0].price),
      high: Number(priceData[0].price),
      low: Number(priceData[0].price),
      close: Number(priceData[0].price),
      hasValidData: true,
    };

    for (const data of priceData) {
      const price = Number(data.price);
      const timestamp = data.time_stamp.getTime();

      if (timestamp >= currentIntervalStart + intervalMs) {
        if (currentCandle.hasValidData) {
          candles.push({
            token_address: tokenAddress,
            interval_minutes: intervalMinutes,
            open: currentCandle.open,
            close: currentCandle.close,
            high: currentCandle.high,
            low: currentCandle.low,
            timestamp: new Date(currentIntervalStart),
          });
        }

        currentIntervalStart = this.getIntervalStart(
          data.time_stamp,
          intervalMs,
        );
        currentCandle = {
          open: price,
          high: price,
          low: price,
          close: price,
          hasValidData: this.isValidPrice(price),
        };
      } else {
        if (this.isValidPrice(price)) {
          if (!currentCandle.hasValidData) {
            currentCandle = {
              open: price,
              high: price,
              low: price,
              close: price,
              hasValidData: true,
            };
          } else {
            currentCandle.high = Math.max(currentCandle.high, price);
            currentCandle.low = Math.min(currentCandle.low, price);
            currentCandle.close = price;
          }
        }
      }
    }

    if (currentCandle.hasValidData) {
      candles.push({
        token_address: tokenAddress,
        interval_minutes: intervalMinutes,
        open: currentCandle.open,
        close: currentCandle.close,
        high: currentCandle.high,
        low: currentCandle.low,
        timestamp: new Date(currentIntervalStart),
      });
    }

    if (candles.length > 0) {
      await this.prismaService.candlesticks.createMany({
        data: candles,
      });
      this.logger.log(
        `Generated ${candles.length} candles for token ${tokenAddress}`,
      );
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
