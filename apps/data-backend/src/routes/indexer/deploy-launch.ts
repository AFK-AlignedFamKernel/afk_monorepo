import type { FastifyInstance, RouteOptions } from 'fastify';
import prisma from 'indexer-prisma';
import { HTTPStatus } from '../../utils/http';
import { isValidStarknetAddress } from '../../utils/starknet';

import {queries} from 'indexer-v2-db';
const { getAllLaunchpads, getLaunchpadByAddress, getAllTokens, getSharesTokenUserByMemecoinAddress, getTransactionsByMemecoinAddress, getCandlesticksByMemecoinAddress } = queries;
interface DeployLaunchParams {
  launch: string;
  owner_address?: string;
}
interface DeployLaunchByUserParams {
  owner_address: string;
}
async function deployLaunchRoute(fastify: FastifyInstance, options: RouteOptions) {
  fastify.get('/deploy-launch', async (request, reply) => {
    try {
      const { offset = 0, limit = 20 } = request.query as { offset?: number; limit?: number };

      const launches = await getAllLaunchpads({
        offset: offset,
        limit: limit,
      });
      console.log("launches", launches);

      const total = await getAllLaunchpads({});

      reply.status(HTTPStatus.OK).send({
        data: launches,
        pagination: {
          total,
          offset,
          limit,
        },
      });
    } catch (error) {
      console.error('Error deploying launch:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });

  fastify.get<{
    Params: DeployLaunchParams;
  }>('/deploy-launch/:launch', async (request, reply) => {
    try {
      const { launch } = request.params;
      if (!isValidStarknetAddress(launch)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid token address',
        });
        return;
      }

      const launchPool = await getLaunchpadByAddress(launch);

      reply.status(HTTPStatus.OK).send({
        data: launchPool,
      });
    } catch (error) {
      console.error('Error deploying launch:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });

  fastify.get<{
    Params: DeployLaunchParams;
  }>('/deploy-launch/stats/:launch', async (request, reply) => {
    try {
      const { launch } = request.params;
      if (!isValidStarknetAddress(launch)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid token address',
        });
        return;
      }

      const launchStats = await getLaunchpadByAddress(launch);


      const holdings = await getSharesTokenUserByMemecoinAddress({
        offset: 0,
        limit: 20,
        memecoinAddress: launch,
      });

      console.log("holdings", holdings);


      const allTransactions = await getTransactionsByMemecoinAddress({
        offset: 0,
        limit: 20,
        memecoinAddress: launch,
      })

      console.log("allTransactions", allTransactions);

      const intervalMinutes = 5;
      let transformedData: any[] = [];

      try {
        console.log("candles launch", launch);
        const candles = await getCandlesticksByMemecoinAddress({
          memecoinAddress: launch,
          intervalMinutes: intervalMinutes,
          limit: 1000, // Get more candles for stats
        });

        console.log("candles", candles);

        if (candles.length === 0) {
          console.log("No candlesticks found for token:", launch);
        } else {
          transformedData = candles.map((candle) => ({
            open: candle.open,
            close: candle.close,
            low: candle.low,
            high: candle.high,
            timestamp: candle.timestamp,
          }));
        }

      } catch (error) {
        console.error('Error fetching candles:', error);
      }

      console.log("transformedData", transformedData);

      const response = {
        launch: launchStats,
        holdings,
        holders: holdings,
        transactions: allTransactions,
        candles: transformedData,
      };

      reply.status(HTTPStatus.OK).send({
        data: response,
      });

    } catch (error) {
      console.error('Error deploying launch:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });


  fastify.get<{
    Params: DeployLaunchParams;
  }>('/deploy-launch/candles/:launch', async (request, reply) => {
    try {
      const { launch } = request.params;
      if (!isValidStarknetAddress(launch)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid token address',
        });
        return;
      }

      const intervalMinutes = 5;
      let transformedData: any[] = [];

      try {
        console.log("candles launch", launch);
        const candles = await prisma.candlesticks.findMany({
          where: { token_address: launch, interval_minutes: intervalMinutes },
          orderBy: { timestamp: 'asc' },
          select: {
            open: true,
            close: true,
            high: true,
            low: true,
            timestamp: true,
          },
        });

        console.log("candles", candles);

        if (candles.length === 0) {

        } else {

          transformedData = candles.map((candle) => ({
            open: candle.open,
            close: candle.close,
            low: candle.low,
            high: candle.high,
            timestamp: candle.timestamp,
          }));
        }


      } catch (error) {
        console.error('Error generating candles:', error);
      }

      console.log("transformedData", transformedData);

      const response = {
        candles: transformedData,
      };

      reply.status(HTTPStatus.OK).send({
        data: response,
      });

    } catch (error) {
      console.error('Error deploying launch:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });




  // // @TODO fix
  // fastify.get<{
  //   Params: DeployLaunchParams;
  // }>('/deploy-launch/by/:owner_address/', async (request, reply) => {
  //   try {
  //     const { owner_address } = request.params;
  //     if (owner_address && !isValidStarknetAddress(owner_address)) {
  //       reply.status(HTTPStatus.BadRequest).send({
  //         code: HTTPStatus.BadRequest,
  //         message: 'Invalid user address',
  //       });
  //       return;
  //     }

  //     const deploys = await prisma.token_launch.findMany({
  //       where: { owner_address: owner_address },
  //       select: {
  //         memecoin_address: true,
  //         quote_token: true,
  //         price: true,
  //         total_supply: true,
  //         liquidity_raised: true,
  //         network: true,
  //         created_at: true,
  //       },
  //     });

  //     reply.status(HTTPStatus.OK).send({
  //       data: deploys,
  //     });
  //   } catch (error) {
  //     console.error('Error deploying launch by user:', error);
  //     reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
  //   }
  // });
  // fastify.get<{
  //   Params: DeployLaunchByUserParams;
  // }>("/deploy-launch/from/:user/", async (request, reply) => {
  //   try {
  //     const { owner_address } = request.params;
  //     if (!isValidStarknetAddress(owner_address)) {
  //       reply.status(HTTPStatus.BadRequest).send({
  //         code: HTTPStatus.BadRequest,
  //         message: "Invalid token address",
  //       });
  //       return;
  //     }

  //     const deploys = await prisma.token_launch.findMany({
  //       where: {  owner_address: owner_address },
  //       select: {
  //         memecoin_address: true,
  //         quote_token: true,
  //         price: true,
  //         total_supply: true,
  //         liquidity_raised: true,
  //         network: true,
  //         created_at: true,
  //       },
  //     });

  //     reply.status(HTTPStatus.OK).send({
  //       data: deploys,
  //     });
  //   } catch (error) {
  //     console.error("Error deploying launch by user:", error);
  //     reply
  //       .status(HTTPStatus.InternalServerError)
  //       .send({ message: "Internal server error." });
  //   }
  // });
}

export default deployLaunchRoute;
