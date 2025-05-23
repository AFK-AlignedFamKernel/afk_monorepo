import { PrismaClient } from '@prisma/client';
import { FastifyInstance as BaseFastifyInstance } from 'fastify';

declare module 'fastify' {
    interface FastifyInstance extends BaseFastifyInstance {
        prisma: PrismaClient;
        authenticate: any; // You can replace 'any' with your actual auth plugin type
    }

    interface FastifyRequest {
        user: {
            id: string;
            // Add other user properties as needed
        };
    }
} 