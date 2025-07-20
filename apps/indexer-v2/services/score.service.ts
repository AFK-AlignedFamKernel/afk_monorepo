
import { Abi, decodeEvent, StarknetStream } from '@apibara/starknet';
import { byteArray, encode, hash, uint256 } from 'starknet';

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
export const TIP_USER_WITH_VOTE = "0x00d8310ad187f4cc2574733c2d55959bcf36b83d4f1594a7edb5ca0706a612bf";
export const KNOWN_EVENT_KEYS = [
  NEW_EPOCH,
  DEPOSIT_REWARDS,
  DISTRIBUTION_REWARDS,
  TIP_USER,
  LINKED_ADDRESS,
  PUSH_ALGO_SCORE,
  ADD_TOPICS,
  NOSTR_METADATA,
  TIP_USER_WITH_VOTE,
]

export const handleEvent = async (event: any, contractAddress: string) => {
  console.log("event.keys[0]", event.keys[0]);
  let eventName = getEventName(event.keys[0]);
  console.log("eventName", eventName);

  if (eventName) {
    eventName = getEventName(encode.sanitizeHex(event.keys[0]));
  }

  console.log("eventName", eventName);

  console.log("encode.sanitizeHex(event.keys[0])", encode.sanitizeHex(event.keys[0]));
  if (!KNOWN_EVENT_KEYS.includes(event.keys[0])) {
    console.log("event not found", event.keys[0]);
    // return;
  }

  console.log("KNOWN_EVENT_KEYS", KNOWN_EVENT_KEYS);

  if (!KNOWN_EVENT_KEYS.includes(encode.sanitizeHex(event.keys[0]))) {
    console.log("event not found", event.keys[0]);
    // return;
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
  } else if (event?.keys[0] == encode.sanitizeHex(LINKED_ADDRESS) || event?.keys[0] == LINKED_ADDRESS || encode.sanitizeHex(event?.keys[0]) == LINKED_ADDRESS || LINKED_ADDRESS.includes(event.keys[0].slice(4, 64))) {
    console.log("LINKED_ADDRESS");
    console.log("event find",);

    const decodedEvent = decodeEvent({
      abi: nostrFiScoringABI as Abi,
      event,
      eventName: eventName ?? "afk::interfaces::nostrfi_scoring_interfaces::LinkedDefaultStarknetAddressEvent",
      // eventName: eventName ?? "afk::infofi::nostrfi_scoring::NostrFiScoring::LinkedDefaultStarknetAddressEvent",
    });
    console.log("decodedEvent", decodedEvent);
    console.log("decodedEvent.args", decodedEvent?.args);
    console.log("decodedEvent.args.nostr_address", decodedEvent?.args?.nostr_address);
    console.log("decodedEvent.args.starknet_address", decodedEvent?.args?.starknet_address);
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
  else if (event?.keys[0] == encode.sanitizeHex(TIP_USER)) {
    console.log("TIP_USER");
    console.log("event find",);

    const decodedEvent = decodeEvent({
      abi: nostrFiScoringABI as Abi,
      event,
      eventName: eventName ?? "afk::interfaces::nostrfi_scoring_interfaces::TipUserWithVote",
    });
    console.log("decodedEvent", decodedEvent);
    return await handleTipUserEvent(decodedEvent, event.address);
  }
  else if (event?.keys[0] == encode.sanitizeHex(TIP_USER_WITH_VOTE)) {
    console.log("TIP_USER_WITH_VOTE");
    console.log("event find",);

    const decodedEvent = decodeEvent({
      abi: nostrFiScoringABI as Abi,
      event,
      eventName: eventName ?? "afk::interfaces::nostrfi_scoring_interfaces::TipUserWithVote",
    });
    console.log("decodedEvent", decodedEvent);
    return await handleTipUserEvent(decodedEvent, event.address);
  }
  // else {
  //   console.log("TIP_USER");
  //   console.log("event else issue sanitize",);

  //   const decodedEvent = decodeEvent({
  //     abi: nostrFiScoringABI as Abi,
  //     event,
  //     eventName: eventName ?? "afk::interfaces::nostrfi_scoring_interfaces::TipUserWithVote",
  //   });
  //   console.log("decodedEvent", decodedEvent);
  //   await handleTipUserEvent(decodedEvent, event.address);
  // }
  if (!eventName) {
    console.log("event keys", event.keys[0]);
    console.log("TIP_USER is this why", TIP_USER);
    console.log("TIP_USER is this why encode", encode.sanitizeHex(TIP_USER));
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
    console.log("handleNewEpochEvent", event);
    let startDurationBn = event?.args?.start_duration;
    let endDurationBn = event?.args?.end_duration;
    let epochDurationBn = event?.args?.epoch_duration;

    // Convert BigInt timestamps to numbers (Unix timestamps are in seconds)
    let startDuration = Number(startDurationBn);
    let endDuration = Number(endDurationBn);
    let epochDuration = Number(epochDurationBn);

    console.log("startDuration", startDuration);
    console.log("endDuration", endDuration);
    console.log("epochDuration", epochDuration);

    // Convert Unix timestamps to Date objects (multiply by 1000 for milliseconds)
    let startDurationDate = new Date(startDuration * 1000);
    let endDurationDate = new Date(endDuration * 1000);

    console.log("startDurationDate", startDurationDate);
    console.log("endDurationDate", endDurationDate);

    const contractResult = await upsertContractState({
      contract_address: contractAddress,
      current_epoch_index: event.args?.current_index_epoch,
      current_epoch_start: startDurationDate,
      current_epoch_end: endDurationDate,
      current_epoch_duration: epochDuration,
    });

    if (!contractResult) {
      console.error("Failed to update contract state");
    }

    const epochResult = await upsertEpochState({
      contract_address: contractAddress,
      epoch_index: event.args?.current_index_epoch,
      start_time: startDurationDate,
      end_time: endDurationDate,
      epoch_duration: epochDuration,
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

    let amountTokenBn = event.args?.amount_token;
    let amountToken = formatUnits(amountTokenBn, 18);
    const nostrAddressUint256 = event.args?.nostr_address;
    const nostrAddress = uint256.bnToUint256(nostrAddressUint256);
    console.log("nostrAddress", nostrAddress);
    await upsertEpochState({
      contract_address: contractAddress,
      epoch_index: event.args?.epoch_index,
      amount_claimed: amountToken,
      amount_algo: formatUnits(event.args?.amount_algo ?? 0, 18),
      amount_vote: formatUnits(event.args?.amount_vote ?? 0, 18),
    });

    if (nostrAddress) {
      await upsertUserProfile({
        nostr_id: nostrAddress.toString(),
        amount_claimed: amountToken,
      });

      await upsertUserEpochState({
        nostr_id: nostrAddress.toString(),
        contract_address: contractAddress,
        epoch_index: event.args?.epoch_index,
        amount_claimed: amountToken,
      });
    }
  } catch (error) {
    console.log("error handleDistributionRewardsEvent", error);
  }
}

async function handleTipUserEvent(event: any, contractAddress: string) {
  try {
    console.log("handleTipUserEvent", event);

    const amountTokenBn = event.args?.amount_token;
    const amountToken = formatUnits(amountTokenBn, 18);
    await upsertContractState({
      contract_address: contractAddress,
      total_tips: amountToken,
    });

    await upsertEpochState({
      contract_address: contractAddress,
      epoch_index: event.args?.current_index_epoch,
      total_tip: amountToken,
    });

    if (event.nostr_address) {
      await upsertUserProfile({
        nostr_id: event.args?.nostr_address,
        total_tip: amountToken,
      });

      await upsertUserEpochState({
        nostr_id: event.args?.nostr_address,
        contract_address: contractAddress,
        epoch_index: event.args?.epoch_index,
        total_tip: amountToken,
      });
    }
  } catch (error) {
    console.log("error handleTipUserEvent", error);
  }
}

async function handleLinkedAddressEvent(event: any, contractAddress: string) {
  try {
    console.log("handleLinkedAddressEvent", event);
    console.log("event.args", event?.args);

    if (event?.args?.nostr_address) {
      // Convert BigInt to string if needed
      const nostrAddress = typeof event.args.nostr_address === 'bigint'
        // Convert BigInt to readable nostr schnorr public key (hex string, 64 chars, no 0x)
        ? event.args.nostr_address.toString(16).padStart(64, '0')
        : event.args.nostr_address;

      console.log("nostrAddress", nostrAddress);

      const starknetAddress = typeof event.args.starknet_address === 'bigint'
        ? event.args.starknet_address.toString()
        : event.args.starknet_address;

      console.log("Processing nostr_address:", nostrAddress);
      console.log("Processing starknet_address:", starknetAddress);
      console.log("nostr_address type:", typeof nostrAddress);
      console.log("starknet_address type:", typeof starknetAddress);

      const result = await upsertUserProfile({
        nostr_id: nostrAddress,
        starknet_address: starknetAddress,
        contract_address: contractAddress,
      });

      console.log("upsertUserProfile result:", result);
    } else {
      console.log("No nostr_address found in event.args");
    }
    console.log("handleLinkedAddressEvent end");
  } catch (error) {
    console.log("error handleLinkedAddressEvent", error);
    console.error("Full error details:", error);
  }
}

async function handlePushAlgoScoreEvent(event: any, contractAddress: string) {
  try {
    await upsertContractState({
      contract_address: contractAddress,
      total_ai_score: event?.args?.total_ai_score,
    });

    await upsertEpochState({
      contract_address: contractAddress,
      epoch_index: event?.args?.epoch_index,
      total_ai_score: event?.args?.total_ai_score,
    });

    if (event.nostr_address) {
      await upsertUserProfile({
        nostr_id: event?.args?.nostr_address,
        total_ai_score: event?.args?.total_ai_score,
      });

      await upsertUserEpochState({
        nostr_id: event?.args?.nostr_address,
        contract_address: contractAddress,
        epoch_index: event?.args?.epoch_index,
        total_ai_score: event?.args?.total_ai_score,
      });
    }
  } catch (error) {
    console.log("error handlePushAlgoScoreEvent", error);
  }
}

async function handleAddTopicsEvent(event: any, contractAddress: string) {
  try {
    console.log("handleAddTopicsEvent event", event);
    
    // Convert byte arrays to strings, with fallbacks
    const topicMetadata = event?.args?.topic_metadata 
      ? byteArray.stringFromByteArray(event.args.topic_metadata)
      : "";
    const mainTag = event?.args?.main_tag 
      ? byteArray.stringFromByteArray(event.args.main_tag)
      : "";
    const keyword = event?.args?.keyword 
      ? byteArray.stringFromByteArray(event.args.keyword)
      : "";
    
    console.log("Converted values:", {
      topicMetadata,
      mainTag,
      keyword
    });
    
    await upsertContractState({
      contract_address: contractAddress,
      topic_metadata: topicMetadata,
      main_tag: mainTag,
      keyword: keyword,
    });
  } catch (error) {
    console.log("error handleAddTopicsEvent", error);
    console.error("Full error details:", error);
  }
}

async function handleNostrMetadataEvent(event: any, contractAddress: string) {
  try {
    console.log("handleNostrMetadataEvent event", event);
    
    // Convert BigInt values to strings
    const eventIdNip29 = event?.args?.event_id_nip_29 
      ? event.args.event_id_nip_29.toString() 
      : "0";
    const eventIdNip72 = event?.args?.event_id_nip_72 
      ? event.args.event_id_nip_72.toString() 
      : "0";
    
    // Convert byte arrays to strings, with fallbacks
    const mainTag = event?.args?.main_tag 
      ? byteArray.stringFromByteArray(event.args.main_tag)
      : "";
    const about = event?.args?.about 
      ? byteArray.stringFromByteArray(event.args.about)
      : "";
    
    console.log("Converted values:", {
      mainTag,
      about,
      eventIdNip29,
      eventIdNip72
    });
    
    await upsertContractState({
      contract_address: contractAddress,
      name: mainTag,
      about: about,
      event_id_nip_29: eventIdNip29,
      event_id_nip_72: eventIdNip72,
      main_tag: mainTag,
    });
  } catch (error) {
    console.log("error handleNostrMetadataEvent", error);
    console.error("Full error details:", error);
  }
}
