import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TipCancel, TipClaim, TipDeposit, TipTransfer } from './interfaces';

@Injectable()
export class TipService {
  private readonly logger = new Logger(TipService.name);
  constructor(private readonly prismaService: PrismaService) {}

  async createDeposit(data: TipDeposit) {
    try {
      const tipDepositRecord = await this.prismaService.tip_deposit.findFirst({
        where: { deposit_id: data.depositId },
      });

      if (tipDepositRecord) {
        this.logger.warn(
          `Record with deposit ID ${data.depositId} already exists`,
        );
        return;
      }

      await this.prismaService.tip_deposit.create({
        data: {
          network: data.network,
          block_hash: data.blockHash,
          block_number: data.blockNumber,
          block_timestamp: data.blockTimestamp,
          transaction_hash: data.transactionHash,
          deposit_id: data.depositId,
          sender: data.sender,
          nostr_recipient: data.nostrRecipient,
          token_address: data.tokenAddress,
          amount: data.amount,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error creating deposit record: ${error.message}`,
        error.stack,
      );
    }
  }

  async createTransfer(data: TipTransfer) {
    try {
      const tipTransferRecord =
        await this.prismaService.tip_transfer.findUnique({
          where: { transaction_hash: data.transactionHash },
        });

      if (tipTransferRecord) {
        this.logger.warn(
          `Record with transaction hash ${data.transactionHash} already exists`,
        );
        return;
      }

      await this.prismaService.tip_transfer.create({
        data: {
          network: data.network,
          block_hash: data.blockHash,
          block_number: data.blockNumber,
          block_timestamp: data.blockTimestamp,
          transaction_hash: data.transactionHash,
          sender: data.sender,
          nostr_recipient: data.nostrRecipient,
          starknet_recipient: data.starknetRecipient,
          token_address: data.tokenAddress,
          amount: data.amount,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error creating deposit record: ${error.message}`,
        error.stack,
      );
    }
  }

  async updateClaim(data: TipClaim) {
    try {
      const tipClaimRecord = await this.prismaService.tip_deposit.findFirst({
        where: { deposit_id: data.depositId },
      });

      if (!tipClaimRecord) {
        this.logger.warn(
          `Claim error: Record with deposit ID ${data.depositId} does not exists`,
        );
        return;
      } else if (tipClaimRecord.is_claimed) {
        this.logger.warn(
          `Claim error: Record with deposit ID ${data.depositId} already claimed`,
        );
        return;
      } else if (tipClaimRecord.block_hash !== data.blockHash) {
        this.logger.warn(
          `Claim error: Record with deposit ID ${data.depositId} has different block hash`,
        );
        return;
      }

      await this.prismaService.tip_deposit.update({
        where: { deposit_id: data.depositId },
        data: {
          starknet_recipient: data.starknetRecipient,
          gas_token_address: data.gasTokenAddress,
          gas_amount: data.gasAmount,
          is_claimed: true,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Error claiming tip record: ${error.message}`,
        error.stack,
      );
    }
  }

  async updateCancel(data: TipCancel) {
    try {
      const tipCancelRecord = await this.prismaService.tip_deposit.findFirst({
        where: { deposit_id: data.depositId },
      });

      if (!tipCancelRecord) {
        this.logger.warn(
          `Cancel error: Record with deposit ID ${data.depositId} does not exists`,
        );
        return;
      } else if (tipCancelRecord.is_claimed) {
        this.logger.warn(
          `Cancel error: Record with deposit ID ${data.depositId} already claimed`,
        );
        return;
      } else if (tipCancelRecord.block_hash !== data.blockHash) {
        this.logger.warn(
          `Cancel error: Record with deposit ID ${data.depositId} has different block hash`,
        );
        return;
      }

      await this.prismaService.tip_deposit.update({
        where: { deposit_id: data.depositId },
        data: {
          is_cancelled: true,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Error cancelling tip record: ${error.message}`,
        error.stack,
      );
    }
  }
}
