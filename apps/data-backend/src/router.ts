import type { FastifyInstance } from "fastify";
import buyCoinRoute from "./routes/indexer/buy-coin";
import deployLaunchRoute from "./routes/indexer/deploy-launch";

function declareRoutes(fastify: FastifyInstance) {
  fastify.register(buyCoinRoute);
  fastify.register(deployLaunchRoute);
}

export default declareRoutes;
