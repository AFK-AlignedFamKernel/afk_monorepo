import type { FastifyInstance } from "fastify";

import buyCoinRoute from "./routes/indexer/buy-coin";
import deployLaunchRoute from "./routes/indexer/deploy-launch";
import deployTokenRoute from "./routes/indexer/deploy-token";
import graphRoute from "./routes/indexer/graph";
import holdingsRoute from "./routes/indexer/holdings";
import tokenStatsRoute from "./routes/indexer/token_stats";
import transactionsRoute from "./routes/indexer/transactions";
import allTransactionsRoute from "./routes/indexer/all-transactions";
import createFunkitStripeCheckout from "./routes/funkit/create_funkit_stripe_checkout";
import getFunkitStripeCheckoutQuote from "./routes/funkit/get_funkit_stripe_checkout_quote";
import getFunkitStripeCheckoutStatus from "./routes/funkit/get_funkit_stripe_checkout_status";

function declareRoutes(fastify: FastifyInstance) {
  fastify.register(buyCoinRoute);
  fastify.register(deployLaunchRoute);
  fastify.register(deployTokenRoute);
  fastify.register(graphRoute);
  fastify.register(holdingsRoute);
  fastify.register(tokenStatsRoute);
  fastify.register(transactionsRoute);
  fastify.register(allTransactionsRoute);
  fastify.register(createFunkitStripeCheckout);
  fastify.register(getFunkitStripeCheckoutQuote);
  fastify.register(getFunkitStripeCheckoutStatus);
}

export default declareRoutes;
