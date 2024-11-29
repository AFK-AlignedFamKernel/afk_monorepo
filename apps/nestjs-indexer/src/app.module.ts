import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IndexerModule } from './indexer/indexer.module';
import { PrismaModule } from './prisma/prisma.module';
import { BuyTokenModule } from './services/buy-token/buy-token.module';
import { getEnvPath } from './common/utils';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: getEnvPath() }),
    IndexerModule,
    PrismaModule,
    BuyTokenModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
