import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NostrInfofiInterface, LinkedDefaultStarknetAddressEventInterface, DepositRewardsByUserEventInterface, DistributionRewardsByUserEventInterface, NewEpochEventInterface } from './interfaces';
import { FieldElement } from '@apibara/starknet';
import { feltToAddress } from '../helpers';
@Injectable()
export class NamespaceService {
  private readonly logger = new Logger(NamespaceService.name);
  constructor(private readonly prismaService: PrismaService) { }


  async createOrUpdateNostrAddressByAdmin(data: LinkedDefaultStarknetAddressEventInterface) {
    try {
      console.log("createOrUpdateNostrAddressByAdmin", data);

      let nostrAddressString = data.nostr_address;
      // const nostrAddressString = feltToAddress(BigInt(data.nostr_address)) ?? data?.nostr_address;
      // console.log("nostrAddressString", nostrAddressString);
      const userData = await this.prismaService.profile_data.findFirst({
        where: {
          nostr_id: nostrAddressString,
        },
      });


      if (!userData) {
        this.logger.error(
          `User data not found for nostr address: ${nostrAddressString}`,
        );

        await this.prismaService.profile_data.create({
          data: {
            nostr_id: nostrAddressString,
            nostr_event_id: data.nostr_event_id,
            is_add_by_admin: true,
            // starknet_address: data.starknet_address,
          },
        });
        console.log("created new record");
        return;
      }

      await this.prismaService.profile_data.update({
        where: {
          nostr_id: nostrAddressString,
        },
        data: {
          starknet_address: data.starknet_address,
          nostr_event_id: nostrAddressString,
          nostr_id: nostrAddressString,
          is_add_by_admin: true,

        },
      });

    } catch (error) {
      this.logger.error(
        `Error creating linked record: ${error.message}`,
        error.stack,
      );
    }
  }

  
  async createOrUpdateLinkedDefaultStarknetAddress(data: LinkedDefaultStarknetAddressEventInterface) {
    try {
      console.log("createOrUpdateLinkedDefaultStarknetAddress", data);

      let nostrAddressString = data.nostr_address;

      console.log("nostrAddressString", nostrAddressString);
      const userData = await this.prismaService.profile_data.findFirst({
        where: {
          nostr_id: nostrAddressString,
        },
      });

      if (!userData) {
        // this.logger.error(
        //   `User data not found for nostr address: ${nostrAddressString}`,
        // );

        await this.prismaService.profile_data.create({
          data: {
            nostr_id: nostrAddressString,
            starknet_address: data.starknet_address,
            nostr_event_id: nostrAddressString,
          },
        });
        return;
      }

      await this.prismaService.profile_data.update({
        where: {
          nostr_id: nostrAddressString,
        },
        data: {
          starknet_address: data.starknet_address,
          nostr_event_id:nostrAddressString,
          nostr_id: nostrAddressString,
        },
      });

    } catch (error) {
      this.logger.error(
        `Error creating linked record: ${error.message}`,
        error.stack,
      );
    }
  }


  async createTipUserWithVote(data: NostrInfofiInterface) {
    try {
      console.log("createTipUserWithVote", data);

      const epochData = await this.prismaService.epoch_data.findUnique({
        where: {
          transaction_hash: data.transactionHash,
          epoch_index: data.epoch_index.toString(),
        },
      });

      if (!epochData) {

        await this.prismaService.epoch_data.create({
          data: {
            transaction_hash: data.transactionHash,
            epoch_index: data.epoch_index.toString(),
            total_vote_score: Number(data?.amount_vote),
          },
        });
        this.logger.error(
          `Epoch data not found for transaction hash: ${data.transactionHash}`,
        );
        return;
      }

      await this.prismaService.epoch_data.update({
        where: {
          transaction_hash: data.transactionHash,
          epoch_index: data.epoch_index.toString(),
        },
        data: {
          epoch_index: data.epoch_index.toString(),
          total_amount_deposit: {
            increment: Number(data.amount_token),
          },
        },
      });

    } catch (error) {
      this.logger.error(
        `Error creating tip user with vote: ${error.message}`,
        error.stack,
      );
    }
  }



  async handleNewEpochEvent(data: NewEpochEventInterface) {
    try {
      console.log("handleNewEpochEvent", data);

      const epochData = await this.prismaService.epoch_data.findUnique({
        where: {
          transaction_hash: data.transactionHash,
          epoch_index: data.current_index_epoch.toString(),
        },
      });

      if (!epochData) {
        await this.prismaService.epoch_data.create({
          data: {
            transaction_hash: data.transactionHash,
            epoch_index: data.current_index_epoch.toString(),
          },
        });
        this.logger.error(
          `Epoch data not found for transaction hash: ${data.transactionHash}`,
        );
        return;
      }

    } catch (error) {
      this.logger.error(
        `Error creating linked record: ${error.message}`,
        error.stack,
      );
    }
  }
  async createOrUpdateDepositRewardsByUser(data: DepositRewardsByUserEventInterface) {
    try {
      console.log("createOrUpdateDepositRewardsByUser", data);

      const epochData = await this.prismaService.epoch_data.findUnique({
        where: {
          transaction_hash: data.transactionHash,
          epoch_index: data.epoch_index.toString(),
        },
      });

      if (!epochData) {

        await this.prismaService.epoch_data.create({
          data: {
            transaction_hash: data.transactionHash,
            epoch_index: data.epoch_index.toString(),
            total_amount_deposit: Number(data.amount_token),
          },
        });
        this.logger.error(
          `Epoch data not found for transaction hash: ${data.transactionHash}`,
        );
        return;
      }

      await this.prismaService.epoch_data.update({
        where: {
          transaction_hash: data.transactionHash,
          epoch_index: data.epoch_index.toString(),
        },
        data: {
          epoch_index: data.epoch_index.toString(),
          total_amount_deposit: {
            increment: Number(data.amount_token),
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error creating linked record: ${error.message}`,
        error.stack,
      );
    }
  }

  async createOrUpdateDistributionRewardsByUser(data: DistributionRewardsByUserEventInterface) {
    try {
      console.log("createOrUpdateDistributionRewardsByUser", data);

      const epochData = await this.prismaService.epoch_data.findUnique({
        where: {
          transaction_hash: data.transactionHash,
          epoch_index: data.current_index_epoch.toString(),
        },
      });

      if (!epochData) {

        await this.prismaService.epoch_data.create({
          data: {
            transaction_hash: data.transactionHash,
            epoch_index: data.current_index_epoch.toString(),
            amount_claimed: Number(data.amount_total),
          },
        });
        this.logger.error(
          `Epoch data not found for transaction hash: ${data.transactionHash}`,
        );
        return;
      }

      await this.prismaService.epoch_data.update({
        where: {
          transaction_hash: data.transactionHash,
          epoch_index: data.current_index_epoch.toString(),
        },
        data: {
          epoch_index: data.current_index_epoch.toString(),
          amount_claimed: {
            increment: Number(data.amount_total),
          },
        },
      });


      const userData = await this.prismaService.profile_data.findFirst({
        where: {
          nostr_id: data.nostr_address,
        },
      });

      if (!userData) {
        this.logger.error(
          `User data not found for nostr address: ${data.nostr_address}`,
        );
        return;
      }

      await this.prismaService.profile_data.update({
        where: {
          nostr_id: data.nostr_address,
        },
        data: {
          amount_claimed: Number(data.amount_total),
          state_per_epoch: {
            create: {
              epoch_index: data.current_index_epoch,
              amount_claimed: Number(data.amount_total),
            },  
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error creating linked record: ${error.message}`,
        error.stack,
      );
    }
  }
}
