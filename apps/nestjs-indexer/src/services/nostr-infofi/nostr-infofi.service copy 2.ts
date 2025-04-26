import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NostrInfofiInterface, LinkedDefaultStarknetAddressEventInterface, DepositRewardsByUserEventInterface, DistributionRewardsByUserEventInterface, NewEpochEventInterface } from './interfaces';

@Injectable()
export class NostrInfofiService {
  private readonly logger = new Logger(NostrInfofiService.name);
  constructor(private readonly prismaService: PrismaService) {}

  async createOrUpdateNostrAddressByAdmin(data: LinkedDefaultStarknetAddressEventInterface) {
    try {
      const userProfile = await this.prismaService.userProfile.upsert({
        where: { nostr_id: data.nostr_address },
        update: {
          starknet_address: data.starknet_address,
          is_add_by_admin: true,
          updated_at: new Date(),
        },
        create: {
          nostr_id: data.nostr_address,
          starknet_address: data.starknet_address,
          is_add_by_admin: true,
        },
      });

      return userProfile;
    } catch (error) {
      this.logger.error(
        `Error updating nostr address by admin: ${error.message}`,
        error.stack,
      );
    }
  }

  async createOrUpdateLinkedDefaultStarknetAddress(data: LinkedDefaultStarknetAddressEventInterface) {
    try {
      const userProfile = await this.prismaService.userProfile.upsert({
        where: { nostr_id: data.nostr_address },
        update: {
          starknet_address: data.starknet_address,
          updated_at: new Date(),
        },
        create: {
          nostr_id: data.nostr_address,
          starknet_address: data.starknet_address,
        },
      });

      return userProfile;
    } catch (error) {
      this.logger.error(
        `Error linking starknet address: ${error.message}`,
        error.stack,
      );
    }
  }

  async createTipUserWithVote(data: NostrInfofiInterface) {
    try {
      const epochIndex = data.current_index_epoch?.toString() || "0";

      // Update contract state
      const contractState = await this.prismaService.contractState.upsert({
        where: { contract_address: data.contract_address },
        update: {
          total_tips: { increment: Number(data.amount_token) },
          total_vote_score: { increment: Number(data.amount_token) },
          updated_at: new Date(),
        },
        create: {
          contract_address: data.contract_address,
          network: data.network,
          current_epoch_index: epochIndex,
          total_tips: Number(data.amount_token),
          total_vote_score: Number(data.amount_token),
        },
      });

      // Update epoch state
      const epochState = await this.prismaService.epochState.upsert({
        where: {
          epoch_index_contract_address: {
            epoch_index: epochIndex,
            contract_address: data.contract_address,
          },
        },
        update: {
          total_vote_score: { increment: Number(data.amount_token) },
          total_tip: { increment: Number(data.amount_token) },
          updated_at: new Date(),
        },
        create: {
          epoch_index: epochIndex,
          contract_address: data.contract_address,
          total_vote_score: Number(data.amount_token),
          total_tip: Number(data.amount_token),
          start_time: new Date(),
        },
      });

      // Update user profile and epoch state
      const userProfile = await this.prismaService.userProfile.upsert({
        where: { nostr_id: data.nostr_address },
        update: {
          total_tip: { increment: Number(data.amount_token) },
          total_vote_score: { increment: Number(data.amount_token) },
          updated_at: new Date(),
        },
        create: {
          nostr_id: data.nostr_address,
          total_tip: Number(data.amount_token),
          total_vote_score: Number(data.amount_token),
        },
      });

      await this.prismaService.userEpochState.upsert({
        where: {
          nostr_id_epoch_index_contract_address: {
            nostr_id: data.nostr_address,
            epoch_index: epochIndex,
            contract_address: data.contract_address,
          },
        },
        update: {
          total_tip: { increment: Number(data.amount_token) },
          total_vote_score: { increment: Number(data.amount_token) },
          updated_at: new Date(),
        },
        create: {
          nostr_id: data.nostr_address,
          epoch_index: epochIndex,
          contract_address: data.contract_address,
          total_tip: Number(data.amount_token),
          total_vote_score: Number(data.amount_token),
        },
      });

      return { contractState, epochState, userProfile };
    } catch (error) {
      this.logger.error(
        `Error creating tip with vote: ${error.message}`,
        error.stack,
      );
    }
  }

  async handleNewEpochEvent(data: NewEpochEventInterface) {
    try {
      const epochIndex = data.current_index_epoch?.toString() || "0";

      // Create new epoch state
      const epochState = await this.prismaService.epochState.create({
        data: {
          epoch_index: epochIndex,
          contract_address: data.contract_address,
          start_time: data.start_duration,
          end_time: data.end_duration,
          epoch_duration: data.epoch_duration,
        },
      });

      // Update contract state
      const contractState = await this.prismaService.contractState.upsert({
        where: { contract_address: data.contract_address },
        update: {
          current_epoch_index: epochIndex,
          current_epoch_start: data.start_duration,
          current_epoch_end: data.end_duration,
          current_epoch_duration: data.epoch_duration,
          updated_at: new Date(),
        },
        create: {
          contract_address: data.contract_address,
          network: data.network,
          current_epoch_index: epochIndex,
          current_epoch_start: data.start_duration,
          current_epoch_end: data.end_duration,
          current_epoch_duration: data.epoch_duration,
        },
      });

      return { epochState, contractState };
    } catch (error) {
      this.logger.error(
        `Error handling new epoch: ${error.message}`,
        error.stack,
      );
    }
  }

