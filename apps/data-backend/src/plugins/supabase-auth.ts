import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { UserJwtPayload } from '../types';

declare module 'fastify' {
    interface FastifyInstance {
        authenticateAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }

    interface FastifyRequest {
        user: UserJwtPayload | null | undefined;
    }
}

export default fp(async function (fastify: FastifyInstance) {
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );

    // Add auth hook to verify JWT token
    fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                request.user = {
                    id: '',
                    userAddress: ''
                };
                return;
            }

            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (error || !user) {
                request.user = {
                    id: '',
                    userAddress: ''
                };
                return;
            }

            // Set the user in the request object
            request.user = {
                id: user.id,
                userAddress: user.user_metadata?.address || '',
            };
        } catch (error) {
            request.log.error(error);
            request.user = {
                id: '',
                userAddress: ''
            };
        }
    });

    // Add auth decorator to check if user is authenticated
    fastify.decorate('authenticateAuth', async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request?.user?.id) {
            reply.code(401).send({ error: 'Unauthorized' });
        }
    });
});
