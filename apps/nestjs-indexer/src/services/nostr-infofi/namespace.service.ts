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

        await this.prismaService.userProfile.create({
          data: {
            nostr_id: nostrAddressString,
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

      await this.prismaService.userProfile.update({
        where: {
          nostr_id: nostrAddressString,
        },
        data: {
          starknet_address: data.starknet_address,
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


        await this.prismaService.userProfile.create({
          data: {
            nostr_id: nostrAddressString,
            is_add_by_admin: data?.is_add_by_admin,

            // starknet_address: data.starknet_address,
          },
        });
        await this.prismaService.profile_data.create({
          data: {
            nostr_id: nostrAddressString,
            starknet_address: data.starknet_address,
            nostr_event_id: nostrAddressString,
            is_add_by_admin: data?.is_add_by_admin,
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

      await this.prismaService.userProfile.create({
        data: {
          nostr_id: nostrAddressString,
          is_add_by_admin: data?.is_add_by_admin,

          // starknet_address: data.starknet_address,
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
