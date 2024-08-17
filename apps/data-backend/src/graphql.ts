import { ApolloServer, gql } from 'apollo-server';
import prisma from 'indexer-prisma';
import { MutationBuyToken, TypeBuyToken } from './schema/indexer/buy_token';


// Define your resolvers
const resolvers = {
  Query: {
    buyTokens: () => prisma.buy_token.findMany(),
    buyToken: (_parent, args) => prisma.buy_token.findUnique({
      where: { memecoin_address: args.memecoin_address },
    }),
  },
  // Mutation: {
  //   createBuyToken: (_parent, args) => prisma.buy_token.create({
  //     data: args,
  //   }),
  //   updateBuyToken: (_parent, args) => prisma.buy_token.update({
  //     where: { memecoin_address: args.memecoin_address },
  //     data: args,
  //   }),
  //   deleteBuyToken: (_parent, args) => prisma.buy_token.delete({
  //     where: { memecoin_address: args.memecoin_address },
  //   }),
  // },
};

// Create the Apollo Server
export const server = new ApolloServer({ typeDefs: { ...TypeBuyToken }, resolvers });