  async createOrUpdateDepositRewardsByUser(data: DepositRewardsByUserEventInterface) {
    try {
      const epochIndex = data.epoch_index?.toString() || "0";

      // Update contract state
      const contractState = await this.prismaService.contractState.upsert({
        where: { contract_address: data.contract_address },
        update: {
          total_amount_deposit: { increment: Number(data.amount_token) },
          updated_at: new Date(),
        },
        create: {
          contract_address: data.contract_address,
          network: data.network,
          current_epoch_index: epochIndex,
          total_amount_deposit: Number(data.amount_token),
        },
      });

      // Update epoch state
      const epochState = await this.prismaService.epochState.upsert({
        where: {
          epoch_index_contract_address: {
            epoch_index: epochIndex,
            contract_address: data.contract_address,
          },
        },
        update: {
          total_amount_deposit: { increment: Number(data.amount_token) },
          updated_at: new Date(),
        },
        create: {
          epoch_index: epochIndex,
          contract_address: data.contract_address,
          total_amount_deposit: Number(data.amount_token),
          start_time: new Date(),
        },
      });

      // Update user profile and epoch state if nostr_address is provided
      if (data.nostr_address && data.nostr_address !== "0") {
        const userProfile = await this.prismaService.userProfile.upsert({
          where: { nostr_id: data.nostr_address },
          update: {
            total_ai_score: { increment: Number(data.amount_token) },
            updated_at: new Date(),
          },
          create: {
            nostr_id: data.nostr_address,
            starknet_address: data.starknet_address,
            total_ai_score: Number(data.amount_token),
          },
        });

        await this.prismaService.userEpochState.upsert({
          where: {
            nostr_id_epoch_index_contract_address: {
              nostr_id: data.nostr_address,
              epoch_index: epochIndex,
              contract_address: data.contract_address,
            },
          },
          update: {
            total_ai_score: { increment: Number(data.amount_token) },
            updated_at: new Date(),
          },
          create: {
            nostr_id: data.nostr_address,
            epoch_index: epochIndex,
            contract_address: data.contract_address,
            total_ai_score: Number(data.amount_token),
          },
        });

        return { contractState, epochState, userProfile };
      }

      return { contractState, epochState };
    } catch (error) {
      this.logger.error(
        `Error creating deposit rewards: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async createOrUpdateDistributionRewardsByUser(data: DistributionRewardsByUserEventInterface) {
    try {
      const epochIndex = data.current_index_epoch?.toString() || "0";

      // Update epoch state
      const epochState = await this.prismaService.epochState.upsert({
        where: {
          epoch_index_contract_address: {
            epoch_index: epochIndex,
            contract_address: data.contract_address,
          },
        },
        update: {
          amount_claimed: { increment: Number(data.amount_total) },
          amount_algo: { increment: Number(data.amount_algo) },
          amount_vote: { increment: Number(data.amount_vote) },
          updated_at: new Date(),
        },
        create: {
          epoch_index: epochIndex,
          contract_address: data.contract_address,
          amount_claimed: Number(data.amount_total),
          amount_algo: Number(data.amount_algo),
          amount_vote: Number(data.amount_vote),
          start_time: new Date(),
        },
      });

      // Update contract state
      const contractState = await this.prismaService.contractState.upsert({
        where: { contract_address: data.contract_address },
        update: {
          total_to_claimed: { increment: Number(data.amount_total) },
          updated_at: new Date(),
        },
        create: {
          contract_address: data.contract_address,
          network: data.network,
          current_epoch_index: epochIndex,
          total_to_claimed: Number(data.amount_total),
        },
      });

      // Update user profile and epoch state
      const userProfile = await this.prismaService.userProfile.upsert({
        where: { nostr_id: data.nostr_address },
        update: {
          amount_claimed: { increment: Number(data.amount_total) },
          updated_at: new Date(),
        },
        create: {
          nostr_id: data.nostr_address,
          amount_claimed: Number(data.amount_total),
        },
      });

      await this.prismaService.userEpochState.upsert({
        where: {
          nostr_id_epoch_index_contract_address: {
            nostr_id: data.nostr_address,
            epoch_index: epochIndex,
            contract_address: data.contract_address,
          },
        },
        update: {
          amount_claimed: { increment: Number(data.amount_total) },
          updated_at: new Date(),
        },
        create: {
          nostr_id: data.nostr_address,
          epoch_index: epochIndex,
          contract_address: data.contract_address,
          amount_claimed: Number(data.amount_total),
        },
      });

      return { contractState, epochState, userProfile };
    } catch (error) {
      this.logger.error(
        `Error creating distribution rewards: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
