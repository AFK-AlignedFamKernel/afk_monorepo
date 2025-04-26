import { Module } from '@nestjs/common';
import { NostrInfofiService } from './nostr-infofi.service';

@Module({
  imports: [],
  providers: [NostrInfofiService],
  exports: [NostrInfofiService],
})
export class NostrInfofiModule {}
