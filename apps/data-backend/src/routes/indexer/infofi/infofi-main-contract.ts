import type { FastifyInstance, RouteOptions } from 'fastify';
import prisma from 'indexer-prisma';
import { HTTPStatus } from '../../../utils/http';
import { isValidStarknetAddress } from '../../../utils/starknet';

interface EpochStateParams {
  epoch_index: string;
}

interface TipUserParams {
  nostr_address: string;
}

interface StateUserPerEpochParams {
  nostr_address: string;
  epoch_index: string;
}

async function mainInfoFiRoute(fastify: FastifyInstance, options: RouteOptions) {

  fastify.get<{
  }>('/main-sub/all-users', async (request, reply) => {
    try {
    
      const allUsers = await prisma.profile_data.findMany({
    
        select: {
          nostr_id: true,
          total_ai_score: true,
          total_tip:true,
          total_vote_score: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: allUsers,
      });
    } catch (error) {
      console.error('Error InfoFi Main Contract all users:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });



  fastify.get<{
    Params: EpochStateParams;
  }>('/main-sub/epoch-state/:epoch_index', async (request, reply) => {
    try {
      const { epoch_index } = request.params;
      if (!isValidStarknetAddress(epoch_index)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid token address',
        });
        return;
      }

      const epochState = await prisma.epoch_data.findFirst({
        where: {
          epoch_index: epoch_index,
        },
        select: {
          epoch_index: true,
          start_duration: true,
          end_duration: true,
          epoch_duration: true,

        },
      });

      reply.status(HTTPStatus.OK).send({
        data: epochState,
      });
    } catch (error) {
      console.error('Error deploying launch:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });

  fastify.get<{
    Params: TipUserParams;
  }>('/main-sub/tip-user/:nostr_address', async (request, reply) => {
    try {
      const { nostr_address } = request.params;
      if (!isValidStarknetAddress(nostr_address)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid token address',
        });
        return;
      }

      const tipUser = await prisma.profile_data.findFirst({
        where: {
            nostr_id: nostr_address,
        },
        select: {
          nostr_id: true,
          total_ai_score: true,
          total_tip:true,
          total_vote_score: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: tipUser,
      });
    } catch (error) {
      console.error('Error InfoFi Main Contract tip user:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });


  fastify.get<{
    Params: TipUserParams;
  }>('/main-sub/profile-data/:nostr_address', async (request, reply) => {
    try {
      const { nostr_address } = request.params;
      if (!isValidStarknetAddress(nostr_address)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid token address',
        });
        return;
      }

      const profileData = await prisma.profile_data.findFirst({
        where: {
            nostr_id: nostr_address,
        },
        select: {
          nostr_id: true,
          total_ai_score: true,
          total_tip:true,
          total_vote_score: true,
        },
      });

      const statesPerEpoch = await prisma.profile_data_per_epoch.findMany({
        where: {
          nostr_id: nostr_address,
        },
        select: {
          epoch_index: true,
          total_ai_score: true,
          total_tip:true,
          total_vote_score: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: {
          profile:profileData,
          state_per_epoch:statesPerEpoch,
        },
      });
    } catch (error) {
      console.error('Error InfoFi get profile data:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });


  fastify.get<{
    Params: StateUserPerEpochParams;
  }>('/main-sub/state-user-per-epoch/:nostr_address/:epoch_index', async (request, reply) => {
    try {
      const { nostr_address, epoch_index } = request.params;
      if (!isValidStarknetAddress(nostr_address)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid token address',
        });
        return;
      }

      if(!epoch_index) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid epoch index',
        });
        return;
      }

      const profileData = await prisma.profile_data.findFirst({
        where: {
            nostr_id: nostr_address,
        },
        select: {
          nostr_id: true,
          total_ai_score: true,
          total_tip:true,
          total_vote_score: true,
        },
      });

      const statesPerEpoch = await prisma.profile_data_per_epoch.findMany({
        where: {
          nostr_id: nostr_address,
          epoch_index: Number(epoch_index),
        },
        select: {
          epoch_index: true,
          total_ai_score: true,
          total_tip:true,
          total_vote_score: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: {
          profile:profileData,
          state_per_epoch:statesPerEpoch,
        },
      });
    } catch (error) {
      console.error('Error InfoFi get state user per epoch:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });



  fastify.get('/main-sub/epoch-state', async (request, reply) => {
    try {
      const epochState = await prisma.epoch_data.findMany({
        select: {
          epoch_index: true,
          start_duration: true,
          end_duration: true,
          epoch_duration: true,
          amount_claimed:true,
          amount_vote:true, 
          total_ai_score:true,
          total_vote_score:true,
          total_amount_deposit:true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: epochState,
      });
    } catch (error) {
      console.error('Error InfoFi get epoch state:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });

  fastify.get<{
    Params: EpochStateParams;
  }>('/main-sub/epoch-state/:epoch_index', async (request, reply) => {
    try {
      const { epoch_index } = request.params;
      if (!isValidStarknetAddress(epoch_index)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid token address',
        });
        return;
      }
      const epochState = await prisma.epoch_data.findFirst({
        where: {
          epoch_index: epoch_index,
        },
        select: {
          epoch_index: true,
          start_duration: true,
          end_duration: true,
          epoch_duration: true,
          amount_claimed:true,
          amount_vote:true, 
          total_ai_score:true,
          total_vote_score:true,
          total_amount_deposit:true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: epochState,
      });
    } catch (error) {
      console.error('Error InfoFi get epoch state:', error);
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

export default mainInfoFiRoute;
