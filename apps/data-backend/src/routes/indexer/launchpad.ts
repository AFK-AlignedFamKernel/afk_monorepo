import type { FastifyInstance, RouteOptions } from 'fastify';
import prisma from 'indexer-prisma';
import { HTTPStatus } from '../../utils/http';
import { isValidStarknetAddress } from '../../utils/starknet';
import { queries } from 'indexer-v2-db';

const { getAllLaunchpads, getLaunchpadByAddress, getAllTokens } = queries;
interface DeployLaunchParams {
  launch: string;
}

async function launchpadRoute(fastify: FastifyInstance, options: RouteOptions) {
  fastify.get('/launchpad/deploy-launch', async (request, reply) => {
    try {
      const { offset = 0, limit = 20 } = request.query as { offset?: number; limit?: number };

      const launches = await getAllLaunchpads({
        offset,
        limit,
      });


      reply.status(HTTPStatus.OK).send({
        data: launches,
        pagination: {
          total: launches.length,
          offset,
          limit,
        },
      });
    } catch (error) {
      console.error('Error deploying launch:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });

  fastify.get('/launchpad/deploy-token', async (request, reply) => {
    try {
      const { offset = 0, limit = 20 } = request.query as { offset?: number; limit?: number };

      const tokens = await getAllTokens({
        offset,
        limit,
      });


      reply.status(HTTPStatus.OK).send({
        data: tokens,
        pagination: {
          total: tokens.length,
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
  }>('/launchpad/deploy-launch/:launch', async (request, reply) => {
    try {
      const { launch } = request.params;
      if (!isValidStarknetAddress(launch)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid token address',
        });
        return;
      }

      // Use Drizzle ORM 

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
  }>('/launchpad/deploy-launch/stats/:launch', async (request, reply) => {
    try {
      const { launch } = request.params;
      if (!isValidStarknetAddress(launch)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid token address',
        });
        return;
      }

      const launchStats = await prisma.token_launch.findFirst({
        where: {
          memecoin_address: launch,
        },
        select: {
          memecoin_address: true,
          quote_token: true,
          price: true,
          total_supply: true,
          liquidity_raised: true,
          network: true,
          created_at: true,
          threshold_liquidity: true,
          bonding_type: true,
          total_token_holded: true,
          block_timestamp: true,
          is_liquidity_added: true,
          market_cap: true,
          name: true,
          symbol: true,
          url: true,
          description: true,
          twitter: true,
          telegram: true,
          github: true,
          website: true,
          initial_pool_supply_dex: true,
          ipfs_hash: true,
          creator_fee_raised: true,
          creator_fee_percent: true,
          image_url: true,
          current_supply: true,
          token_deploy: {
            select: {
              name: true,
              symbol: true,
            },
          },
          token_metadata: {
            select: {
              url: true,
            },
          },
        },
      });


      const holdings = await prisma.shares_token_user.findMany({
        where: { token_address: launch, },
        select: {
          owner: true,
          token_address: true,
          amount_owned: true,
          amount_claimed: true,
          // updated_at: true,
          // created_at: true,
        },
      });

      const allTransactions = await prisma.token_transactions.findMany({
        where: {
          memecoin_address: launch,
        },
        select: {
          memecoin_address: true,
          owner_address: true,
          amount: true,
          price: true,
          coin_received: true,
          liquidity_raised: true,
          protocol_fee: true,
          total_supply: true,
          network: true,
          transaction_type: true,
          created_at: true,
          quote_amount: true,
          transaction_hash: true,
          time_stamp: true,
          creator_fee_amount: true,
        },
      });


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
  }>('/launchpad/deploy-launch/candles/:launch', async (request, reply) => {
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

export default launchpadRoute;
