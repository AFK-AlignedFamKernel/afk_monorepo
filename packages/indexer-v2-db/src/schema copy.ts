import { bigint, boolean, decimal, integer, pgTable, primaryKey, text, timestamp, uuid, uniqueIndex, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferModel } from 'drizzle-orm';

export const daoCreation = pgTable('dao_creation', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: bigint('number', { mode: 'number' }),
  hash: text('hash'),
  creator: text('creator'),
  tokenAddress: text('token_address'),
  contractAddress: text('contract_address').notNull().unique(),
  starknetAddress: text('starknet_address'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const daoProposal = pgTable(
  'dao_proposal',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contractAddress: text('contract_address').notNull(),
    proposalId: bigint('proposal_id', { mode: 'bigint' }).notNull(),
    creator: text('creator').notNull(),
    createdAt: integer('created_at'),
    endAt: integer('end_at'),
    isCanceled: boolean('is_canceled').default(false),
    result: text('result'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    compositeKey: primaryKey({ columns: [table.contractAddress, table.proposalId] }),
    daoFk: foreignKey({
      columns: [table.contractAddress],
      foreignColumns: [daoCreation.contractAddress],
    }),
  }),
);

export const daoProposalVote = pgTable(
  'dao_proposal_vote',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contractAddress: text('contract_address').notNull(),
    proposalId: bigint('proposal_id', { mode: 'bigint' }).notNull(),
    voter: text('voter').notNull(),
    vote: text('vote'),
    votes: bigint('votes', { mode: 'bigint' }),
    totalVotes: bigint('total_votes', { mode: 'bigint' }),
    votedAt: integer('voted_at'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    compositeKey: primaryKey({ columns: [table.contractAddress, table.proposalId, table.voter] }),
    proposalFk: foreignKey({
      columns: [table.contractAddress, table.proposalId],
      foreignColumns: [daoProposal.contractAddress, daoProposal.proposalId],
    }),
  }),
);

