import { FastifyRequest, FastifyReply } from 'fastify';
import * as fs from 'fs';
import path from 'path';
import { activeStreams } from './streamHandler';

/**
 * Fastify HTTP endpoints for serving HLS streams and stream information
 */

// Base directory for stream files
const STREAMS_BASE_DIR = path.join(process.cwd(), 'public', 'livestreams');

/**
 * Serve HLS manifest file (stream.m3u8)
 * GET /livestream/:streamId/stream.m3u8
 */
export async function serveHLSManifest(
  request: FastifyRequest<{ Params: { streamId: string } }>,
  reply: FastifyReply
) {
  try {
    const { streamId } = request.params;
    
    if (!streamId) {
      return reply.status(400).send({ error: 'Stream ID is required' });
    }

    const manifestPath = path.join(STREAMS_BASE_DIR, streamId, 'stream.m3u8');
    
    // Check if manifest file exists
    if (!fs.existsSync(manifestPath)) {
      console.log(`Manifest not found for stream: ${streamId}`);
      return reply.status(404).send({ error: 'Stream not found or not started' });
    }

    // Check if stream is active
    const isActive = activeStreams.has(streamId);
    
    // Set appropriate headers for HLS
    reply.header('Content-Type', 'application/vnd.apple.mpegurl');
    reply.header('Cache-Control', 'no-cache');
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, HEAD');
    reply.header('Access-Control-Allow-Headers', '*');

    // Read and serve the manifest file
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    
    // If stream is not active, add a message to the manifest
    if (!isActive) {
      console.log(`Stream ${streamId} is not active, serving static manifest`);
    }

    console.log(`Serving HLS manifest for stream: ${streamId}`);
    return reply.send(manifestContent);
    
  } catch (error) {
    console.error('Error serving HLS manifest:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * Serve HLS segment files (.ts files)
 * GET /livestream/:streamId/segment_:segmentNumber.ts
 */
export async function serveHLSSegment(
  request: FastifyRequest<{ Params: { streamId: string; segmentFile: string } }>,
  reply: FastifyReply
) {
  try {
    const { streamId, segmentFile } = request.params;
    
    if (!streamId || !segmentFile) {
      return reply.status(400).send({ error: 'Stream ID and segment file are required' });
    }

    const segmentPath = path.join(STREAMS_BASE_DIR, streamId, segmentFile);
    
    // Check if segment file exists
    if (!fs.existsSync(segmentPath)) {
      console.log(`Segment not found: ${segmentPath}`);
      return reply.status(404).send({ error: 'Segment not found' });
    }

    // Set appropriate headers for video segments
    reply.header('Content-Type', 'video/mp2t');
    reply.header('Cache-Control', 'public, max-age=3600');
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, HEAD');
    reply.header('Access-Control-Allow-Headers', '*');

    // Stream the segment file
    const stream = fs.createReadStream(segmentPath);
    return reply.send(stream);
    
  } catch (error) {
    console.error('Error serving HLS segment:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * Get stream status and information
 * GET /livestream/:streamId/status
 */
export async function getStreamStatus(
  request: FastifyRequest<{ Params: { streamId: string } }>,
  reply: FastifyReply
) {
  try {
    const { streamId } = request.params;
    
    if (!streamId) {
      return reply.status(400).send({ error: 'Stream ID is required' });
    }

    const streamData = activeStreams.get(streamId);
    const manifestPath = path.join(STREAMS_BASE_DIR, streamId, 'stream.m3u8');
    
    const status = {
      streamId,
      isActive: !!streamData,
      hasManifest: fs.existsSync(manifestPath),
      viewerCount: streamData ? streamData.viewers.size : 0,
      startedAt: streamData ? streamData.startedAt : null,
      userId: streamData ? streamData.userId : null
    };

    console.log(`Stream status for ${streamId}:`, status);
    return reply.send(status);
    
  } catch (error) {
    console.error('Error getting stream status:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * List all active streams
 * GET /livestream/active
 */
export async function listActiveStreams(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const activeStreamsList = Array.from(activeStreams.entries()).map(([streamKey, streamData]) => ({
      streamId: streamKey,
      userId: streamData.userId,
      viewerCount: streamData.viewers.size,
      startedAt: streamData.startedAt,
      isActive: true
    }));

    console.log(`Active streams: ${activeStreamsList.length}`);
    return reply.send({
      count: activeStreamsList.length,
      streams: activeStreamsList
    });
    
  } catch (error) {
    console.error('Error listing active streams:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * Health check endpoint
 * GET /livestream/health
 */
export async function healthCheck(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const streamsDir = STREAMS_BASE_DIR;
    const dirExists = fs.existsSync(streamsDir);
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      streamsDirectory: {
        exists: dirExists,
        path: streamsDir
      },
      activeStreams: activeStreams.size,
      memoryUsage: process.memoryUsage()
    };

    return reply.send(health);
    
  } catch (error) {
    console.error('Health check error:', error);
    return reply.status(500).send({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
