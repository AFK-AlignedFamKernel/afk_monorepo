import type { FastifyInstance, RouteOptions } from "fastify";
import { HTTPStatus } from "../../utils/http";

async function tokensMetadataRoute(fastify: FastifyInstance, options: RouteOptions) {
  fastify.get("/token-metadata", async (request, reply) => {
    try {
      const response = await fetch("https://unrug.top/api/data/1");
      const data = await response.json();

      const tokensMetadata = data.chart_data;

      reply.status(HTTPStatus.OK).send({
        data: tokensMetadata
      });
    } catch (error) {
      console.error("Error fetching tokens metadata:", error);
      reply.status(HTTPStatus.InternalServerError).send({ message: "Internal server error." });
    }
  });
}

export default tokensMetadataRoute;
