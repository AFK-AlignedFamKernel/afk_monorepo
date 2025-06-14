import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { supabaseAdmin } from '../../services/supabase';
import { supabaseAuthMiddleware } from '../../middleware/supabase-auth';
import { z } from 'zod';

const brandSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  slug_name: z.string().min(1),
  avatar_url: z.string().url().optional(),
  banner_url: z.string().optional(),
  website_url: z.string().optional(),
  // banner_url: z.string().url().optional(),
  // website_url: z.string().url().optional(),
  topics: z.array(z.string()).optional(),
  token_address: z.string().optional().nullable(),
  starknet_address: z.string().optional().nullable(),
  evm_address: z.string().optional().nullable(),
  btc_address: z.string().optional().nullable(),
  solana_address: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  is_verified: z.boolean().default(false),
  bio: z.string().optional(),
  location: z.string().optional(),
  social_links: z.record(z.string()).optional(),
  twitter_handle: z.string().optional(),
  youtube_handle: z.string().optional(),
  tiktok_handle: z.string().optional(),
  reddit_handle: z.string().optional(),
  telegram_handle: z.string().optional(),
  discord_handle: z.string().optional(),
  facebook_handle: z.string().optional(),
  linkedin_handle: z.string().optional(),
  instagram_handle: z.string().optional(),
  nostr_address: z.string().optional(),
  lud_address: z.string().optional(),
  tokens_address: z.array(z.string()).optional(),
  creator_token: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

