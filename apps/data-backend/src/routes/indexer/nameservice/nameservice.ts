import type { FastifyInstance, RouteOptions } from "fastify";
import prisma from "indexer-prisma"
import { HTTPStatus } from "../../../utils/http";
import { isValidStarknetAddress } from "../../../utils/starknet";

interface NameserviceParams {
  username?: string;
  owner_address?:string
}

async function nameserviceRoutes(fastify: FastifyInstance, options: RouteOptions) {
  fastify.get<{
    Params: NameserviceParams;
  }>("/username-claimed", async (request, reply) => {
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
  fastify.get<{
    Params: NameserviceParams;
  }>("/username-claimed/:username", async (request, reply) => {
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
  fastify.get<{
    Params: NameserviceParams;
  }>("/username-claimed/:user", async (request, reply) => {
    try {
      const { username } = request.params;

      const usernameClaimedByUser = await prisma.username_claimed.findMany({
        where: { owner_address: username },
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
