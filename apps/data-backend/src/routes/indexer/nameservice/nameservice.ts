import type { FastifyInstance, RouteOptions } from "fastify";
import prisma from "indexer-prisma"
import { HTTPStatus } from "../../utils/http";

async function nameserviceRoutes(fastify: FastifyInstance, options: RouteOptions) {
  fastify.get("/username-claimed", async (request, reply) => {
    try {
      const buyTokens = await prisma.username_claimed.findMany({
        // where: { transaction_type: "buy" },
        select: {
          memecoin_address: true,
          amount: true,
          price: true,
          coin_received: true,
          liquidity_raised: true,
          total_supply: true,
          network: true,
          transaction_type: true,
          time_stamp: true,
          quote_amount: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: buyTokens,
      });
    } catch (error) {
      console.error("Error fetching buy tokens:", error);
      reply
        .status(HTTPStatus.InternalServerError)
        .send({ message: "Internal server error." });
    }
  });
  // fastify.get("/username-claimed/:user", async (request, reply) => {
  //   try {
  //     const buyTokens = await prisma.username_claimed.findMany({
  //       // where: { transaction_type: "buy" },
  //       select: {
  //         memecoin_address: true,
  //         amount: true,
  //         price: true,
  //         coin_received: true,
  //         liquidity_raised: true,
  //         total_supply: true,
  //         network: true,
  //         transaction_type: true,
  //         time_stamp: true,
  //         quote_amount: true,
  //       },
  //     });

  //     reply.status(HTTPStatus.OK).send({
  //       data: buyTokens,
  //     });
  //   } catch (error) {
  //     console.error("Error fetching buy tokens:", error);
  //     reply
  //       .status(HTTPStatus.InternalServerError)
  //       .send({ message: "Internal server error." });
  //   }
  // });
}

export default nameserviceRoutes;
