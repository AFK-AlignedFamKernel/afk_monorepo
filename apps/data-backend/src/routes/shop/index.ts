import { FastifyInstance, FastifyRequest } from 'fastify';
import { SocialVerificationService } from '../../services/social/verification.service';

interface LinkAccountBody {
    platform: string;
    handle: string;
}

interface VerifyAccountBody {
    platform: string;
}

export async function shopRoutes(fastify: FastifyInstance) {
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

}
