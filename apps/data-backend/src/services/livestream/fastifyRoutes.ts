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

  // Ingest endpoint for RTMP/WebRTC input
  fastify.get('/livestream/:streamId/ingest', async (request, reply) => {
    const { streamId } = request.params as { streamId: string };
    try {
      // Check if stream exists and is active
      const stream = await cloudinaryLivestreamService.getStream(streamId);
      if (!stream) {
        return reply.status(404).send({ error: 'Stream not found' });
      }
      
      // Return ingest information
      return reply.send({
        streamId,
        ingestUrl: stream.streamUrl,
        status: stream.status,
        message: 'Stream ingest endpoint ready',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to get ingest information' });
    }
  });

  // HLS manifest file
  fastify.get('/livestream/:streamId/stream.m3u8', serveHLSManifest);

  // HLS segment files - single catch-all route for all .ts files
  fastify.get('/livestream/:streamId/:filename', async (request, reply) => {
    const { filename } = request.params as { streamId: string; filename: string };
    
    // Only handle .ts files
    if (!filename.endsWith('.ts')) {
      return reply.status(404).send({ error: 'Not found' });
    }
    
    // Set the segmentFile parameter for the handler
    (request.params as any).segmentFile = filename;
    return serveHLSSegment(request as any, reply);
  });

  console.log('Livestream HTTP routes registered');
}
