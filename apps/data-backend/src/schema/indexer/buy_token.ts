import { gql } from "apollo-server";

export const AllBuyToken = gql`
  scalar BigInt
  scalar DateTime

  type BuyToken {
    network: String
    block_hash: String
    block_number: BigInt
    block_timestamp: DateTime
    transaction_hash: String
    memecoin_address: String! # This is the ID field in Prisma
    owner_address: String
    last_price: String
    initial_supply: String
    created_at: DateTime!
    cursor: BigInt
  }

  type Query {
    buyTokens: [BuyToken!]!
    buyToken(memecoin_address: String!): BuyToken
  }

  type Mutation {
    createBuyToken(
      network: String
      block_hash: String
      block_number: BigInt
      block_timestamp: DateTime
      transaction_hash: String
      memecoin_address: String!
      owner_address: String
      last_price: String
      initial_supply: String
      created_at: DateTime
      cursor: BigInt
    ): BuyToken!

    updateBuyToken(
      memecoin_address: String!
      network: String
      block_hash: String
      block_number: BigInt
      block_timestamp: DateTime
      transaction_hash: String
      owner_address: String
      last_price: String
      initial_supply: String
      created_at: DateTime
      cursor: BigInt
    ): BuyToken!

    deleteBuyToken(memecoin_address: String!): BuyToken!
  }
`;

export const TypeBuyToken = gql`
  scalar BigInt
  scalar DateTime

  type BuyToken {
    network: String
    block_hash: String
    block_number: BigInt
    block_timestamp: DateTime
    transaction_hash: String
    memecoin_address: String! # This is the ID field in Prisma
    owner_address: String
    last_price: String
    initial_supply: String
    created_at: DateTime!
    cursor: BigInt
  }

  type Query {
    buyTokens: [BuyToken!]!
    buyToken(memecoin_address: String!): BuyToken
  }
`;

export const MutationBuyToken = gql`
  scalar BigInt
  scalar DateTime

  type BuyToken {
    network: String
    block_hash: String
    block_number: BigInt
    block_timestamp: DateTime
    transaction_hash: String
    memecoin_address: String! # This is the ID field in Prisma
    owner_address: String
    last_price: String
    initial_supply: String
    created_at: DateTime!
    cursor: BigInt
  }

  type Query {
    buyTokens: [BuyToken!]!
    buyToken(memecoin_address: String!): BuyToken
  }

  type Mutation {
    createBuyToken(
      network: String
      block_hash: String
      block_number: BigInt
      block_timestamp: DateTime
      transaction_hash: String
      memecoin_address: String!
      owner_address: String
      last_price: String
      initial_supply: String
      created_at: DateTime
      cursor: BigInt
    ): BuyToken!

    updateBuyToken(
      memecoin_address: String!
      network: String
      block_hash: String
      block_number: BigInt
      block_timestamp: DateTime
      transaction_hash: String
      owner_address: String
      last_price: String
      initial_supply: String
      created_at: DateTime
      cursor: BigInt
    ): BuyToken!

    deleteBuyToken(memecoin_address: String!): BuyToken!
  }
`;
