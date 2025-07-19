import { eq } from "drizzle-orm";
import { contractState, epochState, userEpochState } from "../schema";
import { db } from "..";


export const getSubInfo = async (sub_address: string) => {
  const subInfo = await db.query.contractState.findFirst({
    where: eq(contractState.contract_address, sub_address),
    with: {
      epochs: true,
      userProfiles: true,
    },
  });
  return subInfo;
};

export const getEpochStates = async (sub_address: string) => {
  
    try {
        
      const epochStates = await db
        .select({
          epoch_index: epochState.epoch_index,
          contract_address: epochState.contract_address,
          total_ai_score: epochState.total_ai_score,
          total_vote_score: epochState.total_vote_score,
          total_amount_deposit: epochState.total_amount_deposit,
          total_tip: epochState.total_tip,
          amount_claimed: epochState.amount_claimed,
          amount_vote: epochState.amount_vote,
          amount_algo: epochState.amount_algo,
          epoch_duration: epochState.epoch_duration,
          start_time: epochState.start_time,
          end_time: epochState.end_time,
        })
        .from(epochState)
        .where(eq(epochState.contract_address, sub_address))
        .orderBy(epochState.epoch_index);

        return epochStates;
    } catch (error) {
        console.error(error);
        // throw error;
    }
}

export const getUserEpochStates = async (sub_address: string) => {
    try {
                const userEpochStates = await db
        .select({
          nostr_id: userEpochState.nostr_id,
          epoch_index: userEpochState.epoch_index,
          contract_address: userEpochState.contract_address,
          total_tip: userEpochState.total_tip,
          total_ai_score: userEpochState.total_ai_score,
          total_vote_score: userEpochState.total_vote_score,
          amount_claimed: userEpochState.amount_claimed,
          created_at: userEpochState.created_at,
          updated_at: userEpochState.updated_at,
        })
        .from(userEpochState)
        .where(eq(userEpochState.contract_address, sub_address))
        .groupBy(userEpochState.epoch_index);

        return userEpochStates;
    } catch (error) {
        console.error(error);
        // throw error;
    }

};