export default async function brandRoutes(fastify: FastifyInstance) {

  fastify.get('/brand/view-profile', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { slug_name } = request.query as any;

      if(!slug_name) {
        return reply.code(400).send({ error: 'Slug name is required' });
      }

      const { data, error } = await supabaseAdmin
        .from('brand')
        .select('*')
        .eq('slug_name', slug_name)
        .single();  

      if (error) {
        return reply.code(500).send({ error: error.message });
      }

      const { data: leaderboards, error: leaderboardError } = await supabaseAdmin
        .from('leaderboard_stats')
        .select('*')
        .eq('brand_id', data?.id)

      console.log("leaderboards", leaderboards);

      if (leaderboardError) {
        return reply.code(500).send({ error: leaderboardError.message });
      }

      return reply.code(200).send({ brand: data, leaderboards: leaderboards });  
    } catch (error) {
      console.log("error", error)
      return reply.code(500).send({ error: error.message });
    }
  }); 

  fastify.get('/brand', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      let query = supabaseAdmin
        .from('brand')
        .select('*');
      const { data, error } = await query;
      if (error) {
        return reply.code(500).send({ error: error.message });
      }
      return reply.code(200).send({ brands: data });
    } catch (error) {
      console.log("error", error)
      return reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/brand/owned', {
    preHandler: [supabaseAuthMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {

      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      if (!request?.user?.identities?.length) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      let query = supabaseAdmin
        .from('brand')
        .select('*')
        .eq('owner_id', request.user.id);

      const { data, error } = await query;
      console.log("data", data)
      if (error) {
        return reply.code(500).send({ error: error.message });
      }
      return reply.code(200).send({ brands: data });
    } catch (error) {
      console.log("error", error)
      return reply.code(500).send({ error: error.message });
    }
  });

  fastify.post('/brand/create', {
    preHandler: [supabaseAuthMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {

      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      if (!request?.user?.identities?.length) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }


      const res = brandSchema.safeParse(request.body);
      console.log("zod res", res?.error?.issues)


      if (!res.success) {
        return reply.code(400).send({ error: 'Invalid request body' });
      }
      const { slug_name } = res.data;
      const { data, error } = await supabaseAdmin.from('brand').select('*').eq('slug_name', slug_name).single();

      if (data) {
        return reply.code(400).send({ error: 'Brand already exists' });
      }
    
      const { data: brand, error: brandError } = await supabaseAdmin.from('brand').insert({
        name: res.data.name,
        slug_name: res.data.slug_name,
        avatar_url: res.data.avatar_url,
        banner_url: res.data.banner_url,
        website_url: res.data.website_url,
        topics: res.data.topics,
        token_address: res.data.token_address,
        starknet_address: res.data.starknet_address,
        evm_address: res.data.evm_address,
        btc_address: res.data.btc_address,
        solana_address: res.data.solana_address,
        is_active: res.data.is_active,
        is_verified: res.data.is_verified,
        bio: res.data.bio,
        location: res.data.location,
        social_links: res.data.social_links,
        twitter_handle: res.data.twitter_handle,
        youtube_handle: res.data.youtube_handle,
        tiktok_handle: res.data.tiktok_handle,
        reddit_handle: res.data.reddit_handle,
        telegram_handle: res.data.telegram_handle,
        discord_handle: res.data.discord_handle,
        facebook_handle: res.data.facebook_handle,
        linkedin_handle: res.data.linkedin_handle,
        instagram_handle: res.data.instagram_handle,
        nostr_address: res.data.nostr_address,
        lud_address: res.data.lud_address,
        tokens_address: res.data.tokens_address,
        creator_token: res.data.creator_token,
        created_at: res.data.created_at,
        updated_at: res.data.updated_at,
        owner_id: request.user.id,
      }).select('*').single();

      if (brandError) {
        return reply.code(500).send({ error: brandError.message });
      }

      return reply.code(200).send({ brand: brand });
    } catch (error) {
      console.log("error", error)
      return reply.code(500).send({ error: error.message });
    }
  });  


  fastify.post('/brand/update', {
    preHandler: [supabaseAuthMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      if (!request?.user?.identities?.length) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const res = brandSchema.safeParse(request.body);

      console.log("res", res)
      console.log("res error", res?.error?.issues) 
      if (!res.success) {
        return reply.code(400).send({ error: 'Invalid request body' });
      }

      const { slug_name } = res.data;
      const { data: existingBrand, error: fetchError } = await supabaseAdmin
        .from('brand')
        .select('*')
        .eq('slug_name', slug_name)
        .single();

      if (fetchError) {
        return reply.code(500).send({ error: 'Error checking brand existence' });
      }

      if (!existingBrand) {
        return reply.code(404).send({ error: 'Brand not found' });
      }

      // Check if user owns the brand
      const userId = request.user.id;
      if (existingBrand.owner_id !== userId) {
        return reply.code(403).send({ error: 'You do not have permission to update this brand' });
      }

      const { data: updatedBrand, error: updateError } = await supabaseAdmin
        .from('brand')
        .update({
          name: res.data.name,
          avatar_url: res.data.avatar_url,
          banner_url: res.data.banner_url,
          website_url: res.data.website_url,
          topics: res.data.topics,
          token_address: res.data.token_address,
          starknet_address: res.data.starknet_address,
          evm_address: res.data.evm_address,
          btc_address: res.data.btc_address,
          solana_address: res.data.solana_address,
          is_active: res.data.is_active,
          is_verified: res.data.is_verified,
          bio: res.data.bio,
          location: res.data.location,
          social_links: res.data.social_links,
          twitter_handle: res.data.twitter_handle,
          youtube_handle: res.data.youtube_handle,
          tiktok_handle: res.data.tiktok_handle,
          reddit_handle: res.data.reddit_handle,
          telegram_handle: res.data.telegram_handle,
          discord_handle: res.data.discord_handle,
          facebook_handle: res.data.facebook_handle,
          linkedin_handle: res.data.linkedin_handle,
          instagram_handle: res.data.instagram_handle,
          nostr_address: res.data.nostr_address,
          lud_address: res.data.lud_address,
          tokens_address: res.data.tokens_address,
          creator_token: res.data.creator_token,
          updated_at: new Date().toISOString()
        })
        .eq('slug_name', slug_name)
        .select('*')
        .single();

      if (updateError) {
        return reply.code(500).send({ error: updateError.message });
      }

      return reply.code(200).send({ brand: updatedBrand });
    } catch (error) {
      console.log("error", error);
      return reply.code(500).send({ error: error.message });
    }
  });

}