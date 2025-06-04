import { FastifyInstance, FastifyRequest } from 'fastify';
import { UserJwtPayload } from '../../types';
import { SocialVerificationService } from '../../services/social/verification.service';

interface LinkAccountBody {
    platform: string;
    handle: string;
}

interface VerifyAccountBody {
    platform: string;
    code: string;
}

export default async function profileRoutes(fastify: FastifyInstance) {
    const socialVerificationService = new SocialVerificationService(fastify.prisma);

    // Link social account
    fastify.post<{ Body: LinkAccountBody }>('/social/link-account', {
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        try {
            if (!request.user) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }

            const { platform, handle } = request.body;

            const verificationCode = await socialVerificationService.generateVerificationCode(
                request.user.id,
                platform,
                handle
            );

            return reply.send({
                success: true,
                data: {
                    verificationCode,
                    instructions: `Please add the verification code "${verificationCode}" to your ${platform} profile bio/description.`,
                },
            });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to link account' });
        }
    });

    // Verify social account
    fastify.post<{ Body: VerifyAccountBody }>('/social/verify-account', {
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        try {
            if (!request.user) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }

            const { platform, code } = request.body;

            const isVerified = await socialVerificationService.verifyAccount(
                request.user.id,
                platform,
                code
            );

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
