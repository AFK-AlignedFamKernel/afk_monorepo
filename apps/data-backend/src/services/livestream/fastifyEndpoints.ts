import { FastifyRequest, FastifyReply } from 'fastify';
import * as fs from 'fs';
import path from 'path';
import { activeStreams, initializeStreamForHttp } from './streamHandler';
import { cloudinaryLivestreamService } from './cloudinaryService';

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

    // Check if stream is active or initialized
    const streamData = activeStreams.get(streamId);
    const isActive = !!streamData;
    const isInitialized = streamData?.isInitialized;

    // Check if stream is initialized but not broadcasting
    if (streamData?.isInitialized && !streamData.command) {
      console.log(`Stream ${streamId} is initialized but waiting for broadcaster`);
      // Return a basic HLS manifest that indicates waiting state
      const waitingManifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:2
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:EVENT
#EXTINF:2.0,
#EXT-X-ENDLIST`;
      
      reply.header('Content-Type', 'application/vnd.apple.mpegurl');
      reply.header('Cache-Control', 'no-cache');
      reply.header('Access-Control-Allow-Origin', '*');
      reply.header('Access-Control-Allow-Methods', 'GET, HEAD');
      reply.header('Access-Control-Allow-Headers', '*');
      
      return reply.send(waitingManifest);
    }
    
    // Set appropriate headers for HLS
    reply.header('Content-Type', 'application/vnd.apple.mpegurl');
    reply.header('Cache-Control', 'no-cache');
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, HEAD');
    reply.header('Access-Control-Allow-Headers', '*');

    // Read and serve the manifest file
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    
    // If stream is not active but initialized, it's waiting for broadcaster
    if (!isActive) {
      console.log(`Stream ${streamId} is not active, serving static manifest`);
    } else if (isInitialized && !streamData.command) {
      console.log(`Stream ${streamId} is initialized but waiting for broadcaster`);
    } else {
      console.log(`Stream ${streamId} is active and broadcasting`);
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
 * Get stream status and information from both Cloudinary and local FFmpeg
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

    console.log(`📊 Getting stream status for: ${streamId}`);

    // Import local stream handler to check FFmpeg streams
    const { activeStreams } = await import('./streamHandler');
    const fs = require('fs');
    const path = require('path');

    // Check local FFmpeg stream status
    const localStreamData = activeStreams.get(streamId);
    const streamsBaseDir = path.join(process.cwd(), 'public', 'livestreams');
    const manifestPath = path.join(streamsBaseDir, streamId, 'stream.m3u8');
    const streamDir = path.join(streamsBaseDir, streamId);

    const localStatus = {
      isActive: !!localStreamData,
      manifestExists: fs.existsSync(manifestPath),
      streamDirExists: fs.existsSync(streamDir),
      streamData: localStreamData ? {
        userId: localStreamData.userId,
        startedAt: localStreamData.startedAt,
        viewers: localStreamData.viewers.size,
        hasFfmpegCommand: !!localStreamData.command,
        hasInputStream: !!localStreamData.inputStream,
        broadcasterSocketId: localStreamData.broadcasterSocketId
      } : null,
      files: fs.existsSync(streamDir) ? fs.readdirSync(streamDir) : [],
      manifestContent: fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : null
    };

    console.log(`📊 Local FFmpeg stream status for ${streamId}:`, localStatus);

    // Get status from Cloudinary service
    let cloudinaryStatus = null;
    try {
      cloudinaryStatus = await cloudinaryLivestreamService.getStreamStatus(streamId);
      console.log(`📊 Cloudinary stream status for ${streamId}:`, cloudinaryStatus);
    } catch (cloudinaryError) {
      console.log(`⚠️ Cloudinary status check failed for ${streamId}:`, cloudinaryError);
    }

    const combinedStatus = {
      streamId,
      local: localStatus,
      cloudinary: cloudinaryStatus,
      overall: {
        isActive: localStatus.isActive,
        hasManifest: localStatus.manifestExists,
        hasStreamDir: localStatus.streamDirExists,
        // Check if stream actually has video content (not just an empty manifest)
        hasVideoContent: localStatus.manifestExists && 
          localStatus.manifestContent && 
          !localStatus.manifestContent.includes('#EXT-X-ENDLIST') &&
          localStatus.files && 
          localStatus.files.some(file => file.endsWith('.ts'))
      }
    };
    
    console.log(`✅ Combined stream status for ${streamId}:`, combinedStatus);
    return reply.send(combinedStatus);
    
  } catch (error) {
    console.error('❌ Error getting stream status:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * List all active streams from Cloudinary
 * GET /livestream/active
 */
export async function listStreams(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    console.log('📋 Listing active Cloudinary streams');

    // Get active streams from Cloudinary service
    const activeStreamsList = await cloudinaryLivestreamService.listStreams();
    
    const streams = activeStreamsList.map(stream => ({
      streamId: stream.streamId,
      userId: stream.userId,
      status: stream.status,
      startedAt: stream.createdAt,
      isActive: stream.status === 'active',
      playbackUrl: stream.playbackUrl,
      ingestUrl: stream.streamUrl
    }));

    console.log(`✅ Found ${streams.length} active Cloudinary streams`);
    return reply.send({
      count: streams.length,
      streams: streams
    });
    
  } catch (error) {
    console.error('❌ Error listing active Cloudinary streams:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * Start a new stream using Cloudinary
 * POST /livestream/:streamId/start
 */
export async function startStream(
  request: FastifyRequest<{ Params: { streamId: string }; Body: { userId?: string; action: string; timestamp: number; title?: string; description?: string } }>,
  reply: FastifyReply
) {
  try {
    const { streamId } = request.params;
    const { userId, action, timestamp, title, description } = request.body;
    
    if (!streamId) {
      return reply.status(400).send({ error: 'Stream ID is required' });
    }

    if (action !== 'start') {
      return reply.status(400).send({ error: 'Invalid action. Use "start"' });
    }

    console.log(`🎬 Starting Cloudinary stream: ${streamId} for user: ${userId || 'anonymous'}`);

    // Check if stream already exists in Cloudinary
    const existingStream = await cloudinaryLivestreamService.getStream(streamId);
    if (existingStream) {
      console.log(`✅ Stream ${streamId} already exists in Cloudinary`);
      
      // Mark as active
      const updatedStream = await cloudinaryLivestreamService.startStream(streamId);

      // Initialize the stream handler for this stream
      await initializeStreamForHttp(streamId, userId || 'anonymous');
      
      return reply.send({
        status: 'already_exists',
        streamId,
        message: 'Stream already exists and is now active',
        playbackUrl: updatedStream?.playbackUrl,
        ingestUrl: updatedStream?.streamUrl,
        timestamp: new Date().toISOString()
      });
    }

    // Create new stream in Cloudinary
    const stream = await cloudinaryLivestreamService.createStream({
      streamId,
      userId: userId || 'anonymous',
      title: title || `Live Stream ${streamId}`,
      description: description || 'Live stream created via API',
      tags: ['livestream', 'live', 'nostr']
    });

    // Mark as active
    await cloudinaryLivestreamService.startStream(streamId);

    // Initialize the stream handler for this stream
    await initializeStreamForHttp(streamId, userId || 'anonymous');

    console.log(`✅ Cloudinary stream ${streamId} created and started successfully`);
    
    return reply.send({
      status: 'created_and_started',
      streamId,
      message: 'Stream created and started successfully in Cloudinary',
      playbackUrl: stream.playbackUrl,
      ingestUrl: stream.streamUrl,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error starting Cloudinary stream:', error);
    return reply.status(500).send({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Stop a stream using Cloudinary
 * POST /livestream/:streamId/stop
 */
export async function stopStream(
  request: FastifyRequest<{ Params: { streamId: string }; Body: { userId?: string; action: string; timestamp: number } }>,
  reply: FastifyReply
) {
  try {
    const { streamId } = request.params;
    const { userId, action, timestamp } = request.body;
    
    if (!streamId) {
      return reply.status(400).send({ error: 'Stream ID is required' });
    }

    if (action !== 'stop') {
      return reply.status(400).send({ error: 'Invalid action. Use "stop"' });
    }

    console.log(`⏹️ Stopping Cloudinary stream: ${streamId} for user: ${userId || 'anonymous'}`);

    // Stop the stream in Cloudinary
    const result = await cloudinaryLivestreamService.stopStream(streamId);
    
    if (result) {
      console.log(`✅ Cloudinary stream ${streamId} stopped successfully`);
      
      return reply.send({
        status: 'stopped',
        streamId,
        message: 'Stream stopped successfully in Cloudinary',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`⚠️ Stream ${streamId} was not active or already stopped`);
      
      return reply.send({
        status: 'already_stopped',
        streamId,
        message: 'Stream was not active or already stopped',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Error stopping Cloudinary stream:', error);
    return reply.status(500).send({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Manually start a local FFmpeg stream (for debugging)
 * POST /livestream/:streamId/start-local
 */
export async function startLocalStream(
  request: FastifyRequest<{ Params: { streamId: string }; Body: { userId?: string; action: string; timestamp: number } }>,
  reply: FastifyReply
) {
  try {
    const { streamId } = request.params;
    const { userId, action, timestamp } = request.body;
    
    if (!streamId) {
      return reply.status(400).send({ error: 'Stream ID is required' });
    }

    if (action !== 'start') {
      return reply.status(400).send({ error: 'Invalid action. Use "start"' });
    }

    console.log(`🎬 Manually starting local FFmpeg stream: ${streamId} for user: ${userId || 'anonymous'}`);

    // Import local stream handler and stream service
    const { activeStreams } = await import('./streamHandler');
    const { setupStream } = await import('./streamService');
    const fs = require('fs');
    const path = require('path');

    // Check if stream already exists
    if (activeStreams.has(streamId)) {
      console.log(`✅ Stream ${streamId} already exists locally`);
      
      return reply.send({
        status: 'already_exists',
        streamId,
        message: 'Stream already exists locally',
        timestamp: new Date().toISOString()
      });
    }

    try {
      // Try to set up a real FFmpeg stream
      console.log('🎬 Attempting to set up real FFmpeg stream...');
      const { ffmpegCommand, outputPath, inputStream } = await setupStream({
        streamKey: streamId,
        userId: userId || 'anonymous'
      });

      // Add to active streams with real FFmpeg
      const streamData = {
        userId: userId || 'anonymous',
        streamKey: streamId,
        command: ffmpegCommand,
        inputStream: inputStream,
        viewers: new Set(),
        broadcasterSocketId: 'manual',
        startedAt: new Date(),
      };
      
      activeStreams.set(streamId, streamData);
      console.log('✅ Real FFmpeg stream added to active streams');

      return reply.send({
        status: 'ffmpeg_started',
        streamId,
        message: 'Real FFmpeg stream created and started successfully',
        outputPath,
        hasInputStream: !!inputStream,
        hasFfmpegCommand: !!ffmpegCommand,
        timestamp: new Date().toISOString()
      });

    } catch (ffmpegError) {
      console.log('⚠️ FFmpeg setup failed, falling back to basic stream:', ffmpegError);
      
      // Create basic stream structure manually as fallback
      const streamPath = path.join(process.cwd(), 'public', 'livestreams', streamId);
      const m3u8Path = path.join(streamPath, 'stream.m3u8');
      
      // Ensure directory exists
      if (!fs.existsSync(streamPath)) {
        fs.mkdirSync(streamPath, { recursive: true });
        console.log('✅ Created stream directory:', streamPath);
      }
      
      // Create basic HLS manifest
      const basicManifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:2
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:2.0,
#EXT-X-ENDLIST`;
      
      fs.writeFileSync(m3u8Path, basicManifest);
      console.log('✅ Created basic HLS manifest:', m3u8Path);
      
      // Add to active streams
      const streamData = {
        userId: userId || 'anonymous',
        streamKey: streamId,
        command: null,
        inputStream: null,
        viewers: new Set(),
        broadcasterSocketId: 'manual',
        startedAt: new Date(),
      };
      
      activeStreams.set(streamId, streamData);
      console.log('✅ Added stream to active streams (fallback mode)');

      return reply.send({
        status: 'fallback_created',
        streamId,
        message: 'Basic stream created (FFmpeg failed)',
        streamPath,
        m3u8Path,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Error starting local stream:', error);
    return reply.status(500).send({ 
      error: 'Internal server error',
      message: error.message 
    });
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
    
    // Import activeStreams to get current state
    const { activeStreams } = await import('./streamHandler');
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      streamsDirectory: {
        exists: dirExists,
        path: streamsDir
      },
      activeStreams: {
        count: activeStreams.size,
        streams: Array.from(activeStreams.entries()).map(([key, value]) => ({
          streamKey: key,
          userId: value.userId,
          startedAt: value.startedAt,
          viewers: value.viewers.size,
          hasFfmpegCommand: !!value.command,
          hasInputStream: !!value.inputStream
        }))
      },
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
