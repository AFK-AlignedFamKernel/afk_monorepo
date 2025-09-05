import { FastifyInstance } from 'fastify';
import {
  serveHLSManifest,
  serveHLSSegment,
  getStreamStatus,
  listActiveStreams,
  healthCheck
} from './httpEndpoints';

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

  // HLS segment files - using a single catch-all route for all .ts files
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

  console.log('✅ Livestream HTTP routes registered successfully');
  console.log('📺 Available endpoints:');
  console.log('   GET /livestream/health - Health check');
  console.log('   GET /livestream/active - List active streams');
  console.log('   GET /livestream/:streamId/status - Stream status');
  console.log('   GET /livestream/:streamId/stream.m3u8 - HLS manifest');
  console.log('   GET /livestream/:streamId/:filename - HLS segments (.ts files)');
}
