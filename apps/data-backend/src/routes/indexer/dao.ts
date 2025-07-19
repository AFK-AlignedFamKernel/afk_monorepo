import type { FastifyInstance, RouteOptions } from 'fastify';
import { HTTPStatus } from '../../utils/http';
import { isValidStarknetAddress } from '../../utils/starknet';
import { db } from 'indexer-v2-db/dist';
import { daoCreation, daoProposal } from 'indexer-v2-db/dist/schema';
import { eq } from 'drizzle-orm';
// import {eq} from "drizzle-orm"
interface DaoParams {
  dao_address: string;
}

async function daoServiceRoute(fastify: FastifyInstance, options: RouteOptions) {
  // Get all daos
  fastify.get('/daos', async (request, reply) => {
    try {
      const daos = await db.select().from(daoCreation);

      reply.status(HTTPStatus.OK).send(daos);
    } catch (error) {
      console.error('Error fetching daos:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });

  // Get one dao by address
  fastify.get<{
    Params: DaoParams;
  }>('/daos/:dao_address', async (request, reply) => {
    try {
      const { dao_address } = request.params;
      if (!isValidStarknetAddress(dao_address)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid dao address',
        });
        return;
      }

      const dao = await db
        .select()
        .from(daoCreation)
        .where(eq(daoCreation.contractAddress, dao_address))
        .limit(1);

      if (dao.length > 0) {
        reply.status(HTTPStatus.OK).send(dao[0]);
      } else {
        reply.status(HTTPStatus.NotFound).send();
      }
    } catch (error) {
      console.error('Error fetching dao:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });

  // // Get all proposals for a dao
  // fastify.get<{
  //   Params: DaoParams;
  // }>('/daos/:dao_address/proposals/', async (request, reply) => {
  //   try {
  //     const { dao_address } = request.params;
  //     if (!isValidStarknetAddress(dao_address)) {
  //       reply.status(HTTPStatus.BadRequest).send({
  //         code: HTTPStatus.BadRequest,
  //         message: 'Invalid dao address',
  //       });
  //       return;
  //     }

  //     const daoProposals = await db
  //       .select()
  //       .from(daoProposal)
  //       .where(eq(daoProposal.contractAddress, dao_address));

  //     reply.status(HTTPStatus.OK).send(daoProposals);
  //   } catch (error) {
  //     console.error('Error fetching dao proposals', error);
  //     reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
  //   }
  // });
}

export default daoServiceRoute;
