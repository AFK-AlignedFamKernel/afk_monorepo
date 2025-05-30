import { PrismaClient } from 'prisma-db';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserJwtPayload } from './index';

declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        authenticateAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }

    interface FastifyRequest {
        user: UserJwtPayload | null;
        session?: any; // Using any for now since we don't need the full session type
    }
} 