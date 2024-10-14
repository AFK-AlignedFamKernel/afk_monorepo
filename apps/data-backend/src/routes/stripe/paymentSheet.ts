import type { FastifyInstance } from "fastify";
import { prisma } from "@prisma/client";
import dotenv from "dotenv"
dotenv.config()
const stripe = require('stripe')(process.env.STRIPE_SERVER_API_KEY);

interface CreatePaymentSheet {
  currency: string;
  amount: number;
}

async function paymentSheet(
  fastify: FastifyInstance,
) {
  fastify.post<{ Body: CreatePaymentSheet }>(
    "/payment-sheet",

    {
      schema: {
        body: {
          type: "object",
          required: ["currency", "amount"],
          properties: {
            currency: { type: "string", pattern: "^\\+[1-9]\\d{1,14}$" },
            amount: { type: "number" }
          },
        },
      },
    },

    async (request, reply) => {


      try {
        const { currency } = request.body;


        // Create a customer
        const customer = await stripe.customers.create();

        // Create an ephemeral key for the customer
        const ephemeralKey = await stripe.ephemeralKeys.create(
          { customer: customer.id },
          { apiVersion: '2022-11-15' } // Ensure to use the latest API version
        );


        const paymentIntent = await stripe.paymentIntents.create({
          amount: 1000, // Example amount in smallest currency unit (cents)
          currency: currency,
          payment_method_types: ['card'],
        });

        // reply.send({
        //   clientSecret: paymentIntent.client_secret,
        // });

        return reply.code(200).send({
          paymentIntent: paymentIntent.client_secret,
          ephemeralKey: ephemeralKey.secret,
          customer: customer.id,
        });

        // return reply.code(200).send({ ok: true });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ message: "Internal Server Error" });
      }
    }
  );
}

export default paymentSheet;
