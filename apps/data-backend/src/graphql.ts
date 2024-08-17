import  { ApolloServer, gql }  from 'apollo-server';
import prisma from 'indexer-prisma';
const typeDefs = gql`
    scalar BigInt
    scalar DateTime
    
    type BuyToken {
      network: String
      block_hash: String
      block_number: BigInt
      block_timestamp: DateTime
      transaction_hash: String
      memecoin_address: String!  # This is the ID field in Prisma
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

// Define your resolvers
const resolvers = {
  Query: {
    buyTokens: () => prisma.buy_token.findMany(),
    buyToken: (_parent, args) => prisma.buy_token.findUnique({
      where: { memecoin_address: args.memecoin_address },
    }),
  },
  Mutation: {
    createBuyToken: (_parent, args) => prisma.buy_token.create({
      data: args,
    }),
    updateBuyToken: (_parent, args) => prisma.buy_token.update({
      where: { memecoin_address: args.memecoin_address },
      data: args,
    }),
    deleteBuyToken: (_parent, args) => prisma.buy_token.delete({
      where: { memecoin_address: args.memecoin_address },
    }),
  },
  // Query: {
  //   // token_launch: async () => {
  //   //   return await prisma.token_launch.findMany();
  //   // },

  //   buy_token: async () => {
  //     return await prisma.buy_token.findMany();
  //   },
  //   // token: async (_: any, args: { id: any; }) => {
  //   //   return await prisma.token_deploy.findUnique({ where: { id: args.id } });
  //   // },
  // },
};

// Create the Apollo Server
export const server = new ApolloServer({ typeDefs, resolvers });
