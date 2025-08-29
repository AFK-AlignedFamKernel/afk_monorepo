import fastify, { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UserJwtPayload } from '../../types';
import { supabaseAuthMiddleware } from '../../middleware/supabase-auth';
import { supabaseAdmin } from '../../services/supabase';

const shopSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    slug_name: z.string().min(1),
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
    owner_id: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    starknet_address: z.string().optional(),
    evm_address: z.string().optional(),
    btc_address: z.string().optional(),
    is_active: z.boolean().optional(),
});

export default async function shopRoutes(fastify: FastifyInstance) {
    // Get all shops
    fastify.get('/shops', async (request, reply) => {
        try {
            const { data: shops, error } = await supabaseAdmin
                .from('shops')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return reply.send(shops);
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch shops' });
        }
    });

    // Get shop by ID
    fastify.get('/shops/:id', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };

            const { data: shop, error } = await supabaseAdmin
                .from('shops')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (!shop) {
                return reply.status(404).send({ error: 'Shop not found' });
            }

            return reply.send(shop);
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch shop' });
        }
    });

    // Create shop - requires authentication
    fastify.post('/shops/create', {
        preHandler: supabaseAuthMiddleware
    }, async (request, reply) => {
        try {
            if (!request.user) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }

            const shopData = shopSchema.parse(request.body);

            const { data, error } = await supabaseAdmin
                .from('shops')
                .insert([
                    {
                        ...shopData,
                        owner_id: request.user.id,
                    }
                ])
                .select()
                .single();

            console.log("error",error)
            if (error) throw error;

            return reply.status(201).send(data);
        } catch (error) {
            console.log("errors", error)
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to create shop' });
        }
    });

    // Update shop - requires authentication
    fastify.patch('/shops/:id', {
        preHandler: supabaseAuthMiddleware
    }, async (request, reply) => {
        try {
            if (!request.user) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }

            const { id } = request.params as { id: string };
            const shopData = shopSchema.partial().parse(request.body);

            // Check if user is owner or admin
            const { data: shop } = await supabaseAdmin
                .from('shops')
                .select('owner_id')
                .eq('id', id)
                .single();

            if (!shop) {
                return reply.status(404).send({ error: 'Shop not found' });
            }

            const { data: isAdmin } = await supabaseAdmin
                .from('shop_admins')
                .select('id')
                .eq('shop_id', id)
                .eq('user_id', request.user.id)
                .single();

            if (shop.owner_id !== request.user.id && !isAdmin) {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const { data, error } = await supabaseAdmin
                .from('shops')
                .update({
                    ...shopData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return reply.send(data);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to update shop' });
        }
    });

    // Delete shop - requires authentication
    fastify.delete('/shops/:id', {
        preHandler: supabaseAuthMiddleware
    }, async (request, reply) => {
        try {
            if (!request.user) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }

            const { id } = request.params as { id: string };

            // Check if user is owner
            const { data: shop } = await supabaseAdmin
                .from('shops')
                .select('owner_id')
                .eq('id', id)
                .single();

            if (!shop) {
                return reply.status(404).send({ error: 'Shop not found' });
            }

            if (shop.owner_id !== request.user.id) {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const { error } = await supabaseAdmin
                .from('shops')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return reply.status(204).send();
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to delete shop' });
        }
    });
} 