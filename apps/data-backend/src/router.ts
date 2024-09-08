import type { FastifyInstance } from "fastify";
import buyCoinRoute from "./routes/indexer/buy-coin";
import deployLaunchRoute from "./routes/indexer/deploy-launch";
import deployTokenRoute from "./routes/indexer/deploy-token";

function declareRoutes(fastify: FastifyInstance) {
  fastify.register(buyCoinRoute);
  fastify.register(deployLaunchRoute);
  fastify.register(deployTokenRoute);
}

export default declareRoutes;
