import { defineIndexer } from '@apibara/indexer';
import { useLogger } from '@apibara/indexer/plugins';
import { drizzleStorage } from '@apibara/plugin-drizzle';
import { decodeEvent, StarknetStream } from '@apibara/starknet';
import { constants, encode, hash } from 'starknet';
import { ApibaraRuntimeConfig } from 'apibara/types';
import { db } from 'indexer-v2-db';
import { ABI as nostrFiScoringABI } from './abi/infofi/score.abi';
import { ABI as scoreFactoryABI } from './abi/infofi/score_factory.abi';
import {
  upsertContractState,
  upsertEpochState,
  upsertUserProfile,
  upsertUserEpochState,
  insertSubState,
} from './db/nostr-fi.db';

const NEW_EPOCH = hash.getSelectorFromName('NewEpochEvent') as `0x${string}`;
const DEPOSIT_REWARDS = hash.getSelectorFromName('DepositRewardsByUserEvent') as `0x${string}`;
const DISTRIBUTION_REWARDS = hash.getSelectorFromName('DistributionRewardsByUserEvent') as `0x${string}`;
const TIP_USER = hash.getSelectorFromName('TipUserWithVote') as `0x${string}`;
const LINKED_ADDRESS = hash.getSelectorFromName('LinkedDefaultStarknetAddressEvent') as `0x${string}`;
const PUSH_ALGO_SCORE = hash.getSelectorFromName('PushAlgoScoreEvent') as `0x${string}`;
const ADD_TOPICS = hash.getSelectorFromName('AddTopicsMetadataEvent') as `0x${string}`;
const NOSTR_METADATA = hash.getSelectorFromName('NostrMetadataEvent') as `0x${string}`;

export default function (config: ApibaraRuntimeConfig & { startingCursor: { orderKey: string } }) {
  return defineIndexer(StarknetStream)({
    streamUrl: config.streamUrl as string,
    startingCursor: {
      orderKey: BigInt(config.startingCursor.orderKey),
    },
    filter: {
      events: [
        {
          address: "0x20f02a8bebe4728add0704b8ffd772595b4ebf03103560e4e23b93bdbf75dec",
          keys: [
            NEW_EPOCH,
            DEPOSIT_REWARDS,
            DISTRIBUTION_REWARDS,
            TIP_USER,
            LINKED_ADDRESS,
            PUSH_ALGO_SCORE,
            ADD_TOPICS,
            NOSTR_METADATA,
          ],
        },
      ],
    },
    plugins: [drizzleStorage({ db })],
    async factory({ block: { events } }) {
      const logger = useLogger();

      if (events.length === 0) {
        return {};
      }

      const daoCreationEvents = events.map((event) => {
        const daoAddress = event.keys[1];

        logger.log('Factory: new DAO Address    : ', `\x1b[35m${daoAddress}\x1b[0m`);
        return {
          address: daoAddress,
        };
      });

      const daoCreationData = events.map((event) => {
        const decodedEvent = decodeEvent({
          abi: scoreFactoryABI,
          event,
          eventName: 'afk::interfaces::score_factory_interfaces::INostrFiScoringFactory::SubCreated',
        });

        const daoAddress = decodedEvent.args.contract_address;
        const creator = decodedEvent.args.creator;
        const tokenAddress = decodedEvent.args.token_contract_address;
        const starknetAddress = decodedEvent.args.starknet_address.toString();

        return {
          number: event.eventIndex,
          hash: event.transactionHash,
          contractAddress: daoAddress as string,
          contract_address: daoAddress as string,
          creator,
          tokenAddress,
          starknetAddress,
        };
      });

      await insertSubState(daoCreationData);

      return {
        filter: {
          events: daoCreationEvents,
        },
      };
    },
    async transform({ block }) {
      const logger = useLogger();
      const { events, header } = block;

      if (events.length === 0) {
        return;
      }

      for (const event of events) {
        logger.log(`Found event ${event.keys[0]}`);
        
        try {
          const decodedEvent = decodeEvent({
            abi: nostrFiScoringABI,
            event,
            eventName: getEventName(event.keys[0]),
          });

          switch (event.keys[0]) {
            case NEW_EPOCH:
              await handleNewEpochEvent(decodedEvent, event.address);
              break;
            case DEPOSIT_REWARDS:
              await handleDepositRewardsEvent(decodedEvent, event.address);
              break;
            case DISTRIBUTION_REWARDS:
              await handleDistributionRewardsEvent(decodedEvent, event.address);
              break;
            case TIP_USER:
              await handleTipUserEvent(decodedEvent, event.address);
              break;
            case LINKED_ADDRESS:
              await handleLinkedAddressEvent(decodedEvent, event.address);
              break;
            case PUSH_ALGO_SCORE:
              await handlePushAlgoScoreEvent(decodedEvent, event.address);
              break;
            case ADD_TOPICS:
              await handleAddTopicsEvent(decodedEvent, event.address);
              break;
            case NOSTR_METADATA:
              await handleNostrMetadataEvent(decodedEvent, event.address);
              break;
          }
        } catch (error: any) {
          logger.error(`Error processing event: ${error.message}`);
        }
      }
    },
  });
}

