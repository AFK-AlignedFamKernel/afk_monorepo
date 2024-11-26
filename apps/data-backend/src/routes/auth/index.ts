import { FastifyInstance } from "fastify";
import { AuthService } from "../../services/auth/auth.service";
import {
  LoginInput,
  RefreshTokenInput,
} from "../../validations/auth.validation";
import { SignatureService } from "../../services/auth/signature.service";

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(fastify.prisma, fastify);
  const signatureService = new SignatureService();

  fastify.post<{ Body: LoginInput }>("/auth", async (request, reply) => {
    try {
      const { userAddress, loginType, signature } = request.body;

      // Check if `signature` exists and is not empty.
      if (!signature) {
        return reply.code(400).send({ message: "Signature Required" });
      }

      // Check if `userAddress` exists and is not empty
      if (!userAddress) {
        return reply.code(400).send({ message: "userAddress is required" });
      }

      // Check if `loginType` exists and is not empty
      if (!loginType) {
        return reply.code(400).send({ message: "loginType is required" });
      }

      //Todo: This doesnt work well for now always returning false.
      //handling Signature verification client side for now.

      // const sig = await signatureService.verifySignature({
      //   accountAddress: userAddress,
      //   signature: signature as any,
      // });

      // console.log("sig is valid", sig);

      // if (!sig) {
      //   return reply.code(400).send({ message: "Invalid Signature" });
      // }

      const result = await authService.loginOrCreateUser(
        userAddress,
        loginType
      );
      return { success: true, data: result };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  });

  fastify.post<{ Body: RefreshTokenInput }>(
    "/refresh-token",
    async (request, reply) => {
      try {
        const { refreshToken } = request.body;
        // Check if `refreshToken` exists and is not empty
        if (!refreshToken) {
          return reply.code(400).send({ message: "Refresh Token is required" });
        }
        const result = await authService.refreshAccessToken(refreshToken);
        return { success: true, data: result };
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(401).send({ message: error.message });
        }
        return reply.code(401).send({ message: "Invalid refresh token" });
      }
    }
  );

  fastify.get(
    "/me",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const user = await authService.getUserProfile(request.user.id);
        return { success: true, data: { user } };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: "Internal server error" });
      }
    }
  );
}
