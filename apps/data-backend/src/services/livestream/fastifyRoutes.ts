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

  // Debug endpoint to check active streams and their state
  fastify.get('/livestream/debug/streams', async (request, reply) => {
    try {
      const { activeStreams } = await import('./streamHandler');
      const streams = Array.from(activeStreams.entries()).map(([key, value]) => ({
        streamKey: key,
        userId: value.userId,
        startedAt: value.startedAt,
        viewers: value.viewers.size,
        hasFfmpegCommand: !!value.command,
        hasInputStream: !!value.inputStream,
        broadcasterSocketId: value.broadcasterSocketId,
        isInitialized: value.isInitialized,
        status: value.status
      }));
      
      return reply.send({
        count: streams.length,
        streams,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to get debug info' });
    }
  });

  // Test endpoint to verify WebSocket connection
  fastify.get('/livestream/test/websocket', async (request, reply) => {
    try {
      return reply.send({
        message: 'WebSocket test endpoint working',
        timestamp: new Date().toISOString(),
        note: 'This endpoint is working, but WebSocket connections happen via Socket.IO, not HTTP'
      });
    } catch (error) {
      return reply.status(500).send({ error: 'Test endpoint failed' });
    }
  });

  // Test endpoint to send a test video chunk via WebSocket
  fastify.post('/livestream/test/send-chunk/:streamId', async (request, reply) => {
    try {
      const { streamId } = request.params as { streamId: string };
      
      // Import the active streams to check if the stream exists
      const { activeStreams } = await import('./streamHandler');
      const stream = activeStreams.get(streamId);
      
      if (!stream) {
        return reply.status(404).send({ error: 'Stream not found' });
      }
      
      // Create a test video chunk (1KB of random data)
      const testChunk = Buffer.alloc(1024);
      for (let i = 0; i < testChunk.length; i++) {
        testChunk[i] = Math.floor(Math.random() * 256);
      }
      
      // Simulate receiving stream data
      const { handleStreamData } = await import('./streamHandler');
      
      // Create a mock socket object for testing
      const mockSocket = {
        id: 'test-socket',
        to: (room: string) => ({
          emit: (event: string, data: any) => {
            console.log(`Test: Emitting ${event} to ${room}:`, data);
          }
        })
      } as any;
      
      // Call handleStreamData with test data
      handleStreamData(mockSocket, {
        streamKey: streamId,
        chunk: testChunk
      });
      
      return reply.send({
        message: 'Test chunk sent successfully',
        streamId,
        chunkSize: testChunk.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to send test chunk' });
    }
  });

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
