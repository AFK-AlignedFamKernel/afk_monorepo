import { bigint, boolean, integer, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';

export const daoCreation = pgTable('dao_creation', {
  _id: uuid('_id').primaryKey().defaultRandom(),
  number: bigint('number', { mode: 'number' }),
  hash: text('hash'),
  creator: text('creator'),
  tokenAddress: text('token_address'),
  contractAddress: text('contract_address'),
  starknetAddress: text('starknet_address'),
});

export const daoProposal = pgTable(
  'dao_proposal',
  {
    contractAddress: text('contract_address'),
    proposalId: bigint('proposal_id', { mode: 'bigint' }),
    creator: text('creator'),
    createdAt: integer('created_at'),
    endAt: integer('end_at'),
    isCanceled: boolean('is_canceled'),
    result: text('result'),
  },
  (table) => [primaryKey({ columns: [table.contractAddress, table.proposalId] })],
);

export const daoProposalVote = pgTable(
  'dao_proposal_vote',
  {
    contractAddress: text('contract_address'),
    proposalId: bigint('proposal_id', { mode: 'bigint' }),
    voter: text('voter'),
    vote: text('vote'),
    votes: bigint('votes', { mode: 'bigint' }),
    totalVotes: bigint('total_votes', { mode: 'bigint' }),
    votedAt: integer('voted_at'),
  },
  (table) => [primaryKey({ columns: [table.contractAddress, table.proposalId, table.voter] })],
);
