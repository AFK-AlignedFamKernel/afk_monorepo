import type { FastifyInstance, RouteOptions } from "fastify";
import { prisma } from "indexer-prisma";
import { HTTPStatus } from "../../utils/http";
import { isValidStarknetAddress } from "../../utils/starknet";

interface DeployTokenParams {
  token: string;
}

async function deployTokenRoute(
  fastify: FastifyInstance,
  options: RouteOptions
) {
  fastify.get("/deploy", async (request, reply) => {
    try {
      const deploys = await prisma.token_deploy.findMany({
        select: {
          memecoin_address: true,
          owner_address: true,
          name: true,
          symbol: true,
          total_supply: true,
          network: true,
          created_at: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: deploys,
      });
    } catch (error) {
      console.error("Error deploying launch:", error);
      reply
        .status(HTTPStatus.InternalServerError)
        .send({ message: "Internal server error." });
    }
  });

  fastify.get<{
    Params: DeployTokenParams;
  }>("/deploy/:token", async (request, reply) => {
    try {
      const { token } = request.params;
      if (!isValidStarknetAddress(token)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: "Invalid token address",
        });
        return;
      }

      const deploys = await prisma.token_deploy.findMany({
        where: { memecoin_address: token },
        select: {
          memecoin_address: true,
          owner_address: true,
          name: true,
          symbol: true,
          total_supply: true,
          network: true,
          created_at: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: deploys,
      });
    } catch (error) {
      console.error("Error deploying launch:", error);
      reply
        .status(HTTPStatus.InternalServerError)
        .send({ message: "Internal server error." });
    }
  });
}

export default deployTokenRoute;
