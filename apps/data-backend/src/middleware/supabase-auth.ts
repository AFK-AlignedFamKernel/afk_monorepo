import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase, supabaseAdmin } from '../services/supabase';

export async function supabaseAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
    try {
        const authHeader = request.headers.authorization;
        
        if (!authHeader?.startsWith('Bearer ')) {
            return reply.code(401).send({ error: 'No token provided' });
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify the JWT token and get user details
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return reply.code(401).send({ error: 'Invalid token' });
        }

        // // Get the session to verify it's still valid
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        // if (sessionError || !session) {
        //     return reply.code(401).send({ error: 'Invalid session' });
        // }

        // Add user to request object
        request.user = {
            id: user.id,
            userAddress: user.user_metadata?.address || '',
            email: user.email || '',
            role: user.role || 'user',
            identities: user.identities || []
        };

        // Add session to request for additional security checks if needed
        request.session = session;

        return user;
    } catch (error) {
        request.log.error(error);
        return reply.code(401).send({ error: 'Authentication failed' });
    }
} 