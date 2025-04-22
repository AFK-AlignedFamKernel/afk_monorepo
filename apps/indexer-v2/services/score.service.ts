
import { Abi, decodeEvent, StarknetStream } from '@apibara/starknet';
import { encode, hash } from 'starknet';

import {
  upsertContractState,
  upsertEpochState,
  upsertUserProfile,
  upsertUserEpochState,
  insertSubState,
  saveCursor,
} from '../indexers/db/nostr-fi.db';
import { formatUnits } from 'viem';

import { ABI as nostrFiScoringABI } from '../indexers/abi/infofi/score.abi';

export const SUB_CREATED = hash.getSelectorFromName('TopicEvent') as `0x${string}`;
export const NEW_EPOCH = hash.getSelectorFromName('NewEpochEvent') as `0x${string}`;
export const DEPOSIT_REWARDS = hash.getSelectorFromName('DepositRewardsByUserEvent') as `0x${string}`;
export const DISTRIBUTION_REWARDS = hash.getSelectorFromName('DistributionRewardsByUserEvent') as `0x${string}`;
export const TIP_USER = hash.getSelectorFromName('TipUserWithVote') as `0x${string}`;
export const LINKED_ADDRESS = hash.getSelectorFromName('LinkedDefaultStarknetAddressEvent') as `0x${string}`;
export const PUSH_ALGO_SCORE = hash.getSelectorFromName('PushAlgoScoreEvent') as `0x${string}`;
export const ADD_TOPICS = hash.getSelectorFromName('AddTopicsMetadataEvent') as `0x${string}`;
export const NOSTR_METADATA = hash.getSelectorFromName('NostrMetadataEvent') as `0x${string}`;

const KNOWN_EVENT_KEYS = [
  NEW_EPOCH,
  DEPOSIT_REWARDS,
  DISTRIBUTION_REWARDS,
  TIP_USER,
  LINKED_ADDRESS,
  PUSH_ALGO_SCORE,
  ADD_TOPICS,
  NOSTR_METADATA,
]



export const handleEvent = async (event: any, contractAddress: string) => {
  const eventName = getEventName(event.keys[0]);
  if (!KNOWN_EVENT_KEYS.includes(event.keys[0])) {
    console.log("event not found", event.keys[0]);
    return;
  }
  if (event?.keys[0] == encode.sanitizeHex(NEW_EPOCH)) {

    console.log("NEW_EPOCH");
    const decodedEvent = decodeEvent({
      abi: nostrFiScoringABI as Abi,
      event,
      eventName: eventName ?? "afk::interfaces::nostrfi_scoring_interfaces::NewEpochEvent",
    });
    console.log("decodedEvent", decodedEvent);

    return await handleNewEpochEvent(decodedEvent, event.address);
  }
  else if (event?.keys[0] == encode.sanitizeHex(NOSTR_METADATA)) {
    console.log("event find",);
    console.log("NOSTR_METADATA",);

    const decodedEvent = decodeEvent({
      abi: nostrFiScoringABI as Abi,
      event,
      eventName: eventName ?? "afk::interfaces::nostrfi_scoring_interfaces::NostrMetadataEvent",
    });
    console.log("decodedEvent", decodedEvent);
    return await handleNostrMetadataEvent(decodedEvent, event.address);
  } else if (event?.keys[0] == encode.sanitizeHex(DEPOSIT_REWARDS)) {
    console.log("DEPOSIT_REWARDS");
    console.log("event find",);

    const decodedEvent = decodeEvent({
      abi: nostrFiScoringABI as Abi,
      event,
      eventName: eventName ?? "afk::interfaces::nostrfi_scoring_interfaces::DepositRewardsByUserEvent",
    });
    console.log("decodedEvent", decodedEvent);
    return await handleDepositRewardsEvent(decodedEvent, event.address);
  } else if (event?.keys[0] == encode.sanitizeHex(DISTRIBUTION_REWARDS)) {
    console.log("DISTRIBUTION_REWARDS");
    console.log("event find",);

    const decodedEvent = decodeEvent({
      abi: nostrFiScoringABI as Abi,
      event,
      eventName: eventName ?? "afk::interfaces::nostrfi_scoring_interfaces::DistributionRewardsByUserEvent",
    });
    console.log("decodedEvent", decodedEvent);
    return await handleDistributionRewardsEvent(decodedEvent, event.address);
  } else if (event?.keys[0] == encode.sanitizeHex(TIP_USER)) {
    console.log("TipUserWithVote",);
    console.log("TIP_USER",);
    console.log("event find",);

    const decodedEvent = decodeEvent({
      abi: nostrFiScoringABI as Abi,
      event,
      eventName: eventName ?? "afk::interfaces::nostrfi_scoring_interfaces::TipUserWithVote",
    });
    console.log("decodedEvent", decodedEvent);

    return await handleTipUserEvent(decodedEvent, event.address);
  } else if (event?.keys[0] == encode.sanitizeHex(LINKED_ADDRESS)) {
    console.log("LINKED_ADDRESS");
    console.log("event find",);

    const decodedEvent = decodeEvent({
      abi: nostrFiScoringABI as Abi,
      event,
      eventName: eventName ?? "afk::interfaces::nostrfi_scoring_interfaces::LinkedDefaultStarknetAddressEvent",
    });
    console.log("decodedEvent", decodedEvent);
    console.log("LINKED_ADDRESS", decodedEvent);
    return await handleLinkedAddressEvent(decodedEvent, event.address);
  } else if (event?.keys[0] == encode.sanitizeHex(PUSH_ALGO_SCORE)) {
    console.log("PUSH_ALGO_SCORE");
    console.log("event find",);

    const decodedEvent = decodeEvent({
      abi: nostrFiScoringABI as Abi,
      event,
      eventName: eventName ?? "afk::interfaces::nostrfi_scoring_interfaces::PushAlgoScoreEvent",
    });
    console.log("decodedEvent", decodedEvent);
      return await handlePushAlgoScoreEvent(decodedEvent, event.address);
  } else if (event?.keys[0] == encode.sanitizeHex(ADD_TOPICS)) {
    console.log("event find",);
    console.log("ADD_TOPICS");

    const decodedEvent = decodeEvent({
      abi: nostrFiScoringABI as Abi,
      event,
      eventName: eventName ?? "afk::interfaces::nostrfi_scoring_interfaces::AddTopicsMetadataEvent",
    });
    console.log("decodedEvent", decodedEvent);
    return await handleAddTopicsEvent(decodedEvent, event.address);
  }
  else if (!eventName) {
    // logger.warn(`Skipping unknown event key: ${event.keys[0]}`);
    return undefined;
  }
}