function getEventName(eventKey: string): string {
  switch (eventKey) {
    case NEW_EPOCH:
      return 'NewEpochEvent';
    case DEPOSIT_REWARDS:
      return 'DepositRewardsByUserEvent';
    case DISTRIBUTION_REWARDS:
      return 'DistributionRewardsByUserEvent';
    case TIP_USER:
      return 'TipUserWithVote';
    case LINKED_ADDRESS:
      return 'LinkedDefaultStarknetAddressEvent';
    case PUSH_ALGO_SCORE:
      return 'PushAlgoScoreEvent';
    case ADD_TOPICS:
      return 'AddTopicsMetadataEvent';
    case NOSTR_METADATA:
      return 'NostrMetadataEvent';
    default:
      throw new Error(`Unknown event key: ${eventKey}`);
  }
}

async function handleNewEpochEvent(event: any, contractAddress: string) {
  await upsertContractState({
    contract_address: contractAddress,
    current_epoch_index: event.current_epoch_index,
    current_epoch_start: new Date(event.start_duration * 1000),
    current_epoch_end: new Date(event.end_duration * 1000),
    current_epoch_duration: event.epoch_duration,
  });

  await upsertEpochState({
    contract_address: contractAddress,
    epoch_index: event.current_epoch_index,
    start_time: new Date(event.start_duration * 1000),
    end_time: new Date(event.end_duration * 1000),
    epoch_duration: event.epoch_duration,
  });
}

async function handleDepositRewardsEvent(event: any, contractAddress: string) {
  await upsertContractState({
    contract_address: contractAddress,
    total_amount_deposit: event.amount_token,
  });

  await upsertEpochState({
    contract_address: contractAddress,
    epoch_index: event.epoch_index,
    total_amount_deposit: event.amount_token,
  });

  if (event.nostr_address) {
    await upsertUserProfile({
      nostr_id: event.nostr_address,
      starknet_address: event.starknet_address,
    });

    await upsertUserEpochState({
      nostr_id: event.nostr_address,
      contract_address: contractAddress,
      epoch_index: event.epoch_index,
    });
  }
}

async function handleDistributionRewardsEvent(event: any, contractAddress: string) {
  await upsertContractState({
    contract_address: contractAddress,
    total_to_claimed: event.amount_total,
  });

  await upsertEpochState({
    contract_address: contractAddress,
    epoch_index: event.epoch_index,
    amount_claimed: event.amount_total,
    amount_algo: event.amount_algo,
    amount_vote: event.amount_vote,
  });

  if (event.nostr_address) {
    await upsertUserProfile({
      nostr_id: event.nostr_address,
      amount_claimed: event.amount_total,
    });

    await upsertUserEpochState({
      nostr_id: event.nostr_address,
      contract_address: contractAddress,
      epoch_index: event.epoch_index,
      amount_claimed: event.amount_total,
    });
  }
}

async function handleTipUserEvent(event: any, contractAddress: string) {
  await upsertContractState({
    contract_address: contractAddress,
    total_tips: event.amount_token,
  });

  await upsertEpochState({
    contract_address: contractAddress,
    epoch_index: event.epoch_index,
    total_tip: event.amount_token,
  });

  if (event.nostr_address) {
    await upsertUserProfile({
      nostr_id: event.nostr_address,
      total_tip: event.amount_token,
    });

    await upsertUserEpochState({
      nostr_id: event.nostr_address,
      contract_address: contractAddress,
      epoch_index: event.epoch_index,
      total_tip: event.amount_token,
    });
  }
}

async function handleLinkedAddressEvent(event: any, contractAddress: string) {
  if (event.nostr_address) {
    await upsertUserProfile({
      nostr_id: event.nostr_address,
      starknet_address: event.starknet_address,
    });
  }
}

async function handlePushAlgoScoreEvent(event: any, contractAddress: string) {
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
}

async function handleAddTopicsEvent(event: any, contractAddress: string) {
  await upsertContractState({
    contract_address: contractAddress,
    topic_metadata: event.topic_metadata,
    main_tag: event.main_tag,
    keyword: event.keyword,
    keywords: event.keywords,
  });
}

async function handleNostrMetadataEvent(event: any, contractAddress: string) {
  await upsertContractState({
    contract_address: contractAddress,
    nostr_metadata: event.nostr_metadata,
    name: event.name,
    about: event.about,
    event_id_nip_29: event.event_id_nip_29,
    event_id_nip_72: event.event_id_nip_72,
  });
} 