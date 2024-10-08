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
// import getOtp from "./routes/otp/getOtp";
// import verifyOtp from "./routes/otp/verifyOtp";
// import type { Account } from 'starknet'
// import { ServiceContext } from 'twilio/lib/rest/verify/v2/service'

function declareRoutes(
  fastify: FastifyInstance
  // deployer: Account,
  // twilio_services: ServiceContext
) {
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
  // fastify.register(getOtp, twilio_services?.verifications);
  // fastify.register(verifyOtp, deployer, twilio_services?.verificationChecks);
  // fastify.register(verifyOtp, [deployer, twilio_services?.verificationChecks]);
}

export default declareRoutes;
