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
          liquidity_raised: true,
          network: true,
          created_at: true
        }
      });

      if (!launches.length) {
        reply.status(HTTPStatus.OK).send({
          data: launches
        });
      }

      const formattedLaunches = launches.map((entry) => {
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
          price,
          total_supply,
          liquidity_raised
        };
      });

      reply.status(HTTPStatus.OK).send({
        data: formattedLaunches
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
          message: "Invalid token address"
        });
        return;
      }

      const launches = await prisma.token_launch.findMany({
        where: {
          memecoin_address: launch
        },
        select: {
          memecoin_address: true,
          price: true,
          total_supply: true,
          liquidity_raised: true,
          network: true,
          created_at: true
        }
      });

      if (!launches.length) {
        reply.status(HTTPStatus.OK).send({
          data: launches
        });
      }

      const formattedLaunches = launches.map((entry) => {
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
          price,
          total_supply,
          liquidity_raised
        };
      });

      reply.status(HTTPStatus.OK).send({
        data: formattedLaunches
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
          message: "Invalid token address"
        });
        return;
      }

      const launches = await prisma.token_launch.findMany({
        select: {
          memecoin_address: true,
          price: true,
          total_supply: true,
          liquidity_raised: true,
          network: true,
          created_at: true
        }
      });

      if (!launches.length) {
        reply.status(HTTPStatus.OK).send({
          data: launches
        });
      }

      let statsLaunch = launches[0];

      const formattedStatsLaunch = {
        ...statsLaunch,
        price: (Number(statsLaunch.price) / 10 ** 18).toLocaleString(),
        total_supply: (
          Number(statsLaunch.total_supply) /
          10 ** 18
        ).toLocaleString(),
        liquidity_raised: (
          Number(statsLaunch.liquidity_raised) /
          10 ** 18
        ).toLocaleString()
      };

      reply.status(HTTPStatus.OK).send({
        data: formattedStatsLaunch
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
