import { FastifyInstance } from 'fastify';
import {
  serveHLSManifest,
  serveHLSSegment,
  getStreamStatus,
  listActiveStreams,
  healthCheck
} from './fastifyEndpoints';

/**
 * Register Fastify routes for livestream HTTP endpoints
 */
export async function registerLivestreamRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get('/livestream/health', healthCheck);

  // List active streams
  fastify.get('/livestream/active', listActiveStreams);

  // Stream status
  fastify.get('/livestream/:streamId/status', getStreamStatus);

  // HLS manifest file
  fastify.get('/livestream/:streamId/stream.m3u8', serveHLSManifest);

  // HLS segment files - using regex patterns
  fastify.get('/livestream/:streamId/segment_:segmentNumber.ts', serveHLSSegment);

  // Alternative segment pattern for some HLS implementations
  fastify.get('/livestream/:streamId/segment_:segmentNumber([0-9]+).ts', serveHLSSegment);

  // Catch-all for other segment patterns
  fastify.get('/livestream/:streamId/*.ts', async (request, reply) => {
    const segmentFile = (request.params as any)['*'];
    (request.params as any).segmentFile = segmentFile;
    return serveHLSSegment(request as any, reply);
  });

  console.log('Livestream HTTP routes registered');
}
