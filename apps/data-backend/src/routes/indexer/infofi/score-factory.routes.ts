import type { FastifyInstance, RouteOptions } from 'fastify';
import { HTTPStatus } from '../../../utils/http';
import { isValidStarknetAddress } from '../../../utils/starknet';
import { eq , and, or} from 'drizzle-orm';
import { db } from 'indexer-v2-db/dist';
import { contractState, userEpochState } from 'indexer-v2-db/dist/schema';
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

      const sub = await db
        .select()
        .from(contractState)
        .where(eq(contractState.contract_address, sub_address))
        .limit(1);

      if (sub.length > 0) {
        reply.status(HTTPStatus.OK).send(sub[0]);
      } else {
        reply.status(HTTPStatus.NotFound).send();
      }
    } catch (error) {
      console.error('Error fetching sub:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });

  // Get all proposals for a sub
  fastify.get<{
    Params: ScoreFactoryParams;
  }>('/score-factory/sub/:sub_address/profile', async (request, reply) => {
    try {
      const { sub_address } = request.params;
      if (!isValidStarknetAddress(sub_address)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid sub address',
        });
        return;
      }

      const usersProfile = await db
        .select()
        .from(userEpochState)
        .where(eq(userEpochState.contract_address, sub_address));

      reply.status(HTTPStatus.OK).send(usersProfile);
    } catch (error) {
      console.error('Error fetching sub proposals', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });

  // Get all proposals for a sub
  fastify.get<{
    Params: ScoreFactoryParamsPerEpoch;
  }>('/score-factory/sub/:sub_address/:epoch_index', async (request, reply) => {
    try {
      const { sub_address, epoch_index } = request.params;
      if (!isValidStarknetAddress(sub_address)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid sub address',
        });
        return;
      }

      const usersProfile = await db
        .select()
        .from(userEpochState)
        .where(and(
          eq(userEpochState.contract_address, sub_address),
          eq(userEpochState.epoch_index, epoch_index)
        ));

      reply.status(HTTPStatus.OK).send(usersProfile);
    } catch (error) {
      console.error('Error fetching sub proposals', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });
}

export default subScoreFactoryServiceRoute;
