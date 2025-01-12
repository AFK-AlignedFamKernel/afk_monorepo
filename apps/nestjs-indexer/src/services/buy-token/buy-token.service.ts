import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BuyToken } from './interfaces';

@Injectable()
export class BuyTokenService {
  private readonly logger = new Logger(BuyTokenService.name);
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: BuyToken) {
    try {
      const buyTokenRecord =
        await this.prismaService.token_transactions.findUnique({
          where: { transfer_id: data.transferId },
        });

      if (buyTokenRecord) {
        this.logger.warn(
          `Record with transfer ID ${data.transferId} already exists`,
        );
        return;
      }

      const tokenLaunchRecord = await this.prismaService.token_launch.findFirst(
        { where: { memecoin_address: data.memecoinAddress } },
      );

      if (!tokenLaunchRecord) {
        this.logger.warn(
          `Record with memecoin address ${data.memecoinAddress} doesn't exists`,
        );
      } else {
        const newSupply =
          Number(tokenLaunchRecord.current_supply ?? 0) - Number(data.amount);
        const newLiquidityRaised =
          Number(tokenLaunchRecord.liquidity_raised ?? 0) +
          Number(data.quoteAmount);
        const newTotalTokenHolded =
          Number(tokenLaunchRecord.total_token_holded ?? 0) +
          Number(data.amount);

        await this.prismaService.token_launch.update({
          where: { transaction_hash: tokenLaunchRecord.transaction_hash },
          data: {
            current_supply: newSupply.toString(),
            liquidity_raised: newLiquidityRaised.toString(),
            total_token_holded: newTotalTokenHolded.toString(),
          },
        });
      }

      await this.prismaService.shares_token_user.upsert({
        where: {
          id: `${data.ownerAddress}_${data.memecoinAddress}`,
          owner: data.ownerAddress,
          token_address: data.memecoinAddress,
        },
        update: {
          amount_owned: {
            increment: data.amount,
          },
        },
        create: {
          id: `${data.ownerAddress}_${data.memecoinAddress}`,
          owner: data.ownerAddress,
          token_address: data.memecoinAddress,
          amount_owned: data.amount,
        },
      });

      const deploytokenRecord = await this.prismaService.token_deploy.findFirst(
        { where: { memecoin_address: data.memecoinAddress } },
      );

      if (!deploytokenRecord) {
        this.logger.warn(
          `Record with memecoin address ${data.memecoinAddress} doesn't exists`,
        );
        return;
      }

      await this.prismaService.token_transactions.create({
        data: {
          transfer_id: data.transferId,
          network: data.network,
          block_hash: data.blockHash,
          block_number: data.blockNumber,
          block_timestamp: data.blockTimestamp,
          transaction_hash: data.transactionHash,
          memecoin_address: data.memecoinAddress,
          owner_address: data.ownerAddress,
          last_price: data.lastPrice,
          quote_amount: data.quoteAmount,
          initial_supply: deploytokenRecord.initial_supply,
          price: data.price,
          amount: data.amount,
          protocol_fee: data.protocolFee,
          time_stamp: data.timestamp,
          transaction_type: data.transactionType,
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
