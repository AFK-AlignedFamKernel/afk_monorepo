import { Module } from '@nestjs/common';
import { SellTokenService } from './sell-token.service';

@Module({
  imports: [],
  providers: [SellTokenService],
  exports: [SellTokenService],
})
export class SellTokenModule {}
