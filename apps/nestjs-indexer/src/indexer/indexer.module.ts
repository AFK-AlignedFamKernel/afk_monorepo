import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { BuyTokenIndexer } from './buy-token.indexer';
import { BuyTokenModule } from 'src/services/buy-token/buy-token.module';

@Module({
  imports: [BuyTokenModule],
  providers: [BuyTokenIndexer, IndexerService],
  exports: [BuyTokenIndexer],
})
export class IndexerModule {}
