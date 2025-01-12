import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LiquidityCreated } from './interfaces';

@Injectable()
export class LiquidityCreatedService {
  private readonly logger = new Logger(LiquidityCreatedService.name);
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: LiquidityCreated) {
    try {
      const tokenLaunchRecord = await this.prismaService.token_launch.findFirst(
        { where: { memecoin_address: data.asset } },
      );

      if (!tokenLaunchRecord) {
        this.logger.warn(
          `Record with memecoin address ${data.asset} doesn't exists`,
        );

        return;
      }

      await this.prismaService.token_launch.update({
        where: { transaction_hash: tokenLaunchRecord.transaction_hash },
        data: {
          is_liquidity_added: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error updating token launch record: ${error.message}`,
        error.stack,
      );
    }
  }
}
