import { FastifyInstance } from 'fastify';
import {
  serveHLSManifest,
  serveHLSSegment,
  getStreamStatus,
  listStreams,
  healthCheck,
  startStream,
  startLocalStream,
  stopStream
} from './fastifyEndpoints';
import { cloudinaryLivestreamService } from './cloudinaryService';

/**
 * Register Fastify routes for livestream HTTP endpoints
 */
export async function registerLivestreamRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get('/livestream/health', healthCheck);

  // List active streams
  fastify.get('/livestream/active', listStreams);

  // Stream status
  fastify.get('/livestream/:streamId/status', getStreamStatus);

  // Start stream
  fastify.post('/livestream/:streamId/start', startStream);

  // Start local stream (for debugging)
  // fastify.post('/livestream/:streamId/start-local', startLocalStream);

  // Stop stream
  fastify.post('/livestream/:streamId/stop', stopStream);

  // Get Cloudinary playback URL
  fastify.get('/livestream/:streamId/playback', async (request, reply) => {
    const { streamId } = request.params as { streamId: string };
    try {
      const stream = await cloudinaryLivestreamService.getStream(streamId);
      if (!stream) {
        return reply.status(404).send({ error: 'Stream not found' });
      }
      return reply.send({
        streamId,
        playbackUrl: stream.playbackUrl,
        ingestUrl: stream.streamUrl,
        status: stream.status
      });
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to get stream' });
    }
  });

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
