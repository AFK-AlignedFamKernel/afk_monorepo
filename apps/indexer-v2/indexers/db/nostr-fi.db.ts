import { contractState, epochState, userProfile, userEpochState } from '../../../indexer-v2-db/src/schema';
import { and, eq } from 'drizzle-orm';
import { useDrizzleStorage } from '@apibara/plugin-drizzle';

interface ContractStateData {
  contract_address: string;
  network?: string;
  current_epoch_index?: string;
  total_ai_score?: string;
  total_vote_score?: string;
  total_tips?: string;
  total_amount_deposit?: string;
  total_to_claimed?: string;
  percentage_algo_distribution?: number;
  quote_address?: string;
  main_token_address?: string;
  current_epoch_duration?: number;
  current_epoch_start?: Date;
  current_epoch_end?: Date;
  topic_metadata?: any;
  nostr_metadata?: any;
  name?: string;
  about?: string;
  main_tag?: string;
  keyword?: string;
  keywords?: string[];
  event_id_nip_29?: string;
  event_id_nip_72?: string;
}

interface EpochStateData {
  epoch_index: string;
  contract_address: string;
  total_ai_score?: string;
  total_vote_score?: string;
  total_amount_deposit?: string;
  total_tip?: string;
  amount_claimed?: string;
  amount_vote?: string;
  amount_algo?: string;
  epoch_duration?: number;
  start_time?: Date;
  end_time?: Date;
}

interface UserProfileData {
  nostr_id: string;
  starknet_address?: string;
  total_ai_score?: string;
  total_tip?: string;
  total_vote_score?: string;
  amount_claimed?: string;
  is_add_by_admin?: boolean;
}

interface UserEpochStateData {
  nostr_id: string;
  epoch_index: string;
  contract_address: string;
  total_tip?: string;
  total_ai_score?: string;
  total_vote_score?: string;
  amount_claimed?: string;
}

export async function insertSubState(subStates  : ContractStateData[]) {
  const { db } = useDrizzleStorage();
  return db.insert(contractState).values(subStates).onConflictDoNothing();
}

export async function upsertContractState(data: ContractStateData) {
  const { db } = useDrizzleStorage();
  return db
    .insert(contractState)
    .values(data)
    .onConflictDoUpdate({
      target: contractState.contract_address,
      set: {
        ...data,
        updated_at: new Date(),
      },
    });
}

export async function upsertEpochState(data: EpochStateData) {
  const { db } = useDrizzleStorage();
  return db
    .insert(epochState)
    .values(data)
    .onConflictDoUpdate({
      target: [epochState.epoch_index, epochState.contract_address],
      set: {
        ...data,
        updated_at: new Date(),
      },
    });
}

export async function upsertUserProfile(data: UserProfileData) {
  const { db } = useDrizzleStorage();
  return db
    .insert(userProfile)
    .values(data)
    .onConflictDoUpdate({
      target: userProfile.nostr_id,
      set: {
        ...data,
        updated_at: new Date(),
      },
    });
}

export async function upsertUserEpochState(data: UserEpochStateData) {
  const { db } = useDrizzleStorage();
  return db
    .insert(userEpochState)
    .values(data)
    .onConflictDoUpdate({
      target: [userEpochState.nostr_id, userEpochState.epoch_index, userEpochState.contract_address],
      set: {
        ...data,
        updated_at: new Date(),
      },
    });
}

export async function getContractState(contractAddress: string) {
  const { db } = useDrizzleStorage();
  return db
    .select()
    .from(contractState)
    .where(eq(contractState.contract_address, contractAddress))
    .limit(1);
}

export async function getEpochState(contractAddress: string, epochIndex: string) {
  const { db } = useDrizzleStorage();
  return db
    .select()
    .from(epochState)
    .where(
      and(
        eq(epochState.contract_address, contractAddress),
        eq(epochState.epoch_index, epochIndex),
      ),
    )
    .limit(1);
}

export async function getUserProfile(nostrId: string) {
  const { db } = useDrizzleStorage();
  return db
    .select()
    .from(userProfile)
    .where(eq(userProfile.nostr_id, nostrId))
    .limit(1);
}

export async function getUserEpochState(nostrId: string, contractAddress: string, epochIndex: string) {
  const { db } = useDrizzleStorage();
  return db
    .select()
    .from(userEpochState)
    .where(
      and(
        eq(userEpochState.nostr_id, nostrId),
        eq(userEpochState.contract_address, contractAddress),
        eq(userEpochState.epoch_index, epochIndex),
      ),
    )
    .limit(1);
} 