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

export const daoProposal = pgTable('dao_proposal', {
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
}, (table) => ({
  uniqueProposal: uniqueIndex('dao_proposal_unique_idx').on(table.contractAddress, table.proposalId)
}));

export const daoProposalVote = pgTable('dao_proposal_vote', {
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
}, (table) => ({
  uniqueVote: uniqueIndex('dao_proposal_vote_unique_idx').on(table.contractAddress, table.proposalId, table.voter)
}));


// Simplified relations without foreign key constraints
export const daoCreationRelations = relations(daoCreation, ({ many }) => ({
  proposals: many(daoProposal),
}));

export const daoProposalRelations = relations(daoProposal, ({ many }) => ({
  votes: many(daoProposalVote),
}));

export const daoProposalVoteRelations = relations(daoProposalVote, ({ one }) => ({
  proposal: one(daoProposal, {
    fields: [daoProposalVote.contractAddress, daoProposalVote.proposalId],
    references: [daoProposal.contractAddress, daoProposal.proposalId],
  }),
}));


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
  contract_address: text('contract_address').notNull(),
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
  contract_address: text('contract_address'),
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
  uniqueUserEpoch: uniqueIndex('user_epoch_state_unique_idx').on(table.nostr_id, table.epoch_index, table.contract_address)
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

export const tokenDeploy = pgTable('token_deploy', {
  transaction_hash: text('transaction_hash').primaryKey(),
  network: text('network'),
  block_timestamp: timestamp('block_timestamp'),
  memecoin_address: text('memecoin_address').unique(),
  owner_address: text('owner_address'),
  name: text('name'),
  symbol: text('symbol'),
  initial_supply: text('initial_supply'),
  total_supply: text('total_supply'),
  created_at: timestamp('created_at').defaultNow(),
  is_launched: boolean('is_launched').default(false),
  url: text('url'),
  nostr_id: text('nostr_id'),
  nostr_event_id: text('nostr_event_id'),
  telegram: text('telegram'),
  github: text('github'),
  website: text('website'),
});

export const tokenLaunch = pgTable('token_launch', {
  transaction_hash: text('transaction_hash').primaryKey(),
  network: text('network'),
  block_timestamp: timestamp('block_timestamp'),
  memecoin_address: text('memecoin_address').unique(),
  owner_address: text('owner_address'),
  name: text('name'),
  symbol: text('symbol'),
  quote_token: text('quote_token'),
  total_supply: text('total_supply'),
  threshold_liquidity: text('threshold_liquidity'),
  current_supply: text('current_supply'),
  liquidity_raised: text('liquidity_raised'),
  is_liquidity_added: boolean('is_liquidity_added').default(false),
  total_token_holded: text('total_token_holded'),
  price: text('price'),
  bonding_type: text('bonding_type'),
  initial_pool_supply_dex: text('initial_pool_supply_dex'),
  market_cap: text('market_cap'),
  created_at: timestamp('created_at').defaultNow(),
  url: text('url'),
  token_deploy_tx_hash: text('token_deploy_tx_hash').unique(),
  twitter: text('twitter'),
  telegram: text('telegram'),
  github: text('github'),
  website: text('website'),
});

export const tokenMetadata = pgTable('token_metadata', {
  transaction_hash: text('transaction_hash').primaryKey(),
  network: text('network'),
  block_timestamp: timestamp('block_timestamp'),
  memecoin_address: text('memecoin_address').unique(),
  url: text('url'),
  nostr_id: text('nostr_id'),
  nostr_event_id: text('nostr_event_id'),
  twitter: text('twitter'),
  telegram: text('telegram'),
  github: text('github'),
  website: text('website'),
  created_at: timestamp('created_at').defaultNow(),
});

export const tokenTransactions = pgTable('token_transactions', {
  transfer_id: text('transfer_id').primaryKey(),
  network: text('network'),
  block_timestamp: timestamp('block_timestamp'),
  transaction_hash: text('transaction_hash'),
  memecoin_address: text('memecoin_address'),
  owner_address: text('owner_address'),
  last_price: text('last_price'),
  quote_amount: text('quote_amount'),
  price: text('price'),
  protocol_fee: text('protocol_fee'),
  amount: text('amount'),
  transaction_type: text('transaction_type'),
  time_stamp: timestamp('time_stamp'),
  created_at: timestamp('created_at').defaultNow(),
});

export const sharesTokenUser = pgTable('shares_token_user', {
  id: uuid('id').primaryKey().defaultRandom(),
  owner: text('owner').notNull(),
  token_address: text('token_address').notNull(),
  amount_owned: text('amount_owned').default('0'),
  amount_buy: text('amount_buy').default('0'),
  amount_sell: text('amount_sell').default('0'),
  amount_claimed: text('amount_claimed').default('0'),
  total_paid: text('total_paid').default('0'),
  is_claimable: boolean('is_claimable').default(false),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniqueOwnerToken: uniqueIndex('shares_token_user_owner_token_idx').on(table.owner, table.token_address)
}));

export const candlesticks = pgTable('candlesticks', {
  id: uuid('id').primaryKey().defaultRandom(),
  token_address: text('token_address').notNull(),
  interval_minutes: integer('interval_minutes').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  open: decimal('open', { precision: 30, scale: 18 }).notNull(),
  high: decimal('high', { precision: 30, scale: 18 }).notNull(),
  low: decimal('low', { precision: 30, scale: 18 }).notNull(),
  close: decimal('close', { precision: 30, scale: 18 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => ({
  uniqueCandlestick: uniqueIndex('candlesticks_token_interval_timestamp_idx').on(table.token_address, table.interval_minutes, table.timestamp)
}));

// Simplified relations without foreign key constraints
export const contractStateRelations = relations(contractState, ({ many }) => ({
  epochs: many(epochState),
  userProfiles: many(userProfile),
}));

export const epochStateRelations = relations(epochState, ({ many }) => ({
  userEpochStates: many(userEpochState),
}));

export const userProfileRelations = relations(userProfile, ({ many }) => ({
  epochStates: many(userEpochState),
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
export const tokenDeployRelations = relations(tokenDeploy, ({ one }) => ({
  launch: one(tokenLaunch, {
    fields: [tokenDeploy.transaction_hash],
    references: [tokenLaunch.token_deploy_tx_hash],
  }),
  metadata: one(tokenMetadata, {
    fields: [tokenDeploy.memecoin_address],
    references: [tokenMetadata.memecoin_address],
  }),
}));

export const tokenLaunchRelations = relations(tokenLaunch, ({ one }) => ({
  deploy: one(tokenDeploy, {
    fields: [tokenLaunch.token_deploy_tx_hash],
    references: [tokenDeploy.transaction_hash],
  }),
  metadata: one(tokenMetadata, {
    fields: [tokenLaunch.memecoin_address],
    references: [tokenMetadata.memecoin_address],
  }),
}));

export const tokenMetadataRelations = relations(tokenMetadata, ({ one }) => ({
  deploy: one(tokenDeploy, {
    fields: [tokenMetadata.memecoin_address],
    references: [tokenDeploy.memecoin_address],
  }),
  launch: one(tokenLaunch, {
    fields: [tokenMetadata.memecoin_address],
    references: [tokenLaunch.memecoin_address],
  }),
}));

export const sharesTokenUserRelations = relations(sharesTokenUser, ({ one }) => ({
  token: one(tokenLaunch, {
    fields: [sharesTokenUser.token_address],
    references: [tokenLaunch.memecoin_address],
  }),
}));

export const candlesticksRelations = relations(candlesticks, ({ one }) => ({
  token: one(tokenLaunch, {
    fields: [candlesticks.token_address],
    references: [tokenLaunch.memecoin_address],
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

export type TokenDeploy = typeof tokenDeploy.$inferSelect;
export type NewTokenDeploy = typeof tokenDeploy.$inferInsert;

export type TokenLaunch = typeof tokenLaunch.$inferSelect;
export type NewTokenLaunch = typeof tokenLaunch.$inferInsert;

export type TokenMetadata = typeof tokenMetadata.$inferSelect;
export type NewTokenMetadata = typeof tokenMetadata.$inferInsert;

export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type NewTokenTransaction = typeof tokenTransactions.$inferInsert;

export type SharesTokenUser = typeof sharesTokenUser.$inferSelect;
export type NewSharesTokenUser = typeof sharesTokenUser.$inferInsert;

export type Candlestick = typeof candlesticks.$inferSelect;
export type NewCandlestick = typeof candlesticks.$inferInsert;


