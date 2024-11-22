import type { FastifyInstance, RouteOptions } from "fastify";
import prisma from "indexer-prisma"
import { HTTPStatus } from "../../utils/http";
import { isValidStarknetAddress } from "../../../utils/starknet";

async function nameserviceRoutes(fastify: FastifyInstance, options: RouteOptions) {
  fastify.get("/username-claimed", async (request, reply) => {
    try {
      const usernamesClaimed = await prisma.username_claimed.findMany({
        // where: { transaction_type: "buy" },
        select: {
          owner_address: true,
          username: true,
          time_stamp: true,
          paid: true,
          quote_address: true,
          expiry: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: usernamesClaimed,
      });
    } catch (error) {
      console.error("Error fetching buy tokens:", error);
      reply
        .status(HTTPStatus.InternalServerError)
        .send({ message: "Internal server error." });
    }
  });
  fastify.get("/username-claimed/:user", async (request, reply) => {
    try {
      const { user } = request.params;
      if (!isValidStarknetAddress(user)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: "Invalid token address",
        });
        return;
      }

      const usernameClaimedByUser = await prisma.username_claimed.findMany({
        where: { owner_address: user },
        select: {
          owner_address: true,
          username: true,
          time_stamp: true,
          paid: true,
          quote_address: true,
          expiry: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: usernameClaimedByUser,
      });
    } catch (error) {
      console.error("Error fetching username by user:", error);
      reply
        .status(HTTPStatus.InternalServerError)
        .send({ message: "Internal server error." });
    }
  });
}

export default nameserviceRoutes;
