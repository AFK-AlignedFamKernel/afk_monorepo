import { Module } from '@nestjs/common';
import { LiquidityAddedService } from './liquidity-added.service';

@Module({
  imports: [],
  providers: [LiquidityAddedService],
  exports: [LiquidityAddedService],
})
export class LiquidityAddedModule {}
