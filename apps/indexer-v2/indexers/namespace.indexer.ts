import { defineIndexer } from '@apibara/indexer';
import { useLogger } from '@apibara/indexer/plugins';
import { drizzleStorage, useDrizzleStorage } from '@apibara/plugin-drizzle';
import { Abi, decodeEvent, StarknetStream } from '@apibara/starknet';
import { constants, encode, hash } from 'starknet';
import { ApibaraRuntimeConfig } from 'apibara/types';
import { db } from 'indexer-v2-db';
// import { ABI as namespaceABI } from './abi/namespace.abi';
import { ABI as namespaceABI } from './abi/afkNamespace.abi';
import {
  upsertContractState,
  upsertEpochState,
  upsertUserProfile,
  upsertUserEpochState,
  saveCursor,
} from './db/nostr-fi.db';
import { formatUnits } from 'viem';

const LINKED_ADDRESS = hash.getSelectorFromName('LinkedDefaultStarknetAddressEvent') as `0x${string}`;
const ADMIN_ADD_NOSTR_PROFILE = hash.getSelectorFromName('AdminAddNostrProfile') as `0x${string}`;
const PUSH_ALGO_SCORE = hash.getSelectorFromName('PushAlgoScoreEvent') as `0x${string}`;


const KNOWN_EVENT_KEYS = [
  LINKED_ADDRESS,
  PUSH_ALGO_SCORE,
  ADMIN_ADD_NOSTR_PROFILE,
]
export default function (config: ApibaraRuntimeConfig & {
  startingBlock: number,
  startingCursor: { orderKey: string }
}) {
  console.log("config", config.startingBlock);
  const {
    startingBlock,
  } = config;

  return defineIndexer(StarknetStream)({
    streamUrl: config.streamUrl as string,
    // startingBlock: BigInt(startingBlock ?? 533390),
    startingCursor: {
      orderKey: BigInt(config?.startingCursor?.orderKey ?? 533390),
      // blockHash: config.startingCursor.blockHash,
      // orderKey: config.startingCursor.orderKey,
    },
    filter: {
      events: [
        {
          address: "0x07607c8A50b83938ea3f9DA25DC1b7024814C0E5bF4B40bF6D6FF9Bc7387aa7d" as `0x${string}`,
          keys: [
            LINKED_ADDRESS,
            PUSH_ALGO_SCORE,
            ADMIN_ADD_NOSTR_PROFILE,
            // 
            // DEPOSIT_REWARDS,
            // DISTRIBUTION_REWARDS,
            // TIP_USER,
            // LINKED_ADDRESS,
            // PUSH_ALGO_SCORE,
            // ADD_TOPICS,
            // NOSTR_METADATA,
          ],
        },
      ],
    },
    plugins: [drizzleStorage({
      db,
      // idColumn: 'id'

      // idColumn: 'id'
    })],
    async transform({ endCursor, block, context, finality }) {
      const logger = useLogger();
      const { db } = useDrizzleStorage();
      const { events, header } = block;

      logger.info(
        "Transforming block | orderKey: ",
        endCursor?.orderKey,
        " | finality: ",
        finality,
      );

      console.log("header", header);
      const transactionHashes = new Set<string>();
      console.log("events length", events?.length);

      for (const event of events) {
        if (event.transactionHash) {
          transactionHashes.add(event.transactionHash);
        }
        logger.log(`Found event ${event.keys[0]}`);

        try {
          let sanitizedEventKey = encode.sanitizeHex(event.keys[0]);
          console.log("event.keys[0]", event.keys[0]);
          let decodedEvent: any;

          if (event.keys[0] == encode.sanitizeHex(LINKED_ADDRESS)) {
            console.log("LINKED_ADDRESS", event);

            const decodedEvent = decodeEvent({
              abi: namespaceABI as Abi,
              event,
              // eventName: 'afk::interfaces::common_interfaces::LinkedDefaultStarknetAddressEvent',
              eventName: 'afk::interfaces::namespace::LinkedDefaultStarknetAddressEvent',
            });
            await handleLinkedAddressEvent(decodedEvent, event.address);
          } else if (event.keys[0] == encode.sanitizeHex(ADMIN_ADD_NOSTR_PROFILE)) {
            console.log("ADMIN_ADD_NOSTR_PROFILE", event);

            const decodedEvent = decodeEvent({
              abi: namespaceABI as Abi,
              event,
              eventName: 'afk::interfaces::nostrfi_scoring_interfaces::AdminAddNostrProfile',
            });
            await handleAdminLinkedAddressEvent(decodedEvent, event.address);
          } else if (event.keys[0] == encode.sanitizeHex(PUSH_ALGO_SCORE)) {
            console.log("PUSH_ALGO_SCORE", event);
            const decodedEvent = decodeEvent({
              abi: namespaceABI as Abi,
              event,
              eventName: 'afk::interfaces::nostrfi_scoring_interfaces::PushAlgoScoreEvent',
            });
            await handlePushAlgoScoreEvent(decodedEvent, event.address);
          }

          // switch (encode.sanitizeHex(event.keys[0])) {
          // switch (event.keys[0]) {
          //   case NEW_EPOCH:
          //     console.log("NEW_EPOCH", decodedEvent);
          //     await handleNewEpochEvent(decodedEvent, event.address);
          //     break;
          //   case DEPOSIT_REWARDS:
          //     console.log("DEPOSIT_REWARDS", decodedEvent);
          //     await handleDepositRewardsEvent(decodedEvent, event.address);
          //     break;
          //   case DISTRIBUTION_REWARDS:
          //     await handleDistributionRewardsEvent(decodedEvent, event.address);
          //     break;
          //   case TIP_USER:
          //     console.log("TIP_USER", decodedEvent);
          //     await handleTipUserEvent(decodedEvent, event.address);
          //     break;
          //   case LINKED_ADDRESS:
          //     await handleLinkedAddressEvent(decodedEvent, event.address);
          //     break;
          //   case PUSH_ALGO_SCORE:
          //     await handlePushAlgoScoreEvent(decodedEvent, event.address);
          //     break;
          //   case ADD_TOPICS:
          //     await handleAddTopicsEvent(decodedEvent, event.address);
          //     break;
          //   case NOSTR_METADATA:
          //     await handleNostrMetadataEvent(decodedEvent, event.address);
          //     break;
          // }
        } catch (error: any) {
          logger.error(`Error processing event: ${error.message}`);
        }
      }

    }
    // async transform({ block }) {
    //   try {
    //     console.log("transform started");

    //     const logger = useLogger();
    //     const { events, header } = block;
    //     console.log("block", header?.blockNumber);
    //     console.log("events length", events?.length);
    //     // Save cursor at the start
    //     // await saveCursor(header.blockNumber.toString(), header?.blockHash as string);

    //     if (events.length === 0) {
    //       return;
    //     }

    //     for (const event of events) {
    //       logger.log(`Found event ${event.keys[0]}`);

    //       // // Log unknown events instead of failing
    //       // if (!KNOWN_EVENT_KEYS.includes(event.keys[0])) {
    //       //   logger.warn(`Skipping unknown event key: ${event.keys[0]}`);
    //       //   continue;
    //       // }


    //       try {
    //         let sanitizedEventKey = encode.sanitizeHex(event.keys[0]);
    //         console.log("event.keys[0]", event.keys[0]);
    //         let decodedEvent: any;

    //         if (event.keys[0] == encode.sanitizeHex(LINKED_ADDRESS)) {
    //           console.log("LINKED_ADDRESS", event);

    //           const decodedEvent = decodeEvent({
    //             abi: namespaceABI as Abi,
    //             event,
    //             eventName: 'afk::interfaces::common_interfaces::LinkedDefaultStarknetAddressEvent',
    //             // eventName: 'afk::interfaces::namespace::LinkedDefaultStarknetAddressEvent',
    //             // eventName: 'afk::interfaces::namespace::LinkedDefaultStarknetAddressEvent',
    //           });
    //           await handleLinkedAddressEvent(decodedEvent, event.address);
    //         } else if (event.keys[0] == encode.sanitizeHex(ADMIN_ADD_NOSTR_PROFILE)) {
    //           console.log("ADMIN_ADD_NOSTR_PROFILE", event);

    //           const decodedEvent = decodeEvent({
    //             abi: namespaceABI as Abi,
    //             event,
    //             eventName: 'afk::interfaces::nostrfi_scoring_interfaces::AdminAddNostrProfile',
    //           });
    //           await handleAdminLinkedAddressEvent(decodedEvent, event.address);
    //         } else if (event.keys[0] == encode.sanitizeHex(PUSH_ALGO_SCORE)) {
    //           console.log("PUSH_ALGO_SCORE", event);
    //           const decodedEvent = decodeEvent({
    //             abi: namespaceABI as Abi,
    //             event,
    //             eventName: 'afk::interfaces::nostrfi_scoring_interfaces::PushAlgoScoreEvent',
    //           });
    //           await handlePushAlgoScoreEvent(decodedEvent, event.address);
    //         }

    //         // switch (encode.sanitizeHex(event.keys[0])) {
    //         // switch (event.keys[0]) {
    //         //   case NEW_EPOCH:
    //         //     console.log("NEW_EPOCH", decodedEvent);
    //         //     await handleNewEpochEvent(decodedEvent, event.address);
    //         //     break;
    //         //   case DEPOSIT_REWARDS:
    //         //     console.log("DEPOSIT_REWARDS", decodedEvent);
    //         //     await handleDepositRewardsEvent(decodedEvent, event.address);
    //         //     break;
    //         //   case DISTRIBUTION_REWARDS:
    //         //     await handleDistributionRewardsEvent(decodedEvent, event.address);
    //         //     break;
    //         //   case TIP_USER:
    //         //     console.log("TIP_USER", decodedEvent);
    //         //     await handleTipUserEvent(decodedEvent, event.address);
    //         //     break;
    //         //   case LINKED_ADDRESS:
    //         //     await handleLinkedAddressEvent(decodedEvent, event.address);
    //         //     break;
    //         //   case PUSH_ALGO_SCORE:
    //         //     await handlePushAlgoScoreEvent(decodedEvent, event.address);
    //         //     break;
    //         //   case ADD_TOPICS:
    //         //     await handleAddTopicsEvent(decodedEvent, event.address);
    //         //     break;
    //         //   case NOSTR_METADATA:
    //         //     await handleNostrMetadataEvent(decodedEvent, event.address);
    //         //     break;
    //         // }
    //       } catch (error: any) {
    //         logger.error(`Error processing event: ${error.message}`);
    //       }
    //     }
    //   } catch (error) {
    //     console.log("error transform", error);
    //   }

    // },
  })


  async function handleLinkedAddressEvent(event: any, contractAddress: string) {
    try {
      if (event.nostr_address) {
        await upsertUserProfile({
          nostr_id: event.nostr_address,
          starknet_address: event.starknet_address,
        });
      }
    } catch (error) {
      console.log("error handleLinkedAddressEvent", error);
    }
  }

  async function handleAdminLinkedAddressEvent(event: any, contractAddress: string) {
    try {
      if (event.nostr_address) {
        await upsertUserProfile({
          nostr_id: event.nostr_address,
          starknet_address: event.starknet_address,
          is_add_by_admin: true,
        });
      }
    } catch (error) {
      console.log("error handleLinkedAddressEvent", error);
    }
  }

  async function handlePushAlgoScoreEvent(event: any, contractAddress: string) {
    try {
      await upsertContractState({
        contract_address: contractAddress,
        total_ai_score: event.total_ai_score,
      });

      await upsertEpochState({
        contract_address: contractAddress,
        epoch_index: event.epoch_index,
        total_ai_score: event.total_ai_score,
      });

      if (event.nostr_address) {
        await upsertUserProfile({
          nostr_id: event.nostr_address,
          total_ai_score: event.total_ai_score,
        });

        await upsertUserEpochState({
          nostr_id: event.nostr_address,
          contract_address: contractAddress,
          epoch_index: event.epoch_index,
          total_ai_score: event.total_ai_score,
        });
      }
    } catch (error) {
      console.log("error handlePushAlgoScoreEvent", error);
    }
  }

  async function handleAddTopicsEvent(event: any, contractAddress: string) {
    try {
      await upsertContractState({
        contract_address: contractAddress,
        topic_metadata: event.topic_metadata,
        main_tag: event.main_tag,
        keyword: event.keyword,
        keywords: event.keywords,
      });
    } catch (error) {
      console.log("error handleAddTopicsEvent", error);
    }
  }

  async function handleNostrMetadataEvent(event: any, contractAddress: string) {
    try {
      await upsertContractState({
        contract_address: contractAddress,
        nostr_metadata: event.nostr_metadata,
        name: event.name,
        about: event.about,
        event_id_nip_29: event.event_id_nip_29,
        event_id_nip_72: event.event_id_nip_72,
      });
    } catch (error) {
      console.log("error handleNostrMetadataEvent", error);
    }
  }

}