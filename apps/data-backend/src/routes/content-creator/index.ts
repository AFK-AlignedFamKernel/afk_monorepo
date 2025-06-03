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

export default async function contentCreatorRoutes(fastify: FastifyInstance) {
  // List all social identities


  fastify.get('/content-creator/view-profile', async (request: FastifyRequest, reply: FastifyReply) => {
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

      return reply.code(200).send(data);  
    } catch (error) {
      console.log("error", error)
      return reply.code(500).send({ error: error.message });
    }
  }); 

  fastify.get('/content-creator', async (request: FastifyRequest, reply: FastifyReply) => {

    try {
      const { data, error } = await supabaseAdmin
        .from('content_creators')
        .select('*')
        .order('created_at', { ascending: false })
      // .eq('is_verified', true);

      if (error) {
        return reply.code(500).send({ error: error.message });
      }

      return reply.code(200).send(data);
    } catch (error) {
      console.log("error", error)
      return reply.code(500).send({ error: error.message });
    }


  });

  // List all social identities
  fastify.get('/content-creator/my-profile', {
    preHandler: supabaseAuthMiddleware
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Only use request.user, never request.body in GET
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      if (!request?.user?.identities?.length) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      // Fetch the content creator profile by user id
      const { data, error } = await supabaseAdmin
        .from('content_creators')
        .select('*')
        .eq('owner_id', request.user.id)
        .single();
      if (error) {
        return reply.code(500).send({ error: error.message });
      }
      return reply.code(200).send(data);
    } catch (error) {
      console.log('error', error);
      return reply.code(500).send({ error: error.message });
    }
  });


  fastify.get('/content-creator/my-profile/exists', {
    preHandler: supabaseAuthMiddleware
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { slug_name } = request.query as any;

      const { data, error } = await supabaseAdmin
        .from('content_creators')
        .select('*')
        .eq('slug_name', slug_name)
        .single();
      if (error) {
        return reply.code(500).send({ error: error.message });
      }

      if (data) {
        return reply.code(200).send({ isExists: true });
      }

      return reply.code(200).send({ isExists: false });
    } catch (error) {
      console.log("error", error)
      return reply.code(500).send({ error: error.message });
    }
  });


  //  Verify content creator identity using supabase identites and Oauth middleware
  fastify.post('/content-creator/verify_identity', { preHandler: supabaseAuthMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {

    try {

      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      if (!request?.user?.identities?.length) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const res = contentCreatorSchema.safeParse(request.body);
      console.log("zod res", res)
      if (!res.success) {
        return reply.code(400).send({ error: 'Invalid request body' });
      }
      const { slug_name, avatar_url, topics, token_address, starknet_address, evm_address, btc_address, is_active } = res.data;
      const slugName  = slug_name?.replace(" ","-") ?? request?.user?.identities[0]?.identity_data?.full_name?.replace(" ","-") ?? "Anonymous"

      if(!slugName) {
        return reply.code(400).send({ error: 'Slug name is required' });
      }

      const identities = request?.user?.identities.map((identity: any) => {
        return {
          slug_name: slugName,
          provider: identity?.provider ?? identity?.identity_data?.provider,
          name: identity?.identity_data?.full_name,
          full_name: identity?.identity_data?.full_name,
          email_verified: identity?.identity_data?.email_verified,
          user_name: identity?.identity_data?.user_name,
          avatar_url: avatar_url ?? identity?.identity_data?.avatar_url,
          identity_data: {
            provider: identity?.provider ?? identity?.identity_data?.provider,
            name: identity?.identity_data?.full_name,
            full_name: identity?.identity_data?.full_name,
            email_verified: identity?.identity_data?.email_verified,
            user_name: identity?.identity_data?.user_name,
            avatar_url: identity?.identity_data?.avatar_url,
          }
        }
      })


      const { data: isExistsSlug, error: isExistsSlugError } = await supabaseAdmin
        .from('content_creators')
        .select('*')
        .eq('slug_name', slugName)
        .single();

      const { data: isExists, error: isExistsError } = await supabaseAdmin
        .from('content_creators')
        .select('*')
        .eq('owner_id', request?.user?.id)
        .single();

      if (isExistsSlug) {
        const { data, error } = await supabaseAdmin
          .from('content_creators')
          .update({
            topics: topics,
            avatar_url: avatar_url ?? request?.user?.identities[0]?.identity_data?.avatar_url,
            name: request?.user?.identities[0]?.identity_data?.full_name ?? "Anonymous",
            slug_name: slugName ?? request?.user?.identities[0]?.identity_data?.full_name ?? "Anonymous",
            owner_id: request?.user?.id,
            // metadata: {
            // },
            identities: {
              ...identities,
            },
            social_links: {
              ...identities,
            },
            updated_at: new Date().toISOString(),
            token_address: token_address ?? isExists?.token_address,
            starknet_address: starknet_address ?? isExists?.starknet_address,
            evm_address: evm_address ?? isExists?.evm_address,
            btc_address: btc_address ?? isExists?.btc_address,
            is_active: is_active ?? isExists?.is_active,
          })
          .eq('owner_id', request?.user?.id)
          .select()
          .single();
      }

      else if (isExists) {
        const { data, error } = await supabaseAdmin
          .from('content_creators')
          .update({
            topics: topics,
            avatar_url: avatar_url ?? request?.user?.identities[0]?.identity_data?.avatar_url,
            name: request?.user?.identities[0]?.identity_data?.full_name ?? "Anonymous",
            slug_name: slugName ?? request?.user?.identities[0]?.identity_data?.full_name ?? "Anonymous",
            owner_id: request?.user?.id,
            // metadata: {
            // },
            identities: {
              ...identities,
            },
            social_links: {
              ...identities,
            },
            updated_at: new Date().toISOString(),
            token_address: token_address ?? isExists?.token_address,
            starknet_address: starknet_address ?? isExists?.starknet_address,
            evm_address: evm_address ?? isExists?.evm_address,
            btc_address: btc_address ?? isExists?.btc_address,
            is_active: is_active ?? isExists?.is_active,
          })
          .eq('owner_id', request?.user?.id)
          .select()
          .single();

        return reply.code(200).send({ isSuccess: true });
      }


      if (!isExists) {
        const { data, error } = await supabaseAdmin
          .from('content_creators')
          .upsert({
            topics: topics,
            avatar_url: avatar_url ?? request?.user?.identities[0]?.identity_data?.avatar_url,
            name: request?.user?.identities[0]?.identity_data?.full_name ?? "Anonymous",
            slug_name: slugName ?? request?.user?.identities[0]?.identity_data?.full_name ?? "Anonymous",
            owner_id: request?.user?.id,
            // metadata: {
            // },
            identities: {
              ...identities,
            },
            social_links: {
              ...identities,
            },
            updated_at: new Date().toISOString(),
            token_address: token_address ?? isExists?.token_address,
            starknet_address: starknet_address ?? isExists?.starknet_address,
            evm_address: evm_address ?? isExists?.evm_address,
            btc_address: btc_address ?? isExists?.btc_address,
            is_active: is_active ?? isExists?.is_active,
          })
          .eq('owner_id', request?.user?.id)
          .select()
          .single();

        if (error) {
          return reply.code(500).send({ error: error.message });
        }

        if (!data) {
          return reply.code(404).send({ error: 'Identity not found' });
        }
      }

      reply.send({ isSuccess: true });
    } catch (error) {
      console.log("error", error)
      return reply.code(500).send({ error: error.message });
    }
  });


  // Update content creator profile
  fastify.post('/content-creator/update/verify_identity', { preHandler: supabaseAuthMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {

    try {

      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      if (!request?.user?.identities?.length) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }


      const res = contentCreatorSchema.safeParse(request.body);
      console.log("zod res", res?.error?.issues)

      if (!res.success) {
        return reply.code(400).send({ error: 'Invalid request body' });
      }
      const { slug_name, avatar_url, topics, token_address, starknet_address, evm_address, btc_address, is_active } = res.data;
      const slugName  = slug_name?.replace(" ","-") ?? request?.user?.identities[0]?.identity_data?.full_name?.replace(" ","-") ?? "Anonymous"

      if(!slugName) {
        return reply.code(400).send({ error: 'Slug name is required' });
      }
      console.log("body", res?.data)

      console.log("request?.user?.identities", request?.user?.identities)

      const identities = request?.user?.identities.map((identity: any) => {
        return {
          slug_name: slugName,
          provider: identity?.provider ?? identity?.identity_data?.provider,
          name: identity?.identity_data?.full_name,
          full_name: identity?.identity_data?.full_name,
          email_verified: identity?.identity_data?.email_verified,
          user_name: identity?.identity_data?.user_name,
          avatar_url: avatar_url ?? identity?.identity_data?.avatar_url,
          identity_data: {
            provider: identity?.provider ?? identity?.identity_data?.provider,
            name: identity?.identity_data?.full_name,
            full_name: identity?.identity_data?.full_name,
            email_verified: identity?.identity_data?.email_verified,
            user_name: identity?.identity_data?.user_name,
            avatar_url: identity?.identity_data?.avatar_url,
          },
        }
      })


      const { data: isExistsSlug, error: isExistsSlugError } = await supabaseAdmin
        .from('content_creators')
        .select('*')
        .eq('slug_name', slugName)
        .single();

      const { data: isExists, error: isExistsError } = await supabaseAdmin
        .from('content_creators')
        .select('*')
        .eq('owner_id', request?.user?.id)
        .single();

      if (isExistsSlug) {
        const { data, error } = await supabaseAdmin
          .from('content_creators')
          .update({
            topics: topics,
            avatar_url: avatar_url ?? request?.user?.identities[0]?.identity_data?.avatar_url,
            name: request?.user?.identities[0]?.identity_data?.full_name ?? "Anonymous",
            slug_name: slugName ?? request?.user?.identities[0]?.identity_data?.full_name ?? "Anonymous",
            owner_id: request?.user?.id,
            // metadata: {
            // },
            identities: {
              ...identities,
            },
            social_links: {
              ...identities,
            },
            updated_at: new Date().toISOString()
          })
          .eq('owner_id', request?.user?.id)
          .select()
          .single();

      }

      else if (isExists) {
        const { data, error } = await supabaseAdmin
          .from('content_creators')
          .update({
            topics: topics,
            avatar_url: avatar_url ?? request?.user?.identities[0]?.identity_data?.avatar_url,
            name: request?.user?.identities[0]?.identity_data?.full_name ?? "Anonymous",
            slug_name: slugName ?? request?.user?.identities[0]?.identity_data?.full_name ?? "Anonymous",
            owner_id: request?.user?.id,
            // metadata: {
            // },
            identities: {
              ...identities,
            },
            social_links: {
              ...identities,
            },
            updated_at: new Date().toISOString()
          })
          .eq('owner_id', request?.user?.id)
          .select()
          .single();

        return reply.code(200).send({ isSuccess: true });
      }


      if (!isExists) {
        const { data, error } = await supabaseAdmin
          .from('content_creators')
          .upsert({
            topics: topics,
            avatar_url: avatar_url ?? request?.user?.identities[0]?.identity_data?.avatar_url,
            name: request?.user?.identities[0]?.identity_data?.full_name ?? "Anonymous",
            slug_name: slugName ?? request?.user?.identities[0]?.identity_data?.full_name ?? "Anonymous",
            owner_id: request?.user?.id,
            // metadata: {
            // },
            identities: {
              ...identities,
            },
            social_links: {
              ...identities,
            },
            updated_at: new Date().toISOString()
          })
          .eq('owner_id', request?.user?.id)
          .select()
          .single();

        if (error) {
          return reply.code(500).send({ error: error.message });
        }

        if (!data) {
          return reply.code(404).send({ error: 'Identity not found' });
        }
      }

      reply.send({ isSuccess: true });
    } catch (error) {
      console.error("error", error)
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
      .from('content_creators')
      .update({
        is_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('owner_id', request.user.id)
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