import { contractState, epochState, userProfile, userEpochState } from 'indexer-v2-db/schema';
import { and, eq, sql } from 'drizzle-orm';
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

// In nostr-fi.db.ts
export async function insertSubState(subStates: ContractStateData[]) {
  try {
    const { db } = useDrizzleStorage();
    
    // Validate input data
    if (!Array.isArray(subStates) || subStates.length === 0) {
      throw new Error('Invalid input: subStates must be a non-empty array');
    }

    // Validate required fields
    subStates.forEach((state, index) => {
      if (!state.contract_address) {
        throw new Error(`Missing contract_address in item ${index}`);
      }
    });

    // // First try to remove existing trigger if it exists
    // await db.execute(
    //   'DROP TRIGGER IF EXISTS dao_creation_reorg_indexer_dao_factory_default ON dao_creation'
    // );

    // Then perform the insert
    const result = await db.insert(contractState)
      .values(subStates)
      .onConflictDoNothing();

    return result;
  } catch (error) {
    // Structured error logging
    const errorInfo = {
      operation: 'insertSubState',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      data: subStates.map(s => s.contract_address) // Log only necessary info
    };
    console.error('Database operation failed:', errorInfo);
    
    // Rethrow with context but don't crash
    throw new Error(`Failed to insert contract states: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// export async function insertSubState(subStates  : ContractStateData[]) {
//   try {
//     const { db } = useDrizzleStorage();
//     return db.insert(contractState).values(subStates as any).onConflictDoNothing();
//   } catch (error) {
//     console.log("error insertSubState", error);
//   }
// }


// Add this to nostr-fi.db.ts
export async function getLastProcessedCursor() {
  try {
    const { db } = useDrizzleStorage();
    // const result = await db.execute(
    //   sql`SELECT MAX(block_number) as last_block FROM contract_state`
    // );
    const last_block = await db.execute(sql`SELECT MAX(block_number) as last_block FROM contract_state`);
    return last_block;
  } catch (error) {
    console.error('Error getting last processed cursor:', error);
    return null;
  }
}

export async function saveCursor(blockNumber: string, blockHash: string) {
  try {
    const { db } = useDrizzleStorage();
    await db.execute(
      sql`INSERT INTO indexer_cursor (block_number, block_hash, updated_at) VALUES (${blockNumber}, ${blockHash}, NOW())`
    );
  } catch (error) {
    console.error('Error saving cursor:', error);
  }
}


export async function upsertContractState(data: ContractStateData) {
  try {
    const { db } = useDrizzleStorage();
    return db
      .insert(contractState)
    .values(data as any)
    .onConflictDoUpdate({
      target: contractState.contract_address,
      set: {
          ...data,
          updated_at: new Date(),
        },
      });
  } catch (error) {
    console.log("error upsertContractState", error);
  }
}

export async function upsertEpochState(data: EpochStateData) {
  try {
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
  } catch (error) {
    console.log("error upsertEpochState", error);
  }
}

export async function upsertUserProfile(data: UserProfileData) {
  try {
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
  } catch (error) {
    console.log("error upsertUserProfile", error);
  }
}

export async function upsertUserEpochState(data: UserEpochStateData) {
  try {
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
  } catch (error) {
    console.log("error upsertUserEpochState", error);
  }
}

export async function getContractState(contractAddress: string) {
  try { 
    const { db } = useDrizzleStorage();
  return db
    .select()
    .from(contractState)
    .where(eq(contractState.contract_address, contractAddress))
    .limit(1);
  } catch (error) {
    console.log("error getContractState", error);
  }
}

export async function getEpochState(contractAddress: string, epochIndex: string) {
  try {
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
  } catch (error) {
    console.log("error getEpochState", error);
  }
}

export async function getUserProfile(nostrId: string) {
  try {
    const { db } = useDrizzleStorage();
    return db
      .select()
      .from(userProfile)
      .where(eq(userProfile.nostr_id, nostrId))
      .limit(1);
  } catch (error) {
    console.log("error getUserProfile", error);
  }
}

export async function getUserEpochState(nostrId: string, contractAddress: string, epochIndex: string) {
  try {
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
  } catch (error) {
    console.log("error getUserEpochState", error);
  }
} 