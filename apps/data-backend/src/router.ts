import type { FastifyInstance } from 'fastify';

import buyCoinRoute from './routes/indexer/buy-coin';
import deployLaunchRoute from './routes/indexer/deploy-launch';
import deployTokenRoute from './routes/indexer/deploy-token';
import graphRoute from './routes/indexer/graph';
import holdingsRoute from './routes/indexer/holdings';
import tokenStatsRoute from './routes/indexer/token_stats';
import transactionsRoute from './routes/indexer/transactions';
import allTransactionsRoute from './routes/indexer/all-transactions';
// import createFunkitStripeCheckout from './routes/funkit/create_funkit_stripe_checkout';
// import getFunkitStripeCheckoutQuote from './routes/funkit/get_funkit_stripe_checkout_quote';
// import getFunkitStripeCheckoutStatus from './routes/funkit/get_funkit_stripe_checkout_status';
// import createPaymentIntent from './routes/stripe/createPaymentIntent';
// import paymentSheet from './routes/stripe/paymentSheet';
import { authRoutes } from './routes/auth';
import nameserviceRoutes from './routes/indexer/nameservice/nameservice';
import unrugRoutes from './routes/indexer/unruggable';
import twitterRoutes from './routes/auth/twitter';
import routesShareUserRoutes from './routes/indexer/share-user';
import tipServiceRoute from './routes/indexer/tip';
import uploadFile from './routes/upload/upload-file';
import mainInfoFiRoute from './routes/indexer/infofi/infofi-main-contract';
import shopRoutes from './routes/shop';
import socialIdentityRoutes from './routes/socialIdentity';
import contentCreatorRoutes from './routes/content-creator';
import profileRoutes from './routes/profile';
import analyticsRoutes from './routes/analytics';
// import daoServiceRoute from './routes/indexer/dao';
// import subScoreFactoryRoute from './routes/indexer/infofi/score-factory.routes';
// import getOtp from "./routes/otp/getOtp";
// import verifyOtp from "./routes/otp/verifyOtp";
// import type { Account } from 'starknet'
// import { ServiceContext } from 'twilio/lib/rest/verify/v2/service'

function declareRoutes(
  fastify: FastifyInstance,
  // deployer: Account,
  // twilio_services: ServiceContext
) {
  // fastify.register(require('@fastify/multipart'));

  fastify.register(buyCoinRoute);
  fastify.register(deployLaunchRoute);
  fastify.register(deployTokenRoute);
  fastify.register(graphRoute);
  fastify.register(holdingsRoute);
  fastify.register(tokenStatsRoute);
  fastify.register(transactionsRoute);
  fastify.register(allTransactionsRoute);
 
  // fastify.register(authRoutes);
  // fastify.register(twitterRoutes);

  fastify.register(unrugRoutes);
  fastify.register(nameserviceRoutes);
  fastify.register(tipServiceRoute);
  fastify.register(routesShareUserRoutes);
  fastify.register(uploadFile);
  fastify.register(mainInfoFiRoute);
  fastify.register(shopRoutes)
  fastify.register(profileRoutes);

  // Register social identity routes
  fastify.register(socialIdentityRoutes);
  fastify.register(contentCreatorRoutes);
  fastify.register(analyticsRoutes);

  // fastify.register(profileRoutes, { prefix: '/api' });

  // fastify.register(daoServiceRoute);
  // fastify.register(subScoreFactoryRoute);
  // fastify.register(getOtp, twilio_services?.verifications);
   // fastify.register(createFunkitStripeCheckout);
  // fastify.register(getFunkitStripeCheckoutQuote);
  // fastify.register(getFunkitStripeCheckoutStatus);
  // fastify.register(createPaymentIntent);
  // fastify.register(paymentSheet);
  // fastify.register(verifyOtp, deployer, twilio_services?.verificationChecks);
  // fastify.register(verifyOtp, [deployer, twilio_services?.verificationChecks]);
}

export default declareRoutes;
