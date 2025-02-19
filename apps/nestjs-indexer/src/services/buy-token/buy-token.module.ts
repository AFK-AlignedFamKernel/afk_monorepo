import { Module } from '@nestjs/common';
import { BuyTokenService } from './buy-token.service';
import { CandleSticksModule } from '../candlestick/candlesticks.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [CandleSticksModule, EventEmitterModule.forRoot()],
  providers: [BuyTokenService],
  exports: [BuyTokenService],
})
export class BuyTokenModule {}
