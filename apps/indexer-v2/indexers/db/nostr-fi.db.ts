import { contractState, epochState, userProfile, userEpochState } from 'indexer-v2-db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { useDrizzleStorage } from '@apibara/plugin-drizzle';
import { randomUUID } from 'crypto';

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
  const { db } = useDrizzleStorage();
  try {
    console.log("upsertContractState", data);
    return db.insert(contractState).values(data).
      // .onConflictDoNothing();
      onConflictDoUpdate({
        target: contractState.contract_address,
        set: {
          ...data,
          updated_at: new Date(),
        },
      });
    // const tx = await db.transaction(async (tx) => {
    //   const result = await tx
    //     .insert(contractState)
    //     .values({
    //       ...data,
    //       created_at: new Date(),
    //       updated_at: new Date(),
    //       id: randomUUID(),
    //     })
    //     .onConflictDoUpdate({
    //       target: contractState.contract_address,
    //       set: {
    //         ...data,
    //         updated_at: new Date(),
    //       },
    //     });
    //   return result;
    // });
    // return tx;
  } catch (error) {
    console.error("Error in upsertContractState:", error);
    return null; // Return null instead of crashing
  }
}

export async function upsertEpochState(data: EpochStateData) {
  const { db } = useDrizzleStorage();
  try {
    console.log("upsertEpochState", data);
    return db.insert(epochState)
      .values({
        epoch_index: data.epoch_index,
        contract_address: data.contract_address,
        total_ai_score: data.total_ai_score,
        total_vote_score: data.total_vote_score,
        total_amount_deposit: data.total_amount_deposit,
        total_tip: data.total_tip,
        amount_claimed: data.amount_claimed,
        amount_vote: data.amount_vote,
        amount_algo: data.amount_algo,
        epoch_duration: data.epoch_duration,
        start_time: data.start_time,
        end_time: data.end_time,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: [epochState.epoch_index, epochState.contract_address],
        set: {
          total_ai_score: data.total_ai_score,
          total_vote_score: data.total_vote_score,
          total_amount_deposit: data.total_amount_deposit,
          total_tip: data.total_tip,
          amount_claimed: data.amount_claimed,
          amount_vote: data.amount_vote,
          amount_algo: data.amount_algo,
          epoch_duration: data.epoch_duration,
          start_time: data.start_time,
          end_time: data.end_time,
          updated_at: new Date(),
        },
      });
  } catch (error) {
    console.error("Error in upsertEpochState:", error);
    return null;
  }
}

export async function upsertUserProfile(data: UserProfileData) {
  const { db } = useDrizzleStorage();
  try {
    return db.insert(userProfile).values(data).onConflictDoNothing();
    // const tx = await db.transaction(async (tx) => {
    //   const result = await tx
    //     .insert(userProfile)
    //     .values({
    //       ...data,
    //       created_at: new Date(),
    //       updated_at: new Date(),
    //       id: randomUUID(),
    //     })
    //     .onConflictDoUpdate({
    //       target: userProfile.nostr_id,
    //       set: {
    //         ...data,
    //         updated_at: new Date(),
    //       },
    //     });
    //   return result;
    // });
    // return tx;
  } catch (error) {
    console.error("Error in upsertUserProfile:", error);
    return null; // Return null instead of crashing
  }
}

export async function upsertUserEpochState(data: UserEpochStateData) {
  const { db } = useDrizzleStorage();
  try {
    return db.insert(userEpochState).values(data).
      // onConflictDoNothing();
      onConflictDoUpdate({
        target: [userEpochState.nostr_id, userEpochState.epoch_index, userEpochState.contract_address],
        set: {
          ...data,
          updated_at: new Date(),
        },
      });
    // const tx = await db.transaction(async (tx) => {
    //   const result = await tx
    //     .insert(userEpochState)
    //     .values({
    //       nostr_id: data.nostr_id,
    //       epoch_index: data.epoch_index,
    //       contract_address: data.contract_address,
    //       total_tip: data.total_tip,
    //       total_ai_score: data.total_ai_score,
    //       total_vote_score: data.total_vote_score,
    //       amount_claimed: data.amount_claimed,
    //       created_at: new Date(),
    //       updated_at: new Date(),
    //     })
    //     .onConflictDoUpdate({
    //       target: [userEpochState.nostr_id, userEpochState.epoch_index, userEpochState.contract_address],
    //       set: {
    //         total_tip: data.total_tip,
    //         total_ai_score: data.total_ai_score,
    //         total_vote_score: data.total_vote_score,
    //         amount_claimed: data.amount_claimed,
    //         updated_at: new Date(),
    //       },
    //     });
    //   return result;
    // });
    // return tx;
  } catch (error) {
    console.error("Error in upsertUserEpochState:", error);
    return null;
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