import type { FastifyInstance, RouteOptions } from 'fastify';
import prisma from 'indexer-prisma';
import { HTTPStatus } from '../../utils/http';
import { isValidStarknetAddress } from '../../utils/starknet';

interface ShareUserParams {
  token: string;
  owner_address?: string;
}

async function routesShareUserRoutes(fastify: FastifyInstance, options: RouteOptions) {
  fastify.get<{
    Params: ShareUserParams;
  }>('/share-user/:owner_address/:token', async (request, reply) => {
    try {
      const { token, owner_address } = request.params;
      if (!isValidStarknetAddress(token)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid token address',
        });
        return;
      }

      if (!isValidStarknetAddress(owner_address)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid owner address',
        });
        return;
      }

      const share_by_user = await prisma.shares_token_user.findFirst({
        where: { token_address: token, owner:owner_address },
        select: {
          owner: true,
          token_address: true,
          amount_owned: true,
          // created_at: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: share_by_user,
      });
    } catch (error) {
      console.error('Error share by user:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });
  fastify.get<{
    Params: ShareUserParams;
  }>('/share-user/', async (request, reply) => {
    try {
  
      const share_by_user = await prisma.shares_token_user.findMany({
        // where: { token_address: token, owner:owner_address },
        select: {
          owner: true,
          token_address: true,
          amount_owned: true,
          // created_at: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: share_by_user,
      });
    } catch (error) {
      console.error('Error share by user:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });
}

export default routesShareUserRoutes;
