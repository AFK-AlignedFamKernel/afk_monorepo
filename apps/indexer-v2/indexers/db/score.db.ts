import { daoCreation, daoProposal, daoProposalVote } from 'indexer-v2-db/schema';
import { and, eq } from 'drizzle-orm';
import { useDrizzleStorage } from '@apibara/plugin-drizzle';

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
  const { db } = useDrizzleStorage();
  return db.insert(daoCreation).values(daoCreationData).onConflictDoNothing();
}

export async function insertProposal(proposalCreationData: ProposalCreationData) {
  const { db } = useDrizzleStorage();
  return db.insert(daoProposal).values(proposalCreationData).onConflictDoNothing();
}

export async function updateProposalCancellation(
  contractAddress: string,
  creator: string,
  proposalId: bigint,
) {
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
}

export async function updateProposalResult(
  contractAddress: string,
  creator: string,
  proposalId: bigint,
  result: string,
) {
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
}

export async function upsertProposalVote(proposalVoteData: ProposalVoteData) {
  const { db } = useDrizzleStorage();
  return db
    .insert(daoProposalVote)
    .values(proposalVoteData)
    .onConflictDoUpdate({
      target: [daoProposalVote.contractAddress, daoProposalVote.proposalId, daoProposalVote.voter],
      set: { totalVotes: proposalVoteData.totalVotes },
    });
}
