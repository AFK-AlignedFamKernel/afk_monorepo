import type { FastifyInstance } from "fastify";
import buyCoinRoute from "./routes/indexer/buy-coin";
import deployLaunchRoute from "./routes/indexer/deploy-launch";
import deployTokenRoute from "./routes/indexer/deploy-token";
import graphRoute from "./routes/indexer/graph";

function declareRoutes(fastify: FastifyInstance) {
  fastify.register(buyCoinRoute);
  fastify.register(deployLaunchRoute);
  fastify.register(deployTokenRoute);
  fastify.register(graphRoute);
}

export default declareRoutes;
