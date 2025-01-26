import type { FastifyInstance, RouteOptions } from 'fastify';
import prisma from 'indexer-prisma';
import { HTTPStatus } from '../../utils/http';
import { isValidStarknetAddress } from '../../utils/starknet';

interface HoldingsParams {
  tokenAddress: string;
}

async function holdingsRoute(fastify: FastifyInstance, options: RouteOptions) {

  fastify.get<{
    Params: HoldingsParams;
  }>('/token-distribution/:tokenAddress', async (request, reply) => {
    const { tokenAddress } = request.params;
    if (!isValidStarknetAddress(tokenAddress)) {
      reply.status(HTTPStatus.BadRequest).send({
        code: HTTPStatus.BadRequest,
        message: 'Invalid token address',
      });
      return;
    }

    try {

      const holdings = await prisma.shares_token_user.findMany({
        where: { token_address: tokenAddress, },
        select: {
          owner: true,
          token_address: true,
          amount_owned: true,
          // created_at: true,
        },
      });

      // const distributions = await prisma.token_transactions.groupBy({
      //   by: ['owner_address', 'transaction_type'],
      //   // by: ["owner_address", "transaction_type"], // TODO add by tx type and sum sell and buy
      //   where: { memecoin_address: tokenAddress },
      //   _sum: {
      //     amount: true,
      //   },
      //   _count: {
      //     owner_address: true,
      //   },
      // });

      // if (distributions.length === 0) {
      //   reply.status(HTTPStatus.NotFound).send({
      //     message: 'No holders found for this token address.',
      //   });
      // }

      reply.status(HTTPStatus.OK).send({ data: holdings });
    } catch (error) {
      console.error('Failed to fetch holders distribution:', error);
      reply.status(HTTPStatus.InternalServerError).send({
        message: 'Internal Server Error while fetching token distribution.',
      });
    }
  });

  fastify.get<{
    Params: HoldingsParams;
  }>('/token-distribution-holders/:tokenAddress', async (request, reply) => {
    const { tokenAddress } = request.params;
    if (!isValidStarknetAddress(tokenAddress)) {
      reply.status(HTTPStatus.BadRequest).send({
        code: HTTPStatus.BadRequest,
        message: 'Invalid token address',
      });
      return;
    }

    try {
      const distributions = await prisma.token_transactions.groupBy({
        by: ['owner_address', 'transaction_type'],
        // by: ["owner_address", "transaction_type"], // TODO add by tx type and sum sell and buy
        where: { memecoin_address: tokenAddress },
        _sum: {
          amount: true,
        },
        _count: {
          owner_address: true,
        },
      });

      if (distributions.length === 0) {
        reply.status(HTTPStatus.NotFound).send({
          message: 'No holders found for this token address.',
        });
      }

      reply.status(HTTPStatus.OK).send({ data: distributions });
    } catch (error) {
      console.error('Failed to fetch token distribution:', error);
      reply.status(HTTPStatus.InternalServerError).send({
        message: 'Internal Server Error while fetching token distribution.',
      });
    }
  });
}

export default holdingsRoute;
