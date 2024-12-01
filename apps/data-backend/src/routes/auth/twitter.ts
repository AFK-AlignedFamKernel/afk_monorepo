import { FastifyPluginAsync } from "fastify";
import { TwitterService } from "../../services/socials/twitter.service";
import { ConnectTwitterInput } from "../../validations/auth.validation";

const twitterRoutes: FastifyPluginAsync = async (fastify) => {
  const twitterService = new TwitterService(fastify.prisma, fastify);
  // Step 1: Start OAuth flow
  fastify.get("/twitter/auth/login", async (request, reply) => {
    try {
      const data = await twitterService.getAuthorizationLink();
      reply.send({ success: true, data });
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(401).send({ message: error.message });
      }
    }
  });

  fastify.post<{ Body: ConnectTwitterInput }>(
    "/twitter/connect-account",
    {
      schema: {
        body: {
          type: "object",
          required: ["code", "codeVerifier", "userId"],
          properties: {
            code: { type: "string" },
            codeVerifier: { type: "string" },
            userId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { code, codeVerifier, userId } = request.body;
      try {
        const resp = await twitterService.connectAccount({
          code,
          codeVerifier,
          userId,
        });
        reply.send({ success: true, data: resp });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(401).send({ message: error.message });
        }
      }
    }
  );

  fastify.post<{ Body: { userId: string } }>(
    "/twitter/disconnect",
    {
      schema: {
        body: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { userId } = request.body;
        const data = await twitterService.disconnectAccount(userId);
        reply.send({ success: true, data });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(401).send({ message: error.message });
        }
      }
    }
  );

  // // Step 2: Handle OAuth callback
  // fastify.get('/twitter/auth/callback', async (request, reply) => {
  //   const { token, tokenSecret } = await fastify.twitterOAuth.getAccessTokenFromAuthorizationCodeFlow(request);
  //   // Save tokens in session or database
  //   request.session.set('twitterTokens', { token, tokenSecret });
  //   reply.send({ success: true, message: 'Connected to Twitter!' });
  // });

  // // Step 3: Create a post
  // fastify.post('/twitter/post', async (request, reply) => {
  //   const { tweetContent } = request.body;
  //   const tokens = request.session.get('twitterTokens');
  //   if (!tokens) {
  //     return reply.status(401).send({ success: false, message: 'User not authenticated' });
  //   }

  //   try {
  //     const client = getTwitterClient(tokens?.token, tokens?.tokenSecret);
  //     const tweet = await client.v2.tweet(tweetContent);
  //     reply.send({ success: true, tweet });
  //   } catch (error) {
  //     reply.status(500).send({ success: false, error: error.message });
  //   }
  // });
};

export default twitterRoutes;