function getEventName(eventKey: string): string | undefined {
  // console.log("eventKey", eventKey);
  // console.log("encode.sanitizeHex(NEW_EPOCH)", encode.sanitizeHex(NEW_EPOCH));
  // console.log("encode.sanitizeHex(DEPOSIT_REWARDS)", encode.sanitizeHex(DEPOSIT_REWARDS));
  // console.log("encode.sanitizeHex(DISTRIBUTION_REWARDS)", encode.sanitizeHex(DISTRIBUTION_REWARDS));
  // console.log("encode.sanitizeHex(TIP_USER)", encode.sanitizeHex(TIP_USER));
  // console.log("encode.sanitizeHex(LINKED_ADDRESS)", encode.sanitizeHex(LINKED_ADDRESS));
  // console.log("encode.sanitizeHex(PUSH_ALGO_SCORE)", encode.sanitizeHex(PUSH_ALGO_SCORE));
  // console.log("encode.sanitizeHex(ADD_TOPICS)", encode.sanitizeHex(ADD_TOPICS));
  // console.log("encode.sanitizeHex(NOSTR_METADATA)", encode.sanitizeHex(NOSTR_METADATA));
  // switch (eventKey) {
  //   case NEW_EPOCH:
  //     return 'afk::interfaces::nostrfi_scoring_interfaces::NewEpochEvent';
  //   case DEPOSIT_REWARDS:
  //     return 'afk::interfaces::nostrfi_scoring_interfaces::DepositRewardsByUserEvent';
  //   case DISTRIBUTION_REWARDS:
  //     return 'afk::interfaces::nostrfi_scoring_interfaces::DistributionRewardsByUserEvent';
  //   case TIP_USER:
  //     return 'afk::interfaces::nostrfi_scoring_interfaces::TipUserWithVote';
  //   case LINKED_ADDRESS:
  //     return 'afk::interfaces::nostrfi_scoring_interfaces::LinkedDefaultStarknetAddressEvent';
  //   case PUSH_ALGO_SCORE:
  //     return 'afk::interfaces::nostrfi_scoring_interfaces::PushAlgoScoreEvent';
  //   case ADD_TOPICS:
  //     return 'afk::interfaces::nostrfi_scoring_interfaces::AddTopicsMetadataEvent';
  //   case NOSTR_METADATA:
  //     return 'afk::interfaces::nostrfi_scoring_interfaces::NostrMetadataEvent';
  //   default:
  //     return undefined;
  //   // throw new Error(`Unknown event key: ${eventKey}`);
  // }
  switch (eventKey) {
    case encode.sanitizeHex(NEW_EPOCH):
      return 'afk::interfaces::nostrfi_scoring_interfaces::NewEpochEvent';
    case encode.sanitizeHex(DEPOSIT_REWARDS):
      return 'afk::interfaces::nostrfi_scoring_interfaces::DepositRewardsByUserEvent';
    case encode.sanitizeHex(DISTRIBUTION_REWARDS):
      return 'afk::interfaces::nostrfi_scoring_interfaces::DistributionRewardsByUserEvent';
    case encode.sanitizeHex(TIP_USER):
      return 'afk::interfaces::nostrfi_scoring_interfaces::TipUserWithVote';
    case encode.sanitizeHex(LINKED_ADDRESS):
      return 'afk::interfaces::nostrfi_scoring_interfaces::LinkedDefaultStarknetAddressEvent';
    case encode.sanitizeHex(PUSH_ALGO_SCORE):
      return 'afk::interfaces::nostrfi_scoring_interfaces::PushAlgoScoreEvent';
    case encode.sanitizeHex(ADD_TOPICS):
      return 'afk::interfaces::nostrfi_scoring_interfaces::AddTopicsMetadataEvent';
    case encode.sanitizeHex(NOSTR_METADATA):
      return 'afk::interfaces::nostrfi_scoring_interfaces::NostrMetadataEvent';
    default:
      return undefined;
    // throw new Error(`Unknown event key: ${eventKey}`);
  }
}

async function handleNewEpochEvent(event: any, contractAddress: string) {
  try {
    const contractResult = await upsertContractState({
      contract_address: contractAddress,
      current_epoch_index: event.current_epoch_index,
      current_epoch_start: new Date(formatUnits(event.start_duration, 18)),
      current_epoch_end: new Date(formatUnits(event.end_duration, 18)),
      current_epoch_duration: event.epoch_duration,
    });

    if (!contractResult) {
      console.error("Failed to update contract state");
    }

    const epochResult = await upsertEpochState({
      contract_address: contractAddress,
      epoch_index: event.current_epoch_index,
      start_time: new Date(event.start_duration * 1000),
      end_time: new Date(event.end_duration * 1000),
      epoch_duration: event.epoch_duration,
    });

    if (!epochResult) {
      console.error("Failed to update epoch state");
    }
  } catch (error) {
    console.error("Error in handleNewEpochEvent:", error);
    // Continue processing other events
  }
}

async function handleDepositRewardsEvent(event: any, contractAddress: string) {
  try {
    console.log("handleDepositRewardsEvent", event);
    let amountTokenBn = event.args?.amount_token;
    let amountToken = formatUnits(amountTokenBn, 18);
    console.log("amountToken", amountToken);
    await upsertContractState({
      contract_address: contractAddress,
      total_amount_deposit: amountToken,
    });

    await upsertEpochState({
      contract_address: contractAddress,
      epoch_index: event.args?.epoch_index,
      total_amount_deposit: amountToken,
    });

    if (event.nostr_address) {
      await upsertUserProfile({
        nostr_id: event.args?.nostr_address,
        starknet_address: event.args?.starknet_address,
      });

      await upsertUserEpochState({
        nostr_id: event.args?.nostr_address,
        contract_address: contractAddress,
        epoch_index: event.args?.epoch_index,
      });
    }
  } catch (error) {
    console.log("error handleDepositRewardsEvent", error);
  }
}

async function handleDistributionRewardsEvent(event: any, contractAddress: string) {
  try {
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
  } catch (error) {
    console.log("error handleDistributionRewardsEvent", error);
  }
}

async function handleTipUserEvent(event: any, contractAddress: string) {
  try {
    console.log("handleTipUserEvent", event);
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
  } catch (error) {
    console.log("error handleTipUserEvent", error);
  }
}

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
