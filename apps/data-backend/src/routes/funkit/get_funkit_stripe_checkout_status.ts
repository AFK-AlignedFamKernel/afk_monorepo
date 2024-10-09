import type { FastifyInstance, RouteOptions } from "fastify";

const FUNKIT_API_KEY = process.env.FUNKIT_API_KEY || "";

async function getFunkitStripeCheckoutStatus(
  fastify: FastifyInstance,
  _options: RouteOptions
) {
  fastify.get(
    "/get-funkit-stripe-checkout-status",

    async (request, reply) => {
      const { funkitDepositAddress } = request.query as {
        funkitDepositAddress: string;
      };

      if (!funkitDepositAddress) {
        return reply
          .status(400)
          .send({ message: "funkitDepositAddress is required." });
      }

      try {
        const { getCheckoutByDepositAddress } = await import(
          "@funkit/api-base"
        );
        const checkoutItem = await getCheckoutByDepositAddress({
          depositAddress: funkitDepositAddress as `0x${string}`,
          apiKey: FUNKIT_API_KEY,
        });
        if (!checkoutItem || !checkoutItem?.depositAddr) {
          return reply
            .status(500)
            .send({ message: "Failed to get a funkit checkout." });
        }
        return reply.send({
          state: checkoutItem.state,
        });
      } catch (error: any) {
        if (error?.message?.includes("InvalidParameterError")) {
          return reply
            .status(500)
            .send({ message: "Failed to get a funkit checkout." });
        }
        return reply.status(500).send({ message: "Internal server error" });
      }
    }
  );
}

export default getFunkitStripeCheckoutStatus;
