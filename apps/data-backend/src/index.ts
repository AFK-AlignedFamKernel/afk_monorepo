// const { PrismaClient } = require('@prisma/client');
// const { ApolloServer, gql } = require('apollo-server');
import  { ApolloServer, gql }  from 'apollo-server';
// const prisma = new PrismaClient();
// const {PrismaClient} = require("indexer-prisma")
import prisma from 'indexer-prisma';
import express from "express";
const app = express();
// Define your GraphQL schema
const typeDefs = gql`
  type User {
    id: Int
    name: String
    email: String
  }

  type Query {
    users: [User]
    user(id: Int!): User
  }
`;

// Define your resolvers
const resolvers = {
  Query: {
    token_launch: async () => {
      return await prisma.token_launch.findMany();
    },
    // token: async (_: any, args: { id: any; }) => {
    //   return await prisma.token_deploy.findUnique({ where: { id: args.id } });
    // },
  },
};

// Create the Apollo Server
const server = new ApolloServer({ typeDefs, resolvers });

// Start the server
server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

// Start the server
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`GraphQL server running at http://localhost:${port}/graphql`);
});