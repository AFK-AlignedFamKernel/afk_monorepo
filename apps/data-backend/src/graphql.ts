import { ApolloServer, gql } from "apollo-server";
const { prisma } = require("indexer-prisma");

//GraphQL schema definitions

const typeDefs = gql`
  type TokenDeploy {
    memecoinAddress: String
    network: String
    blockHash: String
    blockNumber: Int
    blockTimestamp: String
    transactionHash: String!
    ownerAddress: String
    name: String
    symbol: String
    initialSupply: String
    totalSupply: String
    createdAt: String
    cursor: String
  }

  type BuyToken {
    network: String
    blockHash: String
    blockNumber: Int
    blockTimestamp: String
    transactionHash: String!
    memecoinAddress: String
    ownerAddress: String
    price: String
    amount: String
    protocolFee: String
    initialSupply: String
    timestamp: String
    createdAt: String
  }

  type Query {
    buyTokens: [BuyToken]
    buyToken(transactionHash: String!): BuyToken
    tokenDeploys: [TokenDeploy]
    tokenDeploy(memecoinAddress: String!): TokenDeploy
  }
`;

// Resolvers for the schema
const resolvers = {
  Query: {
    buyTokens: () => prisma.buy_token.findMany(),
    buyToken: (_parent, { transactionHash }) =>
      prisma.buy_token.findUnique({
        where: { transactionHash },
      }),
    tokenDeploys: () => prisma.token_deploy.findMany(),
    tokenDeploy: (_parent, { memecoinAddress }) =>
      prisma.token_deploy.findUnique({
        where: { memecoin_address: memecoinAddress },
      }),
  },
};

// Create the Apollo Server
export const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => ({ prisma }),
});
