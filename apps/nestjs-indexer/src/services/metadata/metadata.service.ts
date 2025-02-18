import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MetadataLaunch  } from './interfaces';

@Injectable()
export class MetadataLaunchService {
  private readonly logger = new Logger(MetadataLaunchService.name);
  constructor(private readonly prismaService: PrismaService) { }

  async createOrUpdate(data: MetadataLaunch) {
    try {
      const tokenMetadataRecord = await this.prismaService.token_metadata.findFirst(
        { where: { memecoin_address: data.memecoinAddress } },
      );


      if (!tokenMetadataRecord) {
        this.logger.warn(
          `Record with memecoin address ${data.memecoinAddress} doesn't exists`,
        );

        await this.prismaService.token_metadata.create({
          data: {
            transaction_hash: data.transactionHash,
            network: data.network,
            block_hash: data.blockHash,
            block_number: data.blockNumber,
            block_timestamp: data.blockTimestamp,
            // contract_address: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
            url: data.url,
            nostr_id: data.nostr_event_id,
          },
        });

        this.prismaService.token_deploy.updateMany({
          where: { memecoin_address: data.memecoinAddress },
          data: {
            url: data?.url,
            nostr_id: data?.nostr_event_id,
          },
        });
      } else {

        await this.prismaService.token_metadata.update({
          where: { transaction_hash: tokenMetadataRecord.transaction_hash },
          data: {
            url: data.url,
            nostr_id: data.nostr_event_id,
          },
        });
        this.prismaService.token_deploy.updateMany({
          where: { memecoin_address: data.memecoinAddress },
          data: {
            url: data?.url,
            nostr_id: data?.nostr_event_id,
          },
        });
      }

    } catch (error) {
      this.logger.error(
        `Error creating metadata token record: ${error.message}`,
        error.stack,
      );
    }
  }
}
