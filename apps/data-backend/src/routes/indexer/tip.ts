import type { FastifyInstance, RouteOptions } from 'fastify';
import prisma from 'indexer-prisma';
import { HTTPStatus } from '../../utils/http';
import { isValidStarknetAddress } from '../../utils/starknet';
import { isValidNostrAddress } from '../../utils/nostr';

interface TipParams {
  deposit_id?: string;
  sender?: string;
  nostr_recipient?: string;
}

async function tipServiceRoute(fastify: FastifyInstance, options: RouteOptions) {
  // Get tips by sender
  fastify.get<{
    Params: TipParams;
  }>('/tips/sender/:sender', async (request, reply) => {
    try {
      const { sender } = request.params;
      if (!isValidStarknetAddress(sender)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid sender address',
        });
        return;
      }

      const tips = await prisma.tip_deposit.findMany({
        where: { sender },
        select: {
          transaction_hash: true,
          deposit_id: true,
          sender: true,
          nostr_recipient: true,
          starknet_recipient: true,
          token_address: true,
          amount: true,
          gas_amount: true,
          is_claimed: true,
          is_cancelled: true,
          created_at: true,
          updated_at: true,
        },
      });

      reply.status(HTTPStatus.OK).send({
        data: tips,
      });
    } catch (error) {
      console.error('Error fetching tips by sender:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });

  // Get tips by recipient
  fastify.get<{
    Params: TipParams;
  }>('/tips/recipient/:nostr_recipient', async (request, reply) => {
    try {
      const { nostr_recipient } = request.params;
      if (!isValidNostrAddress(nostr_recipient)) {
        reply.status(HTTPStatus.BadRequest).send({
          code: HTTPStatus.BadRequest,
          message: 'Invalid recipient address',
        });
        return;
      }

      const tipsDeposit = await prisma.tip_deposit.findMany({
        where: {
          nostr_recipient,
          is_cancelled: false,
        },
        select: {
          transaction_hash: true,
          deposit_id: true,
          sender: true,
          nostr_recipient: true,
          starknet_recipient: true,
          token_address: true,
          amount: true,
          gas_amount: true,
          gas_token_address: true,
          is_claimed: true,
          is_cancelled: true,
          created_at: true,
          updated_at: true,
        },
      });

      const tipsTransfer = (
        await prisma.tip_transfer.findMany({
          where: { nostr_recipient },
          select: {
            transaction_hash: true,
            sender: true,
            nostr_recipient: true,
            starknet_recipient: true,
            token_address: true,
            amount: true,
            created_at: true,
            updated_at: true,
          },
        })
      ).map((transfer) => ({
        ...transfer,
        is_claimed: true,
      }));

      reply.status(HTTPStatus.OK).send({
        data: [...tipsDeposit, ...tipsTransfer],
      });
    } catch (error) {
      console.error('Error fetching tips by recipient:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });
}

export default tipServiceRoute;
