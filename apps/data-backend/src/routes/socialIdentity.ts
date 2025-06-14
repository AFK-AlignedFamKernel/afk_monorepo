import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { supabaseAdmin } from '../services/supabase';
import { supabaseAuthMiddleware } from '../middleware/supabase-auth';

export default async function socialIdentityRoutes(fastify: FastifyInstance) {
  // List all social identities
  fastify.get('/social-identity', async (request: FastifyRequest, reply: FastifyReply) => {
    const { data, error } = await supabaseAdmin
      .from('social_identities')
      .select('*');

    if (error) {
      return reply.code(500).send({ error: error.message });
    }

    return data;
  });

  // Create a new social identity (scraped, not linked to owner)
  fastify.post('/social-identity', async (request: FastifyRequest, reply: FastifyReply) => {
    const { platform, handle, metadata } = request.body as any;

    const { data, error } = await supabaseAdmin
      .from('social_identities')
      .insert({
        platform,
        handle,
        metadata: metadata || {},
        verified: false,
        claimed_at: null
      })
      .select()
      .single();

    if (error) {
      return reply.code(500).send({ error: error.message });
    }

    reply.code(201).send(data);
  });

  // Link/claim a social identity (link to user)
  fastify.post('/social-identity/verify_identity', { preHandler: supabaseAuthMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {

    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const { id, user_id, proof_url } = request.body as any;

    if (!request?.user?.identities?.length) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }


    const { data, error } = await supabaseAdmin
      .from('content_creators')
      .update({
        identities: {
          ...request?.user?.identities,
        },
        social_links: {
          ...request?.user?.identities,
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return reply.code(500).send({ error: error.message });
    }

    if (!data) {
      return reply.code(404).send({ error: 'Identity not found' });
    }

    reply.send(data);
  });

  // Link/claim a social identity (link to user)
  fastify.post('/social-identity/claim', { preHandler: supabaseAuthMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {

    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const { id, user_id, proof_url } = request.body as any;

    const { data, error } = await supabaseAdmin
      .from('social_identities')
      .update({
        user_id,
        proof_url,
        verified: true,
        claimed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return reply.code(500).send({ error: error.message });
    }

    if (!data) {
      return reply.code(404).send({ error: 'Identity not found' });
    }

    reply.send(data);
  });
}