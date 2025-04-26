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
  fastify.get<{}>('/main-sub/overall-state', async (request, reply) => {
    try {
      const contractState = await prisma.contractState.findMany({
        select: {
          total_ai_score: true,
          total_tips: true,
          total_amount_deposit: true,
          total_vote_score: true,
          current_epoch_index: true,
          current_epoch_end: true,
          current_epoch_start: true,
          current_epoch_duration: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: contractState,
      });
    } catch (error) {
      console.error('Error InfoFi Main Contract all users:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });

  fastify.get<{}>('/main-sub/all-users', async (request, reply) => {
    try {
      const allUsers = await prisma.userProfile.findMany({
        select: {
          nostr_id: true,
          total_ai_score: true,
          total_tip: true,
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
    Params: TipUserParams;
  }>('/main-sub/all-tip-user/', async (request, reply) => {
    try {
      const tipUser = await prisma.userProfile.findMany({
        select: {
          nostr_id: true,
          total_ai_score: true,
          total_tip: true,
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

      const tipUser = await prisma.userProfile.findMany({
        where: {
          nostr_id: nostr_address,
        },
        select: {
          nostr_id: true,
          total_ai_score: true,
          total_tip: true,
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

      const profileData = await prisma.userProfile.findFirst({
        where: {
          nostr_id: nostr_address,
        },
        select: {
          nostr_id: true,
          total_ai_score: true,
          total_tip: true,
          total_vote_score: true,
        },
      });

      const statesPerEpoch = await prisma.userEpochState.findMany({
        where: {
          nostr_id: nostr_address,
        },
        select: {
          epoch_index: true,
          total_ai_score: true,
          total_tip: true,
          total_vote_score: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: {
          profile: profileData,
          state_per_epoch: statesPerEpoch,
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

      if (!epoch_index) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid epoch index',
        });
        return;
      }

      const profileData = await prisma.userProfile.findFirst({
        where: {
          nostr_id: nostr_address,
        },
        select: {
          nostr_id: true,
          total_ai_score: true,
          total_tip: true,
          total_vote_score: true,
        },
      });

      const statesPerEpoch = await prisma.userEpochState.findMany({
        where: {
          nostr_id: nostr_address,
          epoch_index: epoch_index,
        },
        select: {
          epoch_index: true,
          total_ai_score: true,
          total_tip: true,
          total_vote_score: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: {
          profile: profileData,
          state_per_epoch: statesPerEpoch,
        },
      });
    } catch (error) {
      console.error('Error InfoFi get state user per epoch:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });

  fastify.get('/main-sub/epoch-state', async (request, reply) => {
    try {
      const epochState = await prisma.epochState.findMany({
        select: {
          epoch_index: true,
          start_time: true,
          end_time: true,
          epoch_duration: true,
          amount_claimed: true,
          amount_vote: true,
          total_ai_score: true,
          total_vote_score: true,
          total_amount_deposit: true,
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

      const epochState = await prisma.epochState.findFirst({
        where: {
          epoch_index: epoch_index,
        },
        select: {
          epoch_index: true,
          start_time: true,
          end_time: true,
          epoch_duration: true,
          amount_claimed: true,
          amount_vote: true,
          total_ai_score: true,
          total_vote_score: true,
          total_amount_deposit: true,
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

  // New optimized endpoint for fetching all data
  fastify.get<{}>('/main-sub/all-data', async (request, reply) => {
    try {
      const contractState = await prisma.contractState.findMany({
        include: {
          epochs: {
            select: {
              epoch_index: true,
              start_time: true,
              end_time: true,
              epoch_duration: true,
              total_ai_score: true,
              total_vote_score: true,
              total_amount_deposit: true,
              total_tip: true,
              amount_claimed: true,
              amount_vote: true,
              amount_algo: true,
              user_epoch_states: {
                select: {
                  nostr_id: true,
                  total_ai_score: true,
                  total_vote_score: true,
                  total_tip: true,
                  amount_claimed: true,
                },
              },
            },
          },
          user_profiles: {
            select: {
              nostr_id: true,
              starknet_address: true,
              total_ai_score: true,
              total_vote_score: true,
              total_tip: true,
              amount_claimed: true,
              is_add_by_admin: true,
              epoch_states: {
                select: {
                  epoch_index: true,
                  total_ai_score: true,
                  total_vote_score: true,
                  total_tip: true,
                  amount_claimed: true,
                },
              },
            },
          },
        },
      });

      // Calculate aggregations
      const aggregations = await prisma.contractState.aggregate({
        _sum: {
          total_ai_score: true,
          total_vote_score: true,
          total_tips: true,
          total_amount_deposit: true,
          total_to_claimed: true,
        },
        _avg: {
          percentage_algo_distribution: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: {
          contract_states: contractState,
          aggregations: {
            total_ai_score: aggregations._sum.total_ai_score,
            total_vote_score: aggregations._sum.total_vote_score,
            total_tips: aggregations._sum.total_tips,
            total_amount_deposit: aggregations._sum.total_amount_deposit,
            total_to_claimed: aggregations._sum.total_to_claimed,
            average_algo_distribution: aggregations._avg.percentage_algo_distribution,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching all data:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });
}

export default mainInfoFiRoute;
