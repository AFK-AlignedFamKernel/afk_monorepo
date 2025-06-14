import { FastifyInstance, FastifyRequest } from 'fastify';
import { UserJwtPayload } from '../../types';
import { SocialVerificationService } from '../../services/social/verification.service';
import { supabaseAuthMiddleware } from '../../middleware/supabase-auth';
import { supabaseAdmin } from '../../services/supabase';

interface LinkAccountBody {
    platform: string;
    handle: string;
}

interface VerifyAccountBody {
    platform: string;
    verification_code: string;
}

export default async function profileRoutes(fastify: FastifyInstance) {
    const socialVerificationService = new SocialVerificationService(fastify.prisma);


    fastify.get('/social/code-generated', {
        preHandler: supabaseAuthMiddleware
    }, async (request, reply) => {
        console.log('social/code-generated');
        console.log('request.user', request.user);
        if (!request.user) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { data, error } = await supabaseAdmin.from('social_verification_codes').select('*').eq('user_id', request.user.id);

        console.log('data', data);
        console.log('error', error);
        if (error) {
            return reply.status(500).send({ error: error.message });
        }

        return reply.send({
            success: true,
            data: data,
        });
    });
    // Link social account
    fastify.post<{ Body: LinkAccountBody }>('/social/link-account', {
        preHandler: supabaseAuthMiddleware
    }, async (request, reply) => {
        try {
            console.log('request.user', request.user);
            if (!request.user) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }
            const { platform, handle } = request.body;


            const verificationCode = await socialVerificationService.generateVerificationCode(request.user.id, platform, handle);

            console.log('verificationCode', verificationCode);
            const { data, error } = await supabaseAdmin.from('social_verification_codes').insert({
                user_id: request.user.id,
                platform,
                handle,
                verification_code: verificationCode,
            });


            console.log('data', data);
            console.log('error', error);


            return reply.send({
                success: true,
                data: {
                    verificationCode,
                    instructions: `Please add the verification code "${verificationCode}" to your ${platform} profile bio/description.`,
                },
            });
        } catch (error) {
            // request.log.error(error);
            console.log('error', error);
            return reply.status(500).send({ error: 'Failed to link account' });
        }
    });

    // Verify social account
    fastify.post<{ Body: VerifyAccountBody }>('/social/verify-account', {
        preHandler: supabaseAuthMiddleware
    }, async (request, reply) => {
        try {
            if (!request.user) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }

            const { platform, verification_code } = request.body;


            const { data, error } = await supabaseAdmin.from('social_verification_codes').select('*').eq('user_id', request.user.id).eq('platform', platform).eq('verification_code', verification_code).eq('is_verified', false).single();

            console.log('data', data);
            console.log('error', error);

            if (error) {
                return reply.status(500).send({ error: error.message });
            }
            if (!data) {
                return reply.status(400).send({ error: 'Verification code not found' });
            }

            const isVerified = await socialVerificationService.verifyAccount(
                data.handle,
                data.platform,
                data.verification_code
            );
            console.log('isVerified', isVerified);

            if (!isVerified) {
                return reply.status(400).send({
                    success: false,
                    message: 'Verification failed. Please make sure the code is in your profile bio.',
                });
            }

            return reply.send({
                success: true,
                message: 'Account verified successfully',
            });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to verify account' });
        }
    });
}
