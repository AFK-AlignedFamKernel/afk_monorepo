import { eq } from "drizzle-orm";
import { contractState, epochState, userEpochState, userProfile } from "../schema.js";
import { db } from "../index.js";


export const getSubInfo = async (sub_address: string) => {
  const subInfo = await db.query.contractState.findFirst({
    where: eq(contractState.contract_address, sub_address),
    with: {
      epochs: true,
      // userProfiles: true,
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


export const getUserProfile = async (sub_address: string) => {
  try {
    const userProfileData = await db
      .select({
        nostr_id: userProfile.nostr_id,
        starknet_address: userProfile.starknet_address,
        total_ai_score: userProfile.total_ai_score,
        total_tip: userProfile.total_tip,
        total_vote_score: userProfile.total_vote_score,
        amount_claimed: userProfile.amount_claimed,
        created_at: userProfile.created_at,
        updated_at: userProfile.updated_at,
      })
      .from(userProfile)
      .where(eq(userProfile.contract_address, sub_address))
      .orderBy(userProfile.nostr_id);

    return userProfileData;
  } catch (error) {
    console.error(error);
    // throw error;
  }

};


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
      .orderBy(userEpochState.epoch_index, userEpochState.nostr_id);

    return userEpochStates;
  } catch (error) {
    console.error(error);
    // throw error;
  }

};
