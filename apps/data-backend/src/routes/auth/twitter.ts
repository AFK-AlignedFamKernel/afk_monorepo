import { FastifyPluginAsync } from 'fastify';
import { getTwitterClient } from '../../services/twitter-client';

const twitterRoutes: FastifyPluginAsync = async (fastify) => {
  // Step 1: Start OAuth flow
  fastify.get('/twitter/auth/login', async (request, reply) => {
    return reply.redirect('/twitter/auth/login');
  });

  // Step 2: Handle OAuth callback
  fastify.get('/twitter/auth/callback', async (request, reply) => {
    const { token, tokenSecret } = await fastify.twitterOAuth.getAccessTokenFromAuthorizationCodeFlow(request);
    // Save tokens in session or database
    request.session.set('twitterTokens', { token, tokenSecret });
    reply.send({ success: true, message: 'Connected to Twitter!' });
  });

  // Step 3: Create a post
  fastify.post('/twitter/post', async (request, reply) => {
    const { tweetContent } = request.body;
    const tokens = request.session.get('twitterTokens');
    if (!tokens) {
      return reply.status(401).send({ success: false, message: 'User not authenticated' });
    }

    try {
      const client = getTwitterClient(tokens.token, tokens.tokenSecret);
      const tweet = await client.v2.tweet(tweetContent);
      reply.send({ success: true, tweet });
    } catch (error) {
      reply.status(500).send({ success: false, error: error.message });
    }
  });
};

export default twitterRoutes;
