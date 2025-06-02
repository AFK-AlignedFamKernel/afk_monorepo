import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { supabaseAdmin } from '../../services/supabase';
import { supabaseAuthMiddleware } from '../../middleware/supabase-auth';

export default async function contentCreatorRoutes(fastify: FastifyInstance) {
  // List all social identities
  fastify.get('/content-creator', async (request: FastifyRequest, reply: FastifyReply) => {
    const { data, error } = await supabaseAdmin
      .from('social_identities')
      .select('*');

    if (error) {
      return reply.code(500).send({ error: error.message });
    }

    return data;
  });

  // List all social identities
  fastify.get('/content-creator/my-profile', {
    preHandler: supabaseAuthMiddleware
  }, async (request: FastifyRequest, reply: FastifyReply) => {

    try {

      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const { id, user_id, proof_url } = request.body as any;

      if (!request?.user?.identities?.length) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }


      console.log("request?.user?.id", request?.user?.id)
      const { data, error } = await supabaseAdmin
        .from('content_creators')
        .select('*')
        .eq("user_id", request?.user?.id)
        .single();

      if (error) {
        return reply.code(500).send({ error: error.message });
      }

      return reply.code(200).send(data);
    } catch (error) {
      console.log("error", error)
      return reply.code(500).send({ error: error.message });
    }
  });

  // Create a new social identity (scraped, not linked to owner)
  fastify.post('/content-creator', async (request: FastifyRequest, reply: FastifyReply) => {

    try {
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
    } catch (error) {
      console.log("error", error)
      return reply.code(500).send({ error: error.message });
    }
  });

  // Link/claim a social identity (link to user)
  fastify.post('/content-creator/verify_identity', { preHandler: supabaseAuthMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {

    try {

      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const { id, user_id, proof_url } = request.body as any;

      if (!request?.user?.identities?.length) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      console.log("request?.user?.identities", request?.user?.identities)

      const { data, error } = await supabaseAdmin
        .from('content_creators')
        .upsert({
          name: request?.user?.identities[0]?.identity_data?.full_name ?? "Anonymous",
          slug_name: request?.user?.identities[0]?.identity_data?.full_name ?? "Anonymous",
          owner_id: request?.user?.id,
          // metadata: {
          // },
          identities: {
            ...request?.user?.identities,
          },
          social_links: {
            ...request?.user?.identities,
          },
          updated_at: new Date().toISOString()
        })
        .eq('owner_id', request?.user?.id)
        .select()
        .single();

      console.log("data", data)
      console.log("error", error)

      if (error) {
        return reply.code(500).send({ error: error.message });
      }

      if (!data) {
        return reply.code(404).send({ error: 'Identity not found' });
      }

      reply.send(data);
    } catch (error) {
      console.log("error", error)
      return reply.code(500).send({ error: error.message });
    }
  });

  // Link/claim a social identity (link to user)
  fastify.post('/content-creator/claim', { preHandler: supabaseAuthMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {

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