import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { BuyTokenIndexer } from './buy-token.indexer';
import { TokenLaunchIndexer } from './token-launch.indexer';
import { BuyTokenModule } from 'src/services/buy-token/buy-token.module';
import { TokenLaunchModule } from 'src/services/token-launch/token-launch.module';

@Module({
  imports: [TokenLaunchModule, BuyTokenModule],
  providers: [TokenLaunchIndexer, BuyTokenIndexer, IndexerService],
  exports: [TokenLaunchIndexer, BuyTokenIndexer],
})
export class IndexerModule {}
