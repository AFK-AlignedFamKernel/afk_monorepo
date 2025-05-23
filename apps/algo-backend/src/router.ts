import type { FastifyInstance } from 'fastify';


import { authRoutes } from './routes/auth';
import twitterRoutes from './routes/auth/twitter';
import uploadFile from './routes/upload/upload-file';
import trendRoutes from './routes/trend/analytics';
function declareRoutes(
  fastify: FastifyInstance,
  // deployer: Account,
  // twilio_services: ServiceContext
) {
  // fastify.register(require('@fastify/multipart'));
  // fastify.register(createFunkitStripeCheckout);
  // fastify.register(getFunkitStripeCheckoutQuote);
  // fastify.register(getFunkitStripeCheckoutStatus);
  fastify.register(authRoutes);
  fastify.register(twitterRoutes);
  fastify.register(uploadFile);
  fastify.register(trendRoutes);

  // fastify.register(getOtp, twilio_services?.verifications);
  // fastify.register(verifyOtp, deployer, twilio_services?.verificationChecks);
  // fastify.register(verifyOtp, [deployer, twilio_services?.verificationChecks]);
}

export default declareRoutes;
