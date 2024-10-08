import type { FastifyInstance, RouteOptions } from "fastify";
import { prisma } from "indexer-prisma";
import { HTTPStatus } from "../../utils/http";
import { isValidStarknetAddress } from "../../utils/starknet";

interface TokenStatsParams {
  tokenAddress: string;
}

async function tokenStatsRoute(
  fastify: FastifyInstance,
  options: RouteOptions
) {
  fastify.get<{
    Params: TokenStatsParams;
  }>("/stats/:tokenAddress", async (request, reply) => {
    const { tokenAddress } = request.params;
    if (!isValidStarknetAddress(tokenAddress)) {
      reply.status(HTTPStatus.BadRequest).send({
        code: HTTPStatus.BadRequest,
        message: "Invalid token address",
      });
      return;
    }

    try {
      // Query the latest price and liquidity raised
      const stats = await prisma.token_transactions.findFirst({
        where: { memecoin_address: tokenAddress },
        orderBy: { created_at: "desc" },
        select: {
          price: true,
          liquidity_raised: true,
          coin_received: true,
          total_supply: true,
          network: true,
          last_price: true,
          amount: true,
          quote_amount: true,
        },
      });

      if (stats) {
        reply.status(HTTPStatus.OK).send(stats);
      } else {
        reply.status(HTTPStatus.NotFound).send({
          error: "No data found for the specified token address.",
        });
      }
    } catch (error) {
      reply.status(HTTPStatus.InternalServerError).send({
        error: "Internal Server Error while fetching statistics.",
      });
    }
  });
}

export default tokenStatsRoute;
