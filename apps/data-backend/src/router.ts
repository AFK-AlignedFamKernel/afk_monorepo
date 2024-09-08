import type { FastifyInstance } from "fastify";
import buyCoinRoute from "./routes/indexer/buy-coin";

function declareRoutes(fastify: FastifyInstance) {
  fastify.register(buyCoinRoute);
}

export default declareRoutes;
