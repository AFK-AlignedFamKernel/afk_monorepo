import { db } from 'indexer-v2-db';
import { daoCreation, daoProposal, daoProposalVote } from 'indexer-v2-db/schema';
import { and, eq } from 'drizzle-orm';

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

export async function insertDaoCreation(daoCreationData: DaoCreationData[]) {
  return db.insert(daoCreation).values(daoCreationData).onConflictDoNothing().execute();
}

export async function insertProposal(proposalCreationData: ProposalCreationData) {
  return db.insert(daoProposal).values(proposalCreationData).onConflictDoNothing().execute();
}

export async function updateProposalCancellation(
  contractAddress: string,
  creator: string,
  proposalId: bigint,
) {
  return db
    .update(daoProposal)
    .set({ isCanceled: true })
    .where(
      and(
        eq(daoProposal.contractAddress, contractAddress),
        eq(daoProposal.creator, creator),
        eq(daoProposal.proposalId, proposalId),
      ),
    )
    .execute();
}

export async function updateProposalResult(
  contractAddress: string,
  creator: string,
  proposalId: bigint,
  result: string,
) {
  return db
    .update(daoProposal)
    .set({ result })
    .where(
      and(
        eq(daoProposal.contractAddress, contractAddress),
        eq(daoProposal.creator, creator),
        eq(daoProposal.proposalId, proposalId),
      ),
    )
    .execute();
}

export async function upsertProposalVote(proposalVoteData: ProposalVoteData) {
  return db
    .insert(daoProposalVote)
    .values(proposalVoteData)
    .onConflictDoUpdate({
      target: [daoProposalVote.contractAddress, daoProposalVote.proposalId, daoProposalVote.voter],
      set: { totalVotes: proposalVoteData.totalVotes },
    })
    .execute();
}
