import { Module } from '@nestjs/common';
import { LiquidityCreatedService } from './liquidity-created.service';

@Module({
  imports: [],
  providers: [LiquidityCreatedService],
  exports: [LiquidityCreatedService],
})
export class LiquidityAddedModule {}
