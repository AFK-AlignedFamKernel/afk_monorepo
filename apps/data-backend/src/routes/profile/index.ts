import { FastifyInstance, FastifyRequest } from 'fastify';
import { SocialVerificationService } from '../../services/social/verification.service';

interface LinkAccountBody {
    platform: string;
    handle: string;
}

interface VerifyAccountBody {
    platform: string;
}

export async function profileRoutes(fastify: FastifyInstance) {
    const socialVerificationService = new SocialVerificationService(fastify.prisma);
    fastify.post<{ Body: LinkAccountBody }>(
        '/social/link-account',
        {
            onRequest: [fastify.authenticate],
            schema: {
                body: {
                    type: 'object',
                    required: ['platform', 'handle'],
                    properties: {
                        platform: { type: 'string' },
                        handle: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Body: LinkAccountBody }>, reply) => {
            try {
                const { platform, handle } = request.body;
                const verificationCode = await socialVerificationService.generateVerificationCode(
                    request.user.id,
                    platform,
                    handle
                );

                return {
                    success: true,
                    data: {
                        verificationCode,
                        instructions: `Please add the verification code "${verificationCode}" to your ${platform} profile bio/description.`,
                    },
                };
            } catch (error) {
                request.log.error(error);
                return reply.code(500).send({ error: 'Internal server error' });
            }
        }
    );

    fastify.post<{ Body: VerifyAccountBody }>(
        '/social/verify-account',
        {
            onRequest: [fastify.authenticate],
            schema: {
                body: {
                    type: 'object',
                    required: ['platform'],
                    properties: {
                        platform: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Body: VerifyAccountBody }>, reply) => {
            try {
                const { platform } = request.body;
                const isVerified = await socialVerificationService.verifyAccount(
                    request.user.id,
                    platform
                );

                if (!isVerified) {
                    return reply.code(400).send({
                        success: false,
                        message: 'Verification failed. Please make sure the code is in your profile bio.',
                    });
                }

                return {
                    success: true,
                    message: 'Account verified successfully',
                };
            } catch (error) {
                request.log.error(error);
                return reply.code(500).send({ error: 'Internal server error' });
            }
        }
    );
}
