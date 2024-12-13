import type { FastifyInstance } from 'fastify';
import dotenv from 'dotenv';
dotenv.config();
const stripe = require('stripe')(process.env.STRIPE_SERVER_API_KEY);

interface CreatePaymentIntent {
  currency: string;
  amount: number;
}

async function createPaymentIntent(fastify: FastifyInstance) {
  fastify.post<{ Body: CreatePaymentIntent }>(
    '/create-payment-intent',

    {
      schema: {
        body: {
          type: 'object',
          required: ['currency', 'amount'],
          properties: {
            currency: { type: 'string', pattern: '^\\+[1-9]\\d{1,14}$' },
            amount: { type: 'number' },
          },
        },
      },
    },

    async (request, reply) => {
      try {
        const { currency } = request.body;

        const paymentIntent = await stripe.paymentIntents.create({
          amount: 1000, // Example amount in smallest currency unit (cents)
          currency: currency,
          payment_method_types: ['card'],
        });

        reply.send({
          clientSecret: paymentIntent.client_secret,
        });

        return reply.code(200).send({ ok: true });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ message: 'Internal Server Error' });
      }
    },
  );
}

export default createPaymentIntent;
