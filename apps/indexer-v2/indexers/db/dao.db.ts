import { daoCreation, daoProposal, daoProposalVote } from 'indexer-v2-db/schema';
import { and, eq } from 'drizzle-orm';
import { useDrizzleStorage } from '@apibara/plugin-drizzle';
import { sql } from 'drizzle-orm';

interface DaoCreationData {
  number: number;
  hash: string;
  contractAddress: string;
  creator: string;
  tokenAddress: string;
  starknetAddress: string;
}

interface ProposalCreationData {
  contractAddress: string;
  proposalId: bigint;
  creator: string;
  createdAt: number;
  endAt: number;
}

interface ProposalVoteData {
  contractAddress: string;
  proposalId: bigint;
  voter: string;
  totalVotes: bigint;
  votedAt: number;
}

export async function insertDaoCreation(daoCreationData: any[]) {
  const { db } = useDrizzleStorage();
  try {
    // First try to remove existing trigger if it exists
    await db.execute(
      sql`DROP TRIGGER IF EXISTS dao_creation_reorg_indexer_dao_factory_default ON dao_creation`
    );
    
    // Then perform the insert
    return db.insert(daoCreation)
      .values(daoCreationData)
      .onConflictDoNothing();
  } catch (error) {
    console.error('Error in insertDaoCreation:', error);
    throw error;
  }
}

export async function insertProposal(proposalCreationData: ProposalCreationData) {
  try {
    const { db } = useDrizzleStorage();
    return db.insert(daoProposal).values(proposalCreationData).onConflictDoNothing();
  } catch (error) {
    console.log("error insertProposal", error);
  }
}

export async function updateProposalCancellation(
  contractAddress: string,
  creator: string,
  proposalId: bigint,
) {
  try {
    const { db } = useDrizzleStorage();
    return db
      .update(daoProposal)
      .set({ isCanceled: true })
      .where(
      and(
        eq(daoProposal.contractAddress, contractAddress),
        eq(daoProposal.creator, creator),
        eq(daoProposal.proposalId, proposalId),
      ),
    );
  } catch (error) {
    console.log("error updateProposalCancellation", error);
  }
}

export async function updateProposalResult(
  contractAddress: string,
  creator: string,
  proposalId: bigint,
  result: string,
) {
  try {
    const { db } = useDrizzleStorage();
    return db
      .update(daoProposal)
      .set({ result })
      .where(
      and(
        eq(daoProposal.contractAddress, contractAddress),
        eq(daoProposal.creator, creator),
        eq(daoProposal.proposalId, proposalId),
      ),
    );
  } catch (error) { 
    console.log("error updateProposalResult", error);
  }
  }

export async function upsertProposalVote(proposalVoteData: ProposalVoteData) {
  try {
    const { db } = useDrizzleStorage();
  return db
    .insert(daoProposalVote)
    .values(proposalVoteData)
    .onConflictDoUpdate({
      target: [daoProposalVote.contractAddress, daoProposalVote.proposalId, daoProposalVote.voter],
      set: { totalVotes: proposalVoteData.totalVotes },
    });
  } catch (error) {
    console.log("error upsertProposalVote", error);
  }
}
