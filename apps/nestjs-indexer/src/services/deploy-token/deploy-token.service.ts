import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeployToken } from './interfaces';

@Injectable()
export class DeployTokenService {
  private readonly logger = new Logger(DeployTokenService.name);
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: DeployToken) {
    try {
      const deployTokenRecord =
        await this.prismaService.token_deploy.findUnique({
          where: { transaction_hash: data.transactionHash },
        });

      if (deployTokenRecord) {
        this.logger.warn(
          `Record with transaction hash ${data.transactionHash} already exists`,
        );
        return;
      }

      await this.prismaService.token_deploy.create({
        data: {
          network: data.network,
          block_hash: data.blockHash,
          block_number: data.blockNumber,
          block_timestamp: data.blockTimestamp,
          transaction_hash: data.transactionHash,
          memecoin_address: data.memecoinAddress,
          owner_address: data.ownerAddress,
          name: data.name,
          symbol: data.symbol,
          initial_supply: data.initialSupply,
          total_supply: data.totalSupply,
          time_stamp: data.timeStamp,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error creating deploy token record: ${error.message}`,
        error.stack,
      );
    }
  }
}
