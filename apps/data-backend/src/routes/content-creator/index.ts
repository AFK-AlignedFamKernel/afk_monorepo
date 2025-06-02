import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { supabaseAdmin } from '../../services/supabase';
import { supabaseAuthMiddleware } from '../../middleware/supabase-auth';

export default async function contentCreatorRoutes(fastify: FastifyInstance) {
  // List all social identities


  fastify.get('/content-creator/view-profile', async (request: FastifyRequest, reply: FastifyReply) => {

    try {
      const { slug_name } = request.query as any;

      if(!slug_name) {
        return reply.code(400).send({ error: 'Slug name is required' });
      }

      console.log("slug_name", slug_name)

      console.log("fetch content creators data")
      const { data, error } = await supabaseAdmin
        .from('content_creators')
        .select('*')
        .eq('slug_name', slug_name)
        .single();  

      console.log("fetch content creators data", data)
      console.log("fetch content creators error", error)


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

    console.log("fetch content creators")
    try {
      console.log("fetch content creators")
      const { data, error } = await supabaseAdmin
        .from('content_creators')
        .select('*')
        .order('created_at', { ascending: false })
      // .eq('is_verified', true);

      console.log("fetch content creators data", data)
      console.log("fetch content creators error", error)

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


  // Link/claim a social identity (link to user)
  fastify.post('/content-creator/verify_identity', { preHandler: supabaseAuthMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {

    try {

      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      if (!request?.user?.identities?.length) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }



      const { id, slug_name } = request.body as any;
      console.log("request?.user?.identities", request?.user?.identities)

      const slugName  = slug_name?.replace(" ","-") ?? request?.user?.identities[0]?.identity_data?.full_name?.replace(" ","-") ?? "Anonymous"
      const identities = request?.user?.identities.map((identity: any) => {
        return {
          slug_name: slugName,
          provider: identity?.identity_data?.provider,
          name: identity?.identity_data?.full_name,
          full_name: identity?.identity_data?.full_name,
          email_verified: identity?.identity_data?.email_verified,
          user_name: identity?.identity_data?.user_name,
          avatar_url: identity?.identity_data?.avatar_url,
          identity_data: {
            provider: identity?.identity_data?.provider,
            name: identity?.identity_data?.full_name,
            full_name: identity?.identity_data?.full_name,
            email_verified: identity?.identity_data?.email_verified,
            user_name: identity?.identity_data?.user_name,
            avatar_url: identity?.identity_data?.avatar_url,
          }
        }
      })


      console.log("slugName", slugName)

      const { data: isExistsSlug, error: isExistsSlugError } = await supabaseAdmin
        .from('content_creators')
        .select('*')
        .eq('slug_name', slugName)
        .single();

      console.log("isExistsSlug", isExistsSlug)

      const { data: isExists, error: isExistsError } = await supabaseAdmin
        .from('content_creators')
        .select('*')
        .eq('owner_id', request?.user?.id)
        .single();

      console.log("isExists", isExists)


      if (isExistsSlug) {
        const { data, error } = await supabaseAdmin
          .from('content_creators')
          .update({
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

        console.log("data", data)
        console.log("error", error)
      }

      else if (isExists) {
        const { data, error } = await supabaseAdmin
          .from('content_creators')
          .update({
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

        console.log("data", data)
        console.log("error", error)
        return reply.code(200).send({ isSuccess: true });
      }


      if (!isExists) {
        const { data, error } = await supabaseAdmin
          .from('content_creators')
          .upsert({
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

        console.log("data", data)
        console.log("error", error)
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