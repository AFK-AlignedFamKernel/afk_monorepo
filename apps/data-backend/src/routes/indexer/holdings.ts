import type { FastifyInstance, RouteOptions } from "fastify";
import { prisma } from "indexer-prisma";
import { HTTPStatus } from "../../utils/http";
import { isValidStarknetAddress } from "../../utils/starknet";

interface HoldingsParams {
  tokenAddress: string;
}

async function holdingsRoute(fastify: FastifyInstance, options: RouteOptions) {
  fastify.get<{
    Params: HoldingsParams;
  }>("/token-distribution/:tokenAddress", async (request, reply) => {
    const { tokenAddress } = request.params;
    if (!isValidStarknetAddress(tokenAddress)) {
      reply.status(HTTPStatus.BadRequest).send({
        code: HTTPStatus.BadRequest,
        message: "Invalid token address",
      });
      return;
    }

    try {
      const distributions = await prisma.token_transactions.groupBy({
        by: ["owner_address"],
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
          message: "No holders found for this token address.",
        });
      }

      reply.status(HTTPStatus.OK).send({ data: distributions });
    } catch (error) {
      console.error("Failed to fetch token distribution:", error);
      reply.status(HTTPStatus.InternalServerError).send({
        message: "Internal Server Error while fetching token distribution.",
      });
    }
  });
}

export default holdingsRoute;
