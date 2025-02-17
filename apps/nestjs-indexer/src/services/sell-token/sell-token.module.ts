import { Module } from '@nestjs/common';
import { SellTokenService } from './sell-token.service';
import { CandleSticksModule } from '../candlestick/candlesticks.module';

@Module({
  imports: [CandleSticksModule],
  providers: [SellTokenService],
  exports: [SellTokenService],
})
export class SellTokenModule {}
