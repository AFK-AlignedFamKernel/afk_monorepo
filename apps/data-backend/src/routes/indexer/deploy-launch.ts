import type { FastifyInstance, RouteOptions } from "fastify";
import { prisma } from "indexer-prisma";
import { HTTPStatus } from "../../utils/http";
import { isValidStarknetAddress } from "../../utils/starknet";

interface DeployLaunchParams {
  launch: string;
}

async function deployLaunchRoute(
  fastify: FastifyInstance,
  options: RouteOptions
) {
  fastify.get("/deploy-launch", async (request, reply) => {
    try {
      const launches = await prisma.token_launch.findMany({
        select: {
          memecoin_address: true,
          price: true,
          total_supply: true,
          network: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: launches,
      });
    } catch (error) {
      console.error("Error deploying launch:", error);
      reply
        .status(HTTPStatus.InternalServerError)
        .send({ message: "Internal server error." });
    }
  });

  fastify.get<{
    Params: DeployLaunchParams;
  }>("/deploy-launch/:launch", async (request, reply) => {
    try {
      const { launch } = request.params;
      if (!isValidStarknetAddress(launch)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: "Invalid token address",
        });
        return;
      }

      const launches = await prisma.token_launch.findMany({
        where: {
          memecoin_address: launch,
        },
        select: {
          memecoin_address: true,
          price: true,
          total_supply: true,
          network: true,
        },
      });
      reply.status(HTTPStatus.OK).send({
        data: launches,
      });
    } catch (error) {
      console.error("Error deploying launch:", error);
      reply
        .status(HTTPStatus.InternalServerError)
        .send({ message: "Internal server error." });
    }
  });

  fastify.get<{
    Params: DeployLaunchParams;
  }>("/deploy-launch/stats/:launch", async (request, reply) => {
    try {
      const { launch } = request.params;
      if (!isValidStarknetAddress(launch)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: "Invalid token address",
        });
        return;
      }

      const launches = await prisma.token_launch.findMany({
        select: {
          memecoin_address: true,
          price: true,
          total_supply: true,
          network: true,
        },
      });

      let statsLaunch = launches[0];

      reply.status(HTTPStatus.OK).send({
        data: statsLaunch,
      });
    } catch (error) {
      console.error("Error deploying launch:", error);
      reply
        .status(HTTPStatus.InternalServerError)
        .send({ message: "Internal server error." });
    }
  });
}

export default deployLaunchRoute;
