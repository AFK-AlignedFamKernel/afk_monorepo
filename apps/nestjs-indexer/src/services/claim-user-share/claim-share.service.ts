import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClaimToken } from './interfaces';

@Injectable()
export class ClaimUserShareService {
  private readonly logger = new Logger(ClaimUserShareService.name);
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: ClaimToken) {
    try {

      const tokenShareRecord = await this.prismaService.shares_token_user.findFirst(
        { where: { token_address: data.tokenAddress, owner: data.ownerAddress   } },
      );

      if (!tokenShareRecord) {
        this.logger.warn(
          `Record with memecoin address ${data.memecoinAddress} doesn't exists`,
        );
      } else {

        await this.prismaService.shares_token_user.update({
          where: {id: tokenShareRecord.id},
          // where: {token_address: data.tokenAddress, owner: data.ownerAddress  },
          data: {
            // is_liquidity_added: true, // TODO add check if amount claimd == amount owned
            amount_claimed: data?.amount,
          },
        });
      }

    } catch (error) {
      this.logger.error(
        `Error creating claim record: ${error.message}`,
        error.stack,
      );
    }
  }
}
