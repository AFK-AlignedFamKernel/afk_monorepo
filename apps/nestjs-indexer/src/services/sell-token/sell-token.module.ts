import { Module } from '@nestjs/common';
import { SellTokenService } from './sell-token.service';
import { CandleSticksModule } from '../candlestick/candlesticks.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [CandleSticksModule, EventEmitterModule.forRoot()],
  providers: [SellTokenService],
  exports: [SellTokenService],
})
export class SellTokenModule {}
