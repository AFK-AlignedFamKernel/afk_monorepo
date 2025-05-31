import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';
import { UserJwtPayload } from '../types';

export default fp(async function (fastify: FastifyInstance) {
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('No token provided');
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret) as UserJwtPayload;

      // Add user to request
      request.user = decoded;
    } catch (err) {
      request.user = null;
      reply.code(401).send({ message: 'Unauthorized' });
    }
  });

  // JWT helpers: Moved this from index.ts to this file.
  fastify.decorate('jwt', {
    sign: (payload: object, options?: jwt.SignOptions) => {
      return jwt.sign(payload, config.jwt.secret, options);
    },
    verify: (token: string) => {
      return jwt.verify(token, config.jwt.secret) as UserJwtPayload;
    },
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    jwt: {
      sign: (payload: object, options?: jwt.SignOptions) => string;
      verify: (token: string) => UserJwtPayload;
    };
  }
}
