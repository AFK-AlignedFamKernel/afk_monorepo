import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenLaunch } from './interfaces';

@Injectable()
export class TokenLaunchService {
  private readonly logger = new Logger(TokenLaunchService.name);
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: TokenLaunch) {
    try {
      const tokenLaunchRecord =
        await this.prismaService.token_launch.findUnique({
          where: { transaction_hash: data.transactionHash },
        });

      if (tokenLaunchRecord) {
        this.logger.warn(
          `Record with transaction hash ${data.transactionHash} already exists`,
        );
        return;
      }

      const boundingType =
        data.bondingType === '0'
          ? 'Linear'
          : data.bondingType === '1'
            ? 'Exponential'
            : null;

      await this.prismaService.token_launch.create({
        data: {
          network: data.network,
          block_hash: data.blockHash,
          block_number: data.blockNumber,
          block_timestamp: data.blockTimestamp,
          transaction_hash: data.transactionHash,
          memecoin_address: data.memecoinAddress,
          quote_token: data.quoteToken,
          price: data.price,
          total_supply: data.totalSupply,
          current_supply: data.totalSupply,
          is_liquidity_added: false,
          threshold_liquidity: data.thresholdLiquidity,
          bonding_type: boundingType,
          owner_address: data.ownerAddress,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error creating buy token record: ${error.message}`,
        error.stack,
      );
    }
  }
}
