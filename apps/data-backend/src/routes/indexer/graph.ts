import type { FastifyInstance, RouteOptions } from 'fastify';
import prisma from 'indexer-prisma';
import { HTTPStatus } from '../../utils/http';
import { isValidStarknetAddress } from '../../utils/starknet';

interface GraphParams {
  tokenAddress: string;
}

async function graphRoute(fastify: FastifyInstance, options: RouteOptions) {
  fastify.get<{
    Params: GraphParams;
    Querystring: { interval?: string };
  }>('/get-candles/:tokenAddress', async (request, reply) => {
    const { tokenAddress } = request.params;
    const { interval } = request.query;
    if (!isValidStarknetAddress(tokenAddress)) {
      reply.status(HTTPStatus.BadRequest).send({
        code: HTTPStatus.BadRequest,
        message: 'Invalid token address',
      });
      return;
    }

    const intervalMinutes = interval ? parseInt(interval, 10) : 5;

    try {
      const candles = await prisma.candlesticks.findMany({
        where: { token_address: tokenAddress, interval_minutes: intervalMinutes },
        orderBy: { timestamp: 'asc' },
        select: {
          open: true,
          close: true,
          high: true,
          low: true,
          timestamp: true,
        },
      });

      if (candles.length === 0) {
        return reply.status(HTTPStatus.NotFound).send({
          error: 'No candlesticks found for this token address.',
        });
      }

      const transformedData = candles.map((candle) => ({
        open: candle.open,
        close: candle.close,
        high: candle.high,
        low: candle.low,
        time: Math.floor(candle.timestamp.getTime() / 1000),
      }));

      reply.status(HTTPStatus.OK).send({ data: transformedData });
    } catch (error) {
      console.error('Error generating candles:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });
  fastify.get<{
    Params: GraphParams;
  }>('/candles/:tokenAddress', async (request, reply) => {
    const { tokenAddress } = request.params;
    if (!isValidStarknetAddress(tokenAddress)) {
      reply.status(HTTPStatus.BadRequest).send({
        code: HTTPStatus.BadRequest,
        message: 'Invalid token address',
      });
      return;
    }

    try {
      const transactions = await prisma.token_transactions.findMany({
        where: { memecoin_address: tokenAddress },
        orderBy: { block_timestamp: 'asc' },
        select: {
          price: true,
          block_timestamp: true,
          transaction_type: true,
        },
      });

      if (transactions.length === 0) {
        return reply.status(HTTPStatus.NotFound).send({
          error: 'No transactions found for this token address.',
        });
      }
      // Hourly candles
      const candles = transactions.reduce((acc, { block_timestamp, price }) => {
        if (!block_timestamp || !price) return acc;

        const hour = block_timestamp.getHours();
        if (!acc[hour]) {
          acc[hour] = { open: price, high: price, low: price, close: price };
        } else {
          acc[hour].high = Math.max(acc[hour].high, Number(price));
          acc[hour].low = Math.min(acc[hour].low, Number(price));
          acc[hour].close = price;
        }
        return acc;
      }, {});

      reply.status(HTTPStatus.OK).send(candles);
    } catch (error) {
      console.error('Error generating candles:', error);
      reply.status(HTTPStatus.InternalServerError).send({ message: 'Internal server error.' });
    }
  });
}

export default graphRoute;
