import type { FastifyInstance, RouteOptions } from 'fastify';
import { HTTPStatus } from '../../../utils/http';
import { isValidStarknetAddress } from '../../../utils/starknet';
import { eq, and, or } from 'indexer-v2-db/node_modules/drizzle-orm';
import { db } from 'indexer-v2-db/dist';
import { contractState, epochState, userEpochState } from 'indexer-v2-db/dist/schema';
interface ScoreFactoryParams {
  sub_address: string;
}

interface ScoreFactoryParamsPerEpoch {
  sub_address: string;
  epoch_index: string;
}

async function subScoreFactoryServiceRoute(fastify: FastifyInstance, options: RouteOptions) {
  // Get all subs
  fastify.get('/score-factory/sub', async (request, reply) => {
    try {
      const subs = await db.select().from(contractState);

      reply.status(HTTPStatus.OK).send(subs);
    } catch (error) {
      console.error('Error fetching subs:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });

  // Get one sub by address
  fastify.get<{
    Params: ScoreFactoryParams;
  }>('/score-factory/sub/:sub_address', async (request, reply) => {
    try {
      const { sub_address } = request.params;
      if (!isValidStarknetAddress(sub_address)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid sub address',
        });
        return;
      }

      // // Get sub and epoch states with aggregation query

      const sub = await db
        .select()
        .from(contractState)
        .where(eq(contractState.contract_address, sub_address))
        .limit(1);

      console.log('sub', sub);

      const result = await db.query.contractState.findMany({
        where: eq(contractState.contract_address, sub_address),
        with: {
          epochs: true,
          // userProfiles: true,
        },
      });

      console.log('result', result);
      // // Get epoch states for this sub

      // const epochStates = await db
      //   .select({
      //     epoch_index: epochState.epoch_index,
      //     contract_address: epochState.contract_address,
      //     total_ai_score: epochState.total_ai_score,
      //     total_vote_score: epochState.total_vote_score,
      //     total_amount_deposit: epochState.total_amount_deposit,
      //     total_tip: epochState.total_tip,
      //     amount_claimed: epochState.amount_claimed,
      //     amount_vote: epochState.amount_vote,
      //     amount_algo: epochState.amount_algo,
      //     epoch_duration: epochState.epoch_duration,
      //     start_time: epochState.start_time,
      //     end_time: epochState.end_time,
      //   })
      //   .from(epochState)
      //   .where(eq(epochState.contract_address, sub_address))
      //   .orderBy(epochState.epoch_index);

      // console.log('epochStates', epochStates);

      // const userEpochStates = await db
      //   .select({
      //     nostr_id: userEpochState.nostr_id,
      //     epoch_index: userEpochState.epoch_index,
      //     contract_address: userEpochState.contract_address,
      //     total_tip: userEpochState.total_tip,
      //     total_ai_score: userEpochState.total_ai_score,
      //     total_vote_score: userEpochState.total_vote_score,
      //     amount_claimed: userEpochState.amount_claimed,
      //     created_at: userEpochState.created_at,
      //     updated_at: userEpochState.updated_at,
      //   })
      //   .from(userEpochState)
      //   .where(eq(userEpochState.contract_address, sub_address))
      //   .groupBy(userEpochState.epoch_index);

  
      if (sub.length > 0) {
        reply.status(HTTPStatus.OK).send({
          sub:sub[0],
          // epochs: epochStates
          epochs: result?.[0]?.epochs
        });
      } else {
        reply.status(HTTPStatus.NotFound).send();
      }
    } catch (error) {
      console.error('Error fetching sub:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });

  //   // Get one sub by address
  //   fastify.get<{
  //     Params: ScoreFactoryParams;
  //   }>('/score-factory/sub/basic/:sub_address', async (request, reply) => {
  //     try {
  //       const { sub_address } = request.params;
  //       if (!isValidStarknetAddress(sub_address)) {
  //         reply.status(HTTPStatus.BadRequest).send({
  //           code: HTTPStatus.BadRequest,
  //           message: 'Invalid sub address',
  //         });
  //         return;
  //       }
  
  //       const sub = await db
  //         .select({
  //           contract_address: contractState.contract_address,
  //         })
  //         .from(contractState)
  //         .where(eq(contractState.contract_address, sub_address))
  //         .limit(1);
  
  //       if (sub.length > 0) {
  //         reply.status(HTTPStatus.OK).send(sub[0]);
  //       } else {
  //         reply.status(HTTPStatus.NotFound).send();
  //       }
  //     } catch (error) {
  //       console.error('Error fetching sub:', error);
  //       reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
  //     }
  //   });

  // // Get all proposals for a sub
  // fastify.get<{
  //   Params: ScoreFactoryParams;
  // }>('/score-factory/sub/:sub_address/profile', async (request, reply) => {
  //   try {
  //     const { sub_address } = request.params;
  //     if (!isValidStarknetAddress(sub_address)) {
  //       reply.status(HTTPStatus.BadRequest).send({
  //         code: HTTPStatus.BadRequest,
  //         message: 'Invalid sub address',
  //       });
  //       return;
  //     }

  //     const usersProfile = await db
  //       .select({
  //         nostr_id: userEpochState.nostr_id,
  //         epoch_index: userEpochState.epoch_index,
  //         contract_address: userEpochState.contract_address,
  //         total_tip: userEpochState.total_tip,
  //         total_ai_score: userEpochState.total_ai_score,
  //         total_vote_score: userEpochState.total_vote_score,
  //         amount_claimed: userEpochState.amount_claimed,
  //         created_at: userEpochState.created_at,
  //         updated_at: userEpochState.updated_at,
  //       })
  //       .from(userEpochState)
  //       .where(eq(userEpochState.contract_address, sub_address));

  //     reply.status(HTTPStatus.OK).send(usersProfile);
  //   } catch (error) {
  //     console.error('Error fetching sub proposals', error);
  //     reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
  //   }
  // });

  // // Get all proposals for a sub by epoch
  // fastify.get<{
  //   Params: ScoreFactoryParamsPerEpoch;
  // }>('/score-factory/sub/:sub_address/:epoch_index', async (request, reply) => {
  //   try {
  //     const { sub_address, epoch_index } = request.params;
  //     if (!isValidStarknetAddress(sub_address)) {
  //       reply.status(HTTPStatus.BadRequest).send({
  //         code: HTTPStatus.BadRequest,
  //         message: 'Invalid sub address',
  //       });
  //       return;
  //     }

  //     const usersProfile = await db
  //       .select({
  //         nostr_id: userEpochState.nostr_id,
  //         epoch_index: userEpochState.epoch_index,
  //         contract_address: userEpochState.contract_address,
  //         total_tip: userEpochState.total_tip,
  //         total_ai_score: userEpochState.total_ai_score,
  //         total_vote_score: userEpochState.total_vote_score,
  //         amount_claimed: userEpochState.amount_claimed,
  //         created_at: userEpochState.created_at,
  //         updated_at: userEpochState.updated_at,
  //       })
  //       .from(userEpochState)
  //       .where(
  //         and(
  //           eq(userEpochState.contract_address, sub_address),
  //           eq(userEpochState.epoch_index, epoch_index)
  //         )
  //       );

  //     reply.status(HTTPStatus.OK).send(usersProfile);
  //   } catch (error) {
  //     console.error('Error fetching sub proposals', error);
  //     reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
  //   }
  // });
}

export default subScoreFactoryServiceRoute;
