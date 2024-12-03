import { Module } from '@nestjs/common';
import { BuyTokenService } from './buy-token.service';

@Module({
  imports: [],
  providers: [BuyTokenService],
  exports: [BuyTokenService],
})
export class BuyTokenModule {}
