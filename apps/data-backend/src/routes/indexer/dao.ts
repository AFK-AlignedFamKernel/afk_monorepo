import type { FastifyInstance, RouteOptions } from 'fastify';
import { HTTPStatus } from '../../utils/http';
import { db } from 'indexer-v2-db';
import { daoCreation, daoProposal } from 'indexer-v2-db/dist/schema';
import { isValidStarknetAddress } from '../../utils/starknet';
import { eq } from 'drizzle-orm';

interface DaoParams {
  dao_address: string;
}

async function daoServiceRoute(fastify: FastifyInstance, options: RouteOptions) {
  // Get tips by sender
  fastify.get('/daos', async (request, reply) => {
    try {
      const daos = await db.select().from(daoCreation).execute();

      reply.status(HTTPStatus.OK).send({
        data: daos,
      });
    } catch (error) {
      console.error('Error fetching daos:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });

  // Get tips by recipient
  fastify.get<{
    Params: DaoParams;
  }>('/daos/:dao_address/proposals/', async (request, reply) => {
    try {
      const { dao_address } = request.params;
      if (!isValidStarknetAddress(dao_address)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid dao address',
        });
        return;
      }

      const daoProposals = await db
        .select()
        .from(daoProposal)
        .where(eq(daoProposal.contractAddress, dao_address))
        .execute();

      reply.status(HTTPStatus.OK).send({
        data: daoProposals,
      });
    } catch (error) {
      console.error('Error fetching dao proposals', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });
}

export default daoServiceRoute;
