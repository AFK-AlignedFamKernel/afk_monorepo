import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { supabaseAdmin } from '../../services/supabase';
import { supabaseAuthMiddleware } from '../../middleware/supabase-auth';
import { z } from 'zod';

const messageSchema = z.object({
  group_id: z.string().optional(),
  group_provider: z.string().optional(),
  brand_id: z.string().optional(),
  brand: z.string().optional(),
  community_name: z.string().optional(),
  community_id: z.string().optional(),
  text: z.string().optional(),
  content: z.string().min(1),
  timestamp: z.string().optional(),
  signature: z.string().optional(),
  pubkey: z.string().optional(),
  internal: z.boolean().default(false),
  likes: z.number().default(0),
  tweeted: z.boolean().default(false),
  parent_id: z.string().optional(),
  reply_count: z.number().default(0),
  owner_id: z.string().optional(),
  image_url: z.string().optional(),
  video_url: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

export default async function messageRoutes(fastify: FastifyInstance) {


  fastify.get('/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      let query = supabaseAdmin
        .from('messages')
        .select('*');
      const { data, error } = await query;
      if (error) {
        return reply.code(500).send({ error: error.message });
      }
      return reply.code(200).send({ messages: data });
    } catch (error) {
      console.log("error", error)
      return reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/messages/owned', {
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
        .from('messages')
        .select('*')
        .eq('owner_id', request.user.id);

      const { data, error } = await query;
      console.log("data", data)
      if (error) {
        return reply.code(500).send({ error: error.message });
      }
      return reply.code(200).send({ messages: data });
    } catch (error) {
      console.log("error", error)
      return reply.code(500).send({ error: error.message });
    }
  });

  fastify.post('/messages/create', {
    preHandler: [supabaseAuthMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {

      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      if (!request?.user?.identities?.length) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }


      const res = messageSchema.safeParse(request.body);
      console.log("zod res", res?.error?.issues)

      console.log("request.body", request.body)

      if (!res.success) {
        return reply.code(400).send({ error: 'Invalid request body' });
      }
      // const { group_id } = res.data;
      // const { data, error } = await supabaseAdmin.from('messages').select('*').single();

      // if (data) {
      //   return reply.code(400).send({ error: 'Message already exists' });
      // }

      console.log("res.data", res?.data)
      const { data: message, error: messageError } = await supabaseAdmin.from('messages').insert({
        group_id: res.data.group_id ?? res?.data?.community_id,
        group_provider: res.data.group_provider ?? res?.data?.community_name ?? res?.data?.community_id ?? '',
        brand_id: res.data.brand_id,
        brand: res.data.brand ?? '',
        community_name: res.data.community_name,
        community_id: res.data.community_id,
        text: res?.data?.content ?? res?.data?.text ?? '',
        content: res.data.content ?? res?.data?.text ?? '',
        timestamp: res.data.timestamp,
        signature: res.data.signature,
        pubkey: res.data.pubkey,
        internal: res.data.internal,
        likes: res.data.likes,
        tweeted: res.data.tweeted,
        parent_id: res.data.parent_id,
        reply_count: res.data.reply_count,
        owner_id: res.data.owner_id,
        image_url: res.data.image_url,
        video_url: res.data.video_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).select('*').single();

      console.log("message error", messageError)

      if (messageError) {
        return reply.code(500).send({ error: messageError.message });
      }

      return reply.code(200).send({ message: message });
    } catch (error) {
      console.log("error", error)
      return reply.code(500).send({ error: error.message });
    }
  });


  fastify.post('/messages/update', {
    preHandler: [supabaseAuthMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      if (!request?.user?.identities?.length) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const res = messageSchema.safeParse(request.body);

      console.log("res", res)
      console.log("res error", res?.error?.issues)
      if (!res.success) {
        return reply.code(400).send({ error: 'Invalid request body' });
      }

      const { group_id } = res.data;
      const { data: existingMessage, error: fetchError } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('group_id', group_id)
        .single();

      if (fetchError) {
        return reply.code(500).send({ error: 'Error checking message existence' });
      }

      if (!existingMessage) {
        return reply.code(404).send({ error: 'Message not found' });
      }

      // Check if user owns the brand
      const userId = request.user.id;
      if (existingMessage.owner_id !== userId) {
        return reply.code(403).send({ error: 'You do not have permission to update this message' });
      }

      const { data: updatedMessage, error: updateError } = await supabaseAdmin
        .from('messages')
        .update({
          text: res.data.text,
          timestamp: res.data.timestamp,
          signature: res.data.signature,
          pubkey: res.data.pubkey,
          internal: res.data.internal,
          likes: res.data.likes,
          tweeted: res.data.tweeted,
          parent_id: res.data.parent_id,
          reply_count: res.data.reply_count,
          image_url: res.data.image_url,
          video_url: res.data.video_url,
          updated_at: new Date().toISOString()
        })
        .eq('group_id', group_id)
        .select('*')
        .single();

      if (updateError) {
        return reply.code(500).send({ error: updateError.message });
      }

      return reply.code(200).send({ message: updatedMessage });
    } catch (error) {
      console.log("error", error);
      return reply.code(500).send({ error: error.message });
    }
  });

  fastify.post('/messages/create-reply', {
    preHandler: [supabaseAuthMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const res = messageSchema.safeParse(request.body);
      console.log("res", res)
      console.log("res error", res?.error?.issues)
      if (!res.success) {
        return reply.code(400).send({ error: 'Invalid request body' });
      }

      if (!res.data.parent_id) {
        return reply.code(400).send({ error: 'Parent ID is required' });
      }

      const { data: parentMessage, error: parentMessageError } = await supabaseAdmin.from('messages').select('*').eq('id', res.data.parent_id).single();

      if (parentMessageError) {
        return reply.code(500).send({ error: parentMessageError.message });
      }

      if (!parentMessage) {
        return reply.code(400).send({ error: 'Parent message not found' });
      }

      const { data: message, error: messageError } = await supabaseAdmin.from('messages').insert({
        group_id: res.data.group_id ?? res?.data?.community_id,
        group_provider: res.data.group_provider ?? res?.data?.community_name ?? res?.data?.community_id ?? '',
        brand_id: res.data.brand_id,
        brand: res.data.brand ?? '',
        community_name: res.data.community_name,
        community_id: res.data.community_id,
        text: res?.data?.content ?? res?.data?.text ?? '',
        content: res.data.content ?? res?.data?.text ?? '',
        timestamp: res.data.timestamp,
        signature: res.data.signature,
        pubkey: res.data.pubkey,
        internal: res.data.internal,
        likes: res.data.likes,
        tweeted: res.data.tweeted,
        parent_id: res.data.parent_id,
        reply_count: res.data.reply_count,
        owner_id: res.data.owner_id,
        image_url: res.data.image_url,
        video_url: res.data.video_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).select('*').single();

      if (messageError) {
        return reply.code(500).send({ error: messageError.message });
      }

      try {
        console.log("update reply count")
        const { data: message, error: messageError } = await supabaseAdmin.from('messages').update({
          reply_count: parentMessage.reply_count + 1
        }).eq('id', parentMessage.id).select('*').single();
      } catch (error) {
        console.log("error", error);
      }

      return reply.code(200).send({ message: message });
    } catch (error) {
      console.log("error", error);
      return reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/messages/get-replies', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { parent_id } = request.query as any;

      console.log("parent_id", parent_id)
      if (!parent_id) {
        return reply.code(400).send({ error: 'Parent ID is required' });
      }

      const { data, error } = await supabaseAdmin.from('messages').select('*').eq('parent_id', parent_id);
      if (error) {
        return reply.code(500).send({ error: error.message });
      }
      return reply.code(200).send({ messages: data });
    } catch (error) {
      console.log("error", error);
      return reply.code(500).send({ error: error.message });
    }
  });

  fastify.post('/messages/like', {
    preHandler: [supabaseAuthMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { parent_id, } = request.body as any;
      if (!parent_id) {
        return reply.code(400).send({ error: 'Parent ID is required' });
      }

      const { data: message, error: messageError } = await supabaseAdmin.from('messages').select('*').eq('id', parent_id).single();
      if (messageError) {
        return reply.code(500).send({ error: messageError.message });
      }

      const { data, error } = await supabaseAdmin.from('messages').update({
        likes: message.likes + 1
      }).eq('id', parent_id).select('*').single();

      console.log("like message", data)
      console.log("error", error)
      if (error) {
        return reply.code(500).send({ error: error.message });
      }
      return reply.code(200).send({ message: data });
    } catch (error) {
      console.log("error", error);
      return reply.code(500).send({ error: error.message });
    }
  });
}