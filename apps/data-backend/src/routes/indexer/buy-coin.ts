import type { FastifyInstance, RouteOptions } from "fastify";
import { prisma } from "indexer-prisma";
import { HTTPStatus } from "../../utils/http";

async function buyCoinRoute(fastify: FastifyInstance, options: RouteOptions) {
  fastify.get("/buy-coin", async (request, reply) => {
    try {
      const buyTokens = await prisma.token_transactions.findMany({
        where: { transaction_type: "buy" },
        select: {
          memecoin_address: true,
          amount: true,
          price: true,
          coin_received: true,
          liquidity_raised: true,
          total_supply: true,
          network: true,
          transaction_type: true,
          created_at: true
        }
      });

      if (!buyTokens.length) {
        reply.status(HTTPStatus.OK).send({
          data: buyTokens
        });
      }

      const formattedBuyTokens = buyTokens.map((entry) => {
        const amount = (Number(entry.amount) / 10 ** 18).toLocaleString();
        const price = (Number(entry.price) / 10 ** 18).toLocaleString();
        const total_supply = (
          Number(entry.total_supply) /
          10 ** 18
        ).toLocaleString();
        const liquidity_raised = (
          Number(entry.liquidity_raised) /
          10 ** 18
        ).toLocaleString();

        return {
          ...entry,
          amount,
          price,
          total_supply,
          liquidity_raised
        };
      });

      reply.status(HTTPStatus.OK).send({
        data: formattedBuyTokens
      });
    } catch (error) {
      console.error("Error fetching buy tokens:", error);
      reply
        .status(HTTPStatus.InternalServerError)
        .send({ message: "Internal server error." });
    }
  });
}

export default buyCoinRoute;