export const contractState = pgTable('contract_state', {
  id: uuid('id').primaryKey().defaultRandom(),
  contract_address: text('contract_address').notNull().unique(),
  network: text('network'),
  current_epoch_index: text('current_epoch_index'),
  total_ai_score: decimal('total_ai_score', { precision: 30, scale: 18 }).default('0'),
  total_vote_score: decimal('total_vote_score', { precision: 30, scale: 18 }).default('0'),
  total_tips: decimal('total_tips', { precision: 30, scale: 18 }).default('0'),
  total_amount_deposit: decimal('total_amount_deposit', { precision: 30, scale: 18 }).default('0'),
  total_to_claimed: decimal('total_to_claimed', { precision: 30, scale: 18 }).default('0'),
  percentage_algo_distribution: integer('percentage_algo_distribution').default(50),
  quote_address: text('quote_address'),
  main_token_address: text('main_token_address'),
  current_epoch_duration: integer('current_epoch_duration').default(0),
  current_epoch_start: timestamp('current_epoch_start'),
  current_epoch_end: timestamp('current_epoch_end'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  topic_metadata: text('topic_metadata'),
  nostr_metadata: text('nostr_metadata'),
  name: text('name'),
  about: text('about'),
  main_tag: text('main_tag'),
  keyword: text('keyword'),
  keywords: text('keywords').array(),
  event_id_nip_29: text('event_id_nip_29'),
  event_id_nip_72: text('event_id_nip_72'),
});

export const epochState = pgTable('epoch_state', {
  id: uuid('id').primaryKey().defaultRandom(),
  epoch_index: text('epoch_index').notNull(),
  contract_address: text('contract_address').notNull().references(() => contractState.contract_address),
  total_ai_score: decimal('total_ai_score', { precision: 30, scale: 18 }).default('0'),
  total_vote_score: decimal('total_vote_score', { precision: 30, scale: 18 }).default('0'),
  total_amount_deposit: decimal('total_amount_deposit', { precision: 30, scale: 18 }).default('0'),
  total_tip: decimal('total_tip', { precision: 30, scale: 18 }).default('0'),
  amount_claimed: decimal('amount_claimed', { precision: 30, scale: 18 }).default('0'),
  amount_vote: decimal('amount_vote', { precision: 30, scale: 18 }).default('0'),
  amount_algo: decimal('amount_algo', { precision: 30, scale: 18 }).default('0'),
  epoch_duration: integer('epoch_duration'),
  start_time: timestamp('start_time'),
  end_time: timestamp('end_time'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => ({
  uniqueConstraint: uniqueIndex('epoch_contract_unique_idx').on(table.epoch_index, table.contract_address)
}));

export const userProfile = pgTable('user_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  nostr_id: text('nostr_id').notNull().unique(),
  starknet_address: text('starknet_address'),
  total_ai_score: decimal('total_ai_score', { precision: 30, scale: 18 }).default('0'),
  total_tip: decimal('total_tip', { precision: 30, scale: 18 }).default('0'),
  total_vote_score: decimal('total_vote_score', { precision: 30, scale: 18 }).default('0'),
  amount_claimed: decimal('amount_claimed', { precision: 30, scale: 18 }).default('0'),
  is_add_by_admin: boolean('is_add_by_admin').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const userEpochState = pgTable('user_epoch_state', {
  id: uuid('id').primaryKey().defaultRandom(),
  nostr_id: text('nostr_id').notNull(),
  epoch_index: text('epoch_index').notNull(),
  contract_address: text('contract_address').notNull(),
  total_tip: decimal('total_tip', { precision: 30, scale: 18 }).default('0'),
  total_ai_score: decimal('total_ai_score', { precision: 30, scale: 18 }).default('0'),
  total_vote_score: decimal('total_vote_score', { precision: 30, scale: 18 }).default('0'),
  amount_claimed: decimal('amount_claimed', { precision: 30, scale: 18 }).default('0'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.nostr_id, table.epoch_index, table.contract_address] }),
}));

export const indexerCursor = pgTable('indexer_cursor', {
  id: uuid('id').primaryKey().defaultRandom(),
  cursor: text('cursor').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  last_block_number: bigint('last_block_number', { mode: 'bigint' }),
  last_block_hash: text('last_block_hash'),
  last_tx_hash: text('last_tx_hash'),
});

// Relations
export const contractStateRelations = relations(contractState, ({ many }) => ({
  epochs: many(epochState),
  userProfiles: many(userProfile),
}));

export const epochStateRelations = relations(epochState, ({ one, many }) => ({
  contract: one(contractState, {
    fields: [epochState.contract_address],
    references: [contractState.contract_address],
  }),
  userEpochStates: many(userEpochState),
}));

export const userProfileRelations = relations(userProfile, ({ many }) => ({
  epochStates: many(userEpochState),
  contractStates: many(contractState),
}));

export const userEpochStateRelations = relations(userEpochState, ({ one }) => ({
  epoch: one(epochState, {
    fields: [userEpochState.epoch_index, userEpochState.contract_address],
    references: [epochState.epoch_index, epochState.contract_address],
  }),
  user: one(userProfile, {
    fields: [userEpochState.nostr_id],
    references: [userProfile.nostr_id],
  }),
}));

// Add relations
export const daoCreationRelations = relations(daoCreation, ({ many }) => ({
  proposals: many(daoProposal),
}));

export const daoProposalRelations = relations(daoProposal, ({ one, many }) => ({
  dao: one(daoCreation, {
    fields: [daoProposal.contractAddress],
    references: [daoCreation.contractAddress],
  }),
  votes: many(daoProposalVote),
}));

export const daoProposalVoteRelations = relations(daoProposalVote, ({ one }) => ({
  proposal: one(daoProposal, {
    fields: [daoProposalVote.contractAddress, daoProposalVote.proposalId],
    references: [daoProposal.contractAddress, daoProposal.proposalId],
  }),
}));

// Add proper type exports
export type ContractState = typeof contractState.$inferSelect;
export type NewContractState = typeof contractState.$inferInsert;

export type EpochState = typeof epochState.$inferSelect;
export type NewEpochState = typeof epochState.$inferInsert;

export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;

export type UserEpochState = typeof userEpochState.$inferSelect;
export type NewUserEpochState = typeof userEpochState.$inferInsert;

export type DaoCreation = typeof daoCreation.$inferSelect;
export type NewDaoCreation = typeof daoCreation.$inferInsert;

export type DaoProposal = typeof daoProposal.$inferSelect;
export type NewDaoProposal = typeof daoProposal.$inferInsert;

export type DaoProposalVote = typeof daoProposalVote.$inferSelect;
export type NewDaoProposalVote = typeof daoProposalVote.$inferInsert;


