import { Module } from '@nestjs/common';
import { TipService } from './tip.service';

@Module({
  imports: [],
  providers: [TipService],
  exports: [TipService],
})
export class TipServiceModule {}
