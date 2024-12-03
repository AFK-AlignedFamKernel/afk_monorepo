import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NameService } from './interfaces';

@Injectable()
export class NameServiceService {
  private readonly logger = new Logger(NameServiceService.name);
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: NameService) {
    try {
      const nameServiceRecord =
        await this.prismaService.username_claimed.findUnique({
          where: { transaction_hash: data.transactionHash },
        });

      if (nameServiceRecord) {
        this.logger.warn(
          `Record with transaction hash ${data.transactionHash} already exists`,
        );
        return;
      }

      await this.prismaService.username_claimed.create({
        data: {
          transaction_hash: data.transactionHash,
          network: data.network,
          block_hash: data.blockHash,
          block_number: data.blockNumber,
          block_timestamp: data.blockTimestamp,
          owner_address: data.ownerAddress,
          expiry: data.expiry,
          username: data.username,
          symbol: data.symbol,
          paid: data.paid,
          quote_address: data.quoteAddress,
          time_stamp: data.timestamp,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error creating name service record: ${error.message}`,
        error.stack,
      );
    }
  }
}
