import type { FastifyInstance, RouteOptions } from "fastify";
import prisma from "indexer-prisma"
import { HTTPStatus } from "../../../utils/http";
import { isValidStarknetAddress } from "../../../utils/starknet";

interface DeployLaunchParams {
  launch: string;
}

// Routes for Unrug data of dashboard
async function unrugRoutes(
  fastify: FastifyInstance,
  options: RouteOptions
) {
  fastify.get("/unrug/create-token", async (request, reply) => {
    try {
      const launches = await prisma.unrugmeme_deploy.findMany({
        select: {
          memecoin_address: true,
      
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
  }>("/unrug/deploy-launch/:launch", async (request, reply) => {
    try {
      const { launch } = request.params;
      if (!isValidStarknetAddress(launch)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: "Invalid token address",
        });
        return;
      }

      const launchPool = await prisma.unrugmeme_launch.findFirst({
        where: {
          memecoin_address: launch,
        },
        select: {
          memecoin_address: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: launchPool,
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
  }>("/unrug/tokens-transfers", async (request, reply) => {
    try {
      const { launch } = request.params;
      if (!isValidStarknetAddress(launch)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: "Invalid token address",
        });
        return;
      }

      const launchStats = await prisma.unrugmeme_transfers.findFirst({
        where: {
          memecoin_address: launch,
        },
        select: {
          memecoin_address: true,
       
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: launchStats,
      });

      reply.status(HTTPStatus.OK).send({
        data: undefined,
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
  }>("/unrug/deploy-launch/stats/:launch", async (request, reply) => {
    try {
      const { launch } = request.params;
      if (!isValidStarknetAddress(launch)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: "Invalid token address",
        });
        return;
      }

      const launchStats = await prisma.token_launch.findFirst({
        where: {
          memecoin_address: launch,
        },
        select: {
          memecoin_address: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: launchStats,
      });

      reply.status(HTTPStatus.OK).send({
        data: undefined,
      });
    } catch (error) {
      console.error("Error deploying launch:", error);
      reply
        .status(HTTPStatus.InternalServerError)
        .send({ message: "Internal server error." });
    }
  });
}

export default unrugRoutes;