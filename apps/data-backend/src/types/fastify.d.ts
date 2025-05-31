import { PrismaClient } from 'prisma-db';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserJwtPayload } from './index';
import { MultipartFile } from 'fastify-multipart';

declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        authenticateAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }

    interface FastifyRequest {
        user: UserJwtPayload | null | undefined;
        session: any | undefined; // Using any for now since we don't need the full session type
        // file(): Promise<MultipartFile>;

    }
} 
