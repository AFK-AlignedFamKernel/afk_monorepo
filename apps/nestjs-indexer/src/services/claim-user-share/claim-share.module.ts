import { Module } from '@nestjs/common';
import { ClaimUserShareService } from './claim-share.service';

@Module({
  imports: [],
  providers: [ClaimUserShareService],
  exports: [ClaimUserShareService],
})
export class ClaimUserShareModule {}
