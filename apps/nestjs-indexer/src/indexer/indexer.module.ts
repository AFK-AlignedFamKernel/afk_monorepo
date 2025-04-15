import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { TokenLaunchIndexer } from './token-launch.indexer';
import { DeployTokenIndexer } from './deploy-token.indexer';
import { BuyTokenIndexer } from './buy-token.indexer';
import { SellTokenIndexer } from './sell-token.indexer';
import { NameServiceIndexer } from './name-service.indexer';
import { TokenLaunchModule } from 'src/services/token-launch/token-launch.module';
import { DeployTokenModule } from 'src/services/deploy-token/deploy-token.module';
import { BuyTokenModule } from 'src/services/buy-token/buy-token.module';
import { SellTokenModule } from 'src/services/sell-token/sell-token.module';
import { NameServiceModule } from 'src/services/name-service/name-service.module';
import { LiquidityAddedModule } from 'src/services/liquidity-added/liquidity-added.module';
import { LiquidityAddedIndexer } from './liquidity-added.indexer';
import { TipServiceModule } from '../services/tip-service/tipServiceModule';
import { TipServiceIndexer } from './tip-service.indexer';
import { MetadataLaunchIndexer } from './metadata-launch.indexer';
import { MetadataLaunchModule } from 'src/services/metadata/metadata.module';
import { InfoFiIndexer } from './infofi/link-user.indexer';
import { NostrInfofiModule } from 'src/services/nostr-infofi/nostr-infofi.module';
import { NostrInfofiService } from 'src/services/nostr-infofi/nostr-infofi.service';

@Module({
  imports: [
    TokenLaunchModule,
    DeployTokenModule,
    BuyTokenModule,
    SellTokenModule,
    NameServiceModule,
    LiquidityAddedModule,
    TipServiceModule,
    MetadataLaunchModule,
    NostrInfofiModule,
  ],
  providers: [
    TokenLaunchIndexer,
    DeployTokenIndexer,
    BuyTokenIndexer,
    SellTokenIndexer,
    NameServiceIndexer,
    IndexerService,
    LiquidityAddedIndexer,
    TipServiceIndexer,
    MetadataLaunchIndexer,
    InfoFiIndexer,
  ],
  exports: [
    TokenLaunchIndexer,
    DeployTokenIndexer,
    BuyTokenIndexer,
    SellTokenIndexer,
    NameServiceIndexer,
    LiquidityAddedIndexer,
    TipServiceIndexer,
    MetadataLaunchIndexer,
    InfoFiIndexer,
  ],
})
export class IndexerModule {}
