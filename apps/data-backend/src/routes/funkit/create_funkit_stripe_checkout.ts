import type { FastifyInstance, RouteOptions } from "fastify";
import {
  FUNKIT_STRIPE_SOURCE_CURRENCY,
  SOURCE_OF_FUND_KEY,
  TOKEN_INFO,
} from "../../constants/funkit";
import { generateClientMetadata } from "../../utils/funkit";

interface InitCheckoutBody {
  quoteId: string;
  paymentTokenAmount: number;
  estSubtotalUsd: number;
}

const FUNKIT_API_KEY = process.env.FUNKIT_API_KEY || "";

async function createFunkitStripeCheckout(
  fastify: FastifyInstance,
  _options: RouteOptions
): Promise<void> {
  fastify.post<{ Body: InitCheckoutBody }>(
    "/create_funkit_stripe_checkout",
    async (request, reply) => {
      const { quoteId, paymentTokenAmount, estSubtotalUsd } =
        request.body as InitCheckoutBody;
      if (!quoteId) {
        return reply.status(400).send({ message: "quoteId is required." });
      }
      if (!paymentTokenAmount) {
        return reply
          .status(400)
          .send({ message: "paymentTokenAmount is required." });
      }
      if (!estSubtotalUsd) {
        return reply
          .status(400)
          .send({ message: "estSubtotalUsd is required." });
      }
      try {
        const sourceAsset = TOKEN_INFO.STARKNET_USDC;
        const { initializeCheckout, createStripeBuySession } = await import(
          "@funkit/api-base"
        );
        const depositAddress = await initializeCheckout({
          userOp: null,
          quoteId,
          sourceOfFund: SOURCE_OF_FUND_KEY,
          clientMetadata: generateClientMetadata({
            pickedSourceAsset: sourceAsset,
            estDollarValue: estSubtotalUsd,
          }),
          apiKey: FUNKIT_API_KEY,
        });
        if (!depositAddress) {
          return reply
            .status(500)
            .send({ message: "Failed to start a funkit checkout." });
        }
        // 2 - Generate stripe session
        const stripeSession = await createStripeBuySession({
          apiKey: FUNKIT_API_KEY,
          sourceCurrency: FUNKIT_STRIPE_SOURCE_CURRENCY,
          destinationAmount: paymentTokenAmount,
          destinationCurrency: sourceAsset.symbol,
          destinationNetwork: sourceAsset.network,
          walletAddress: depositAddress,
          isSandbox: false,
        });
        if (
          !stripeSession ||
          !stripeSession.id ||
          !stripeSession.redirect_url
        ) {
          return reply
            .status(500)
            .send({ message: "Failed to start a stripe checkout session." });
        }
        return reply.send({
          stripeCheckoutId: stripeSession.id,
          stripeRedirectUrl: stripeSession.redirect_url,
          funkitDepositAddress: depositAddress,
        });
      } catch (error: any) {
        console.error("Failed to start a checkout:", error);
        return reply
          .status(500)
          .send({ message: "Failed to start a checkout." });
      }
    }
  );
}

export default createFunkitStripeCheckout;
