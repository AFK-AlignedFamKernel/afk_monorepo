import type { FastifyInstance, RouteOptions } from "fastify";
const { prisma } = require("indexer-prisma");
import { HTTPStatus } from "../../utils/http";
import { isValidStarknetAddress } from "../../utils/starknet";

interface TransactionParams {
  tokenAddress: string;
  userId: string;
}

async function transactionsRoute(
  fastify: FastifyInstance,
  options: RouteOptions
) {
  fastify.get<{
    Params: TransactionParams;
  }>("/my-share/:tokenAddress/:userId", async (request, reply) => {
    const { tokenAddress, userId } = request.params;
    if (!isValidStarknetAddress(tokenAddress)) {
      reply.status(HTTPStatus.BadRequest).send({
        code: HTTPStatus.BadRequest,
        message: "Invalid token address",
      });
      return;
    }

    try {
      const transactions = await prisma.token_transactions.findMany({
        where: {
          memecoin_address: tokenAddress,
          owner_address: userId,
        },
        select: {
          transaction_type: true,
          amount: true,
        },
      });

      if (transactions.length === 0) {
        return reply.status(HTTPStatus.NotFound).send({
          error: "No transactions found for this user and token address.",
        });
      }

      const result = transactions.reduce(
        (acc, cur) => {
          acc.total += parseFloat(cur.amount || 0);
          if (cur.transaction_type === "buy") {
            acc.buy += parseFloat(cur.amount || 0);
          } else if (cur.transaction_type === "sell") {
            acc.sell += parseFloat(cur.amount || 0);
          }
          return acc;
        },
        { total: 0, buy: 0, sell: 0 }
      );

      reply.status(HTTPStatus.OK).send(result);
    } catch (error) {
      console.error("Failed to retrieve user transactions:", error);
      reply.status(HTTPStatus.InternalServerError).send({
        error: "Internal Server Error while fetching user transactions.",
      });
    }
  });
}

export default transactionsRoute;
