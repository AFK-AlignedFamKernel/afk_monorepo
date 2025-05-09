import type { FastifyInstance, RouteOptions } from 'fastify';
import prisma from 'indexer-prisma';
import { HTTPStatus } from '../../utils/http';
import { isValidStarknetAddress } from '../../utils/starknet';

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
      const launches = await prisma.token_launch.findMany({
        select: {
          memecoin_address: true,
          quote_token: true,
          price: true,
          total_supply: true,
          liquidity_raised: true,
          network: true,
          created_at: true,
          threshold_liquidity:true,
          bonding_type:true,
          total_token_holded:true,
          block_timestamp:true,
          is_liquidity_added:true,
          name:true,
          symbol:true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: launches,
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

      const launchPool = await prisma.token_launch.findFirst({
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
          threshold_liquidity:true,
          bonding_type:true,
          total_token_holded:true,
          block_timestamp:true,
          is_liquidity_added:true,

        },
      });

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
          threshold_liquidity:true,
          bonding_type:true,
          total_token_holded:true,
          block_timestamp:true,
          is_liquidity_added:true,
        },
      });

    
      const holdings = await prisma.shares_token_user.findMany({
        where: { token_address: launch, },
        select: {
          owner: true,
          token_address: true,
          amount_owned: true,
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
          total_supply: true,
          network: true,
          transaction_type: true,
          created_at: true,
          quote_amount: true,
          time_stamp: true,
        },
      });


      const response = {
        launch: launchStats,
        holdings,
        holders: holdings,
        transactions: allTransactions,
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
