import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from 'prisma-db';

export default fp(async function (fastify: FastifyInstance) {
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    fastify.log.info('Database connected successfully'); // Log connection success
  } catch (error) {
    fastify.log.error('Failed to connect to the database'); // Log connection failure
    throw error; // Re-throw the error to prevent starting the app without a database connection
  }

  // Make Prisma available through fastify.prisma
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
    fastify.log.info('Database connection closed'); // Log disconnection
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
