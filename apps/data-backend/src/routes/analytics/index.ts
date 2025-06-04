import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { supabaseAdmin } from '../../services/supabase';
import { supabaseAuthMiddleware } from '../../middleware/supabase-auth';
import { z } from 'zod';

const contentCreatorSchema = z.object({
  name: z.string().min(0).optional(),
  description: z.string().optional(),
  slug_name: z.string().min(1).optional(),
  avatar_url: z.string().optional(),
  topics: z.array(z.string()).optional(),
  token_address: z.string().optional().nullable(),
  starknet_address: z.string().optional().nullable(),
  evm_address: z.string().optional().nullable(),
  btc_address: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
  metadata: z.object({
      logo: z.string().optional(),
      banner: z.string().optional(),
      description: z.string().optional(),
      website: z.string().optional(),
      social_links: z.array(z.object({
          platform: z.string(),
          url: z.string(),
      })).optional(),
  }).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export default async function analyticsRoutes(fastify: FastifyInstance) {

  fastify.get('/analytics/content-creator/view-profile', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { slug_name } = request.query as any;

      if(!slug_name) {
        return reply.code(400).send({ error: 'Slug name is required' });
      }

      const { data, error } = await supabaseAdmin
        .from('content_creators')
        .select('*')
        .eq('slug_name', slug_name)
        .single();  

      if (error) {
        return reply.code(500).send({ error: error.message });
      }

      const { data: analytics, error: analyticsError } = await supabaseAdmin
        .from('creator_analytics')
        .select('*')
        .eq('creator_id', data?.id)

      console.log("analytics", analytics);

      if (analyticsError) {
        return reply.code(500).send({ error: analyticsError.message });
      }

      return reply.code(200).send({ creator: data, analytics });  
    } catch (error) {
      console.log("error", error)
      return reply.code(500).send({ error: error.message });
    }
  }); 

  fastify.get('/analytics/keywords', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { keywords } = request.query as any;

      if(!keywords) {
        return reply.code(400).send({ error: 'Keywords are required' });
      }
      
      
    } catch (error) {
      console.log("error", error)
      return reply.code(500).send({ error: error.message });
    }
  });


}