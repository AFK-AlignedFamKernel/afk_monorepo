import { Module } from '@nestjs/common';
import { CandlestickService } from './candlesticks.service';

@Module({
  imports: [],
  providers: [CandlestickService],
  exports: [CandlestickService],
})
export class CandleSticksModule {}
