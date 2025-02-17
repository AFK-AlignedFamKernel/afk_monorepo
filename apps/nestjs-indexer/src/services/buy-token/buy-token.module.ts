import { Module } from '@nestjs/common';
import { BuyTokenService } from './buy-token.service';
import { CandleSticksModule } from '../candlestick/candlesticks.module';

@Module({
  imports: [CandleSticksModule],
  providers: [BuyTokenService],
  exports: [BuyTokenService],
})
export class BuyTokenModule {}
