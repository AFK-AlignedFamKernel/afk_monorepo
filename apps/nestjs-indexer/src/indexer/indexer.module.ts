import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { TokenLaunchIndexer } from './token-launch.indexer';
import { DeployTokenIndexer } from './deploy-token.indexer';
import { BuyTokenIndexer } from './buy-token.indexer';
import { SellTokenIndexer } from './sell-token.indexer';
import { TokenLaunchModule } from 'src/services/token-launch/token-launch.module';
import { DeployTokenModule } from 'src/services/deploy-token/deploy-token.module';
import { BuyTokenModule } from 'src/services/buy-token/buy-token.module';
import { SellTokenModule } from 'src/services/sell-token/sell-token.module';

@Module({
  imports: [
    TokenLaunchModule,
    DeployTokenModule,
    BuyTokenModule,
    SellTokenModule,
  ],
  providers: [
    TokenLaunchIndexer,
    DeployTokenIndexer,
    BuyTokenIndexer,
    SellTokenIndexer,
    IndexerService,
  ],
  exports: [
    TokenLaunchIndexer,
    DeployTokenIndexer,
    BuyTokenIndexer,
    SellTokenIndexer,
  ],
})
export class IndexerModule {}
