import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { supabaseAdmin } from '../../services/supabase';
import { supabaseAuthMiddleware } from '../../middleware/supabase-auth';
import { z } from 'zod';
import axios from 'axios';


export default async function analyticsRoutes(fastify: FastifyInstance) {

  fastify.get('/analytics/content-creator/view-profile', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { slug_name } = request.query as any;

      if (!slug_name) {
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

  fastify.get('/analytics/keywords', {
    preHandler: [supabaseAuthMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {

      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { keywords } = request.query as any;

      if (!keywords) {
        return reply.code(400).send({ error: 'Keywords are required' });
      }

      var data = JSON.stringify([{ "keyword": keywords, "location_code": 2840, "language_code": "en", "depth": 3, "include_seed_keyword": false, "include_serp_info": false, "ignore_synonyms": false, "include_clickstream_data": false, "replace_with_core_keyword": false, "limit": 100 }]);
      const response = await axios.post(
        'https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live',
        data,
        {
          headers: {
            'Authorization': `Basic ${process.env.DATAFORSEO_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("response", response.data);

      return reply.code(200).send({ data: response.data });

    } catch (error) {
      console.log("error", error)
      return reply.code(500).send({ error: error.message });
    }
  });


}