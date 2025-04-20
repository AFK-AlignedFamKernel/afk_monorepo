import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NostrInfofiInterface, LinkedDefaultStarknetAddressEventInterface, DepositRewardsByUserEventInterface, DistributionRewardsByUserEventInterface, NewEpochEventInterface } from './interfaces';
import { feltToAddress } from '../helpers';

@Injectable()
export class NostrInfofiService {
  private readonly logger = new Logger(NostrInfofiService.name);
  constructor(private readonly prismaService: PrismaService) { }


  async createOrUpdateNostrAddressByAdmin(data: LinkedDefaultStarknetAddressEventInterface) {
    try {
      console.log("createOrUpdateNostrAddressByAdmin", data);
      const nostrAddressString = data.nostr_address;

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
        return;
      }

      await this.prismaService.profile_data.update({
        where: {
          nostr_id: nostrAddressString,
        },
        data: {
          starknet_address: data.starknet_address,
          nostr_event_id: data.nostr_event_id,
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
      const nostrAddressString = data.nostr_address;

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
            starknet_address: data.starknet_address,
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
          nostr_event_id: data.nostr_event_id,
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
      const nostrAddressString = data.nostr_address;

      let epochIndex = data.current_index_epoch?.toString();
      if (!epochIndex) {
        epochIndex = "0";
      }
      let epochData = await this.prismaService.epoch_data.upsert({
        where: {
          epoch_index: epochIndex,
        },
        update: {
          epoch_index: epochIndex,
          total_vote_score: {
            increment: Number(data.amount_token),

          },
          total_tip: {
            increment: Number(data?.amount_token),
          },
        },
        create: {
          epoch_index: epochIndex,
          transaction_hash: data.transactionHash,
          total_vote_score: 0,
          total_tip: Number(data?.amount_token),
          total_amount_deposit:0,
          total_ai_score:0,
          epoch_duration:0,
        },
      });

      await this.prismaService.epoch_data.update({
        where: {
          transaction_hash: data.transactionHash,
          epoch_index: epochIndex,
        },
        data: {
          epoch_index: epochIndex,
     
          total_vote_score: {
            increment: Number(data.amount_token),
          },
          total_tip: {
            increment: Number(data?.amount_token),
          },  
        },
      });

      // if (!epochData) {

      //   epochData = await this.prismaService.epoch_data.create({
      //     data: {
      //       transaction_hash: data.transactionHash,
      //       epoch_index: epochIndex,
      //       total_vote_score: Number(data?.amount_vote),
      //       total_amount_deposit:0,
      //       total_ai_score:0,
      //       epoch_duration:0,
            
      //     },
      //   });
      //   this.logger.error(
      //     `Epoch data not found for transaction hash: ${data.transactionHash}`,
      //   );
      // }


      const overallData = await this.prismaService.overall_data.upsert({
        where: {
          contract_address: data.contract_address,
        },
        update: {
          total_tips: {
            increment: Number(data.amount_token),
          },
          total_vote_score: {
            increment: Number(data.amount_token),
          },
        },
        create: {
          contract_address: data.contract_address,
          transaction_hash: data.transactionHash,
          total_tips: Number(data.amount_token),
          total_vote_score: Number(data.amount_token),
          total_amount_deposit:0,
          total_ai_score:0,
          epoch_index: epochIndex,
          end_duration: epochData?.end_duration,
          start_duration: epochData?.start_duration,
          epoch_duration: epochData?.epoch_duration,
        },
      });



      await this.prismaService.profile_data.upsert({
        where: {
          nostr_id: nostrAddressString,
        },
        update: {
          total_tip: {
            increment: Number(data.amount_token),
          },
          total_vote_score: {
            increment: Number(data.amount_token),
          },
        },
        create: {
          nostr_id: nostrAddressString,
          transaction_hash: data.transactionHash,
          total_tip: Number(data.amount_token),
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
      let epochIndex = data?.current_index_epoch?.toString();
      if (!epochIndex) {
        epochIndex = "0";
      }
      const epochData = await this.prismaService.epoch_data.upsert({
        where: {
          epoch_index: epochIndex,
        },
        update: {
          epoch_index: epochIndex,
        },
        create: {
          epoch_index: epochIndex,
          transaction_hash: data.transactionHash,
          total_ai_score:0,
          total_vote_score:0
        },
      });

      return epochData;

      // if (!epochData) {
      //   await this.prismaService.epoch_data.create({
      //     data: {
      //       transaction_hash: data.transactionHash,
      //       epoch_index: epochIndex,
      //     },
      //   });
      //   this.logger.error(
      //     `Epoch data not found for transaction hash: ${data.transactionHash}`,
      //   );
      //   return;
      // }

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
      let epochIndex = data.epoch_index?.toString();
      if (!epochIndex) {
        epochIndex = "0";
      }
      const epochData = await this.prismaService.epoch_data.upsert({
        where: {
          // transaction_hash: data.transactionHash,
          epoch_index: epochIndex,
        },
        update: {
          epoch_index: epochIndex,
          total_amount_deposit: {
            increment: Number(data.amount_token),
          },
        },
        create: {
          transaction_hash: data.transactionHash,
          epoch_index: epochIndex,
          total_amount_deposit: Number(data.amount_token),
          total_ai_score:0,
          total_tip:0,
          total_vote_score:0,
          epoch_duration:0,
        },
      });

      // if (!epochData) {

      //   await this.prismaService.epoch_data.create({
      //     data: {
      //       transaction_hash: data.transactionHash,
      //       epoch_index: epochIndex,
      //       total_amount_deposit: Number(data.amount_token),
      //       total_ai_score:0,
      //       total_tip:0,
      //       total_vote_score:0,
      //       epoch_duration:0,
      //     },
      //   });
      //   this.logger.error(
      //     `Epoch data not found for transaction hash: ${data.transactionHash}`,
      //   );
      //   return;
      // }

      // await this.prismaService.epoch_data.update({
      //   where: {
      //     transaction_hash: data.transactionHash,
      //     epoch_index: epochIndex,
      //   },
      //   data: {
      //     epoch_index: epochIndex,
      //     total_amount_deposit: {
      //       increment: Number(data.amount_token),
      //     },
      //   },
      // });

      const overallData = await this.prismaService.overall_data.upsert({
        where: {
          contract_address: data.contract_address,
        },
        update: {
          total_amount_deposit: {
            increment: Number(data.amount_token),
          },
        },
        create: {
          contract_address: data.contract_address,
          transaction_hash: data.transactionHash,
          total_amount_deposit: Number(data.amount_token),
          epoch_index: epochIndex,
          end_duration: epochData?.end_duration,
          start_duration: epochData?.start_duration,
          epoch_duration: epochData?.epoch_duration,
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
      let epochIndex = data.current_index_epoch?.toString();
      if (!epochIndex) {
        epochIndex = "0";
      }
      const nostrAddressString = data.nostr_address;

      const epochData = await this.prismaService.epoch_data.upsert({
        where: {
          // transaction_hash: data.transactionHash,
          epoch_index: epochIndex,
        },
        update: {
          epoch_index: epochIndex,
          amount_claimed: {
            increment: Number(data.amount_total),
          },
        },
        create: {
          epoch_index: epochIndex,
          transaction_hash: data.transactionHash,
          amount_claimed: Number(data.amount_total),
          total_ai_score:0,
          total_tip:0,
          total_vote_score:0,
        },
      });

      // if (!epochData) {

      //   await this.prismaService.epoch_data.create({
      //     data: {
      //       transaction_hash: data.transactionHash,
      //       epoch_index: epochIndex,
      //       amount_claimed: Number(data.amount_total),
      //     },
      //   });
      //   this.logger.error(
      //     `Epoch data not found for transaction hash: ${data.transactionHash}`,
      //   );
      //   return;
      // }

      // await this.prismaService.epoch_data.update({
      //   where: {
      //     transaction_hash: data.transactionHash,
      //     epoch_index: epochIndex,
      //   },
      //   data: {
      //     epoch_index: epochIndex,
      //     amount_claimed: {
      //       increment: Number(data.amount_total),
      //     },
      //   },
      // });


      // const userData = await this.prismaService.profile_data.findFirst({
      //   where: {
      //     nostr_id: nostrAddressString,
      //   },
      // });

      // if (!userData) {
      //   this.logger.error(
      //     `User data not found for nostr address: ${nostrAddressString}`,
      //   );
      //   return;
      // }

      await this.prismaService.profile_data.upsert({
        where: {
          nostr_id: nostrAddressString,
        },
        update: {
          amount_claimed: Number(data.amount_total),
          state_per_epoch: {
            create: {
              epoch_index: Number(epochIndex),
              amount_claimed: Number(data.amount_total),
            },
          },
        },
        create: {
          nostr_id: nostrAddressString,
          amount_claimed: Number(data.amount_total),
          state_per_epoch: {
            create: {
              epoch_index: Number(epochIndex),
              amount_claimed: Number(data.amount_total),
            },
          },
        },
      });

      const overallData = await this.prismaService.overall_data.upsert({
        where: {
          contract_address: data.contract_address,
        },
        update: {
          total_amount_deposit: {
            increment: Number(data.amount_total),
          },
        },
        create: {
          contract_address: data.contract_address,
          transaction_hash: data.transactionHash,
          total_amount_deposit: Number(data.amount_total),
          epoch_index: epochIndex,
          end_duration: epochData?.end_duration,
          start_duration: epochData?.start_duration,
          epoch_duration: epochData?.epoch_duration,
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
