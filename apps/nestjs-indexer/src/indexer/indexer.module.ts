import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { TokenLaunchIndexer } from './token-launch.indexer';
import { BuyTokenIndexer } from './buy-token.indexer';
import { SellTokenIndexer } from './sell-token.indexer';
import { TokenLaunchModule } from 'src/services/token-launch/token-launch.module';
import { BuyTokenModule } from 'src/services/buy-token/buy-token.module';
import { SellTokenModule } from 'src/services/sell-token/sell-token.module';

@Module({
  imports: [TokenLaunchModule, BuyTokenModule, SellTokenModule],
  providers: [
    TokenLaunchIndexer,
    BuyTokenIndexer,
    SellTokenIndexer,
    IndexerService,
  ],
  exports: [TokenLaunchIndexer, BuyTokenIndexer, SellTokenIndexer],
})
export class IndexerModule {}
