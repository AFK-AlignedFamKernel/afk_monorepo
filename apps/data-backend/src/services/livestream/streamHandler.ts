import { Socket } from 'socket.io';

import * as fs from 'fs';
import path from 'path';
import { streamEvents, STREAM_EVENTS } from './streamEvent';
import { setupStream, streamingUrl } from './streamService';

/**
 * Stream Component
 *
 * This component manages the entire lifecycle of a live stream, encompassing:
 * - Start
 * - Data streaming
 * - User join
 * - End stream
 * - Disconnect handling
 *
 * Key features:
 * - Processes the stream at dedicated endpoints:
 *     - `/public/livestream/{streamkey}` for stream input.
 *
 * Future Integration:
 * - Plan to integrate with a CDN to store the processed stream, providing users with a playback URL upon stream completion.
 */

// Store active streams
export const activeStreams = new Map();

/**
 * Handle start stream
 */
export async function handleStartStream(
  socket: Socket,
  data: {
    userId: string;
    streamKey: string;
  },
) {
  try {
    console.log('🎬 Starting stream setup for:', data.streamKey);
    console.log('🎬 Socket info:', {
      socketId: socket.id,
      connected: socket.connected,
      userId: data.userId
    });
    
    const { ffmpegCommand, outputPath, inputStream } = await setupStream({
      streamKey: data.streamKey,
      userId: data.userId,
    });

    console.log('✅ Stream setup completed:', {
      streamKey: data.streamKey,
      outputPath,
      hasInputStream: !!inputStream,
      hasFfmpegCommand: !!ffmpegCommand,
      inputStreamType: typeof inputStream,
      inputStreamDestroyed: inputStream?.destroyed,
      inputStreamReadable: inputStream?.readable
    });

    let streamData = activeStreams.get(data.streamKey);

    if (!streamData) {
      streamData = {
        userId: data.userId,
        streamKey: data.streamKey,
        command: ffmpegCommand,
        inputStream,
        viewers: new Set(),
        broadcasterSocketId: socket.id,
        startedAt: new Date(),
        isInitialized: true, // Mark as initialized
        status: 'initializing'
      };
      activeStreams.set(data.streamKey, streamData);
      console.log('✅ Stream data added to active streams');
      console.log('✅ Active streams count:', activeStreams.size);
      console.log('✅ Active stream keys:', Array.from(activeStreams.keys()));
    } else {
      // Update existing stream data
      streamData.command = ffmpegCommand;
      streamData.inputStream = inputStream;
      streamData.broadcasterSocketId = socket.id;
      streamData.isInitialized = true;
      streamData.status = 'initializing';
      console.log('✅ Existing stream data updated');
    }
    
    // Verify the stream is properly stored
    const storedStream = activeStreams.get(data.streamKey);
    console.log('🔍 Verification - stored stream:', {
      exists: !!storedStream,
      hasInputStream: !!storedStream?.inputStream,
      inputStreamDestroyed: storedStream?.inputStream?.destroyed,
      streamKey: storedStream?.streamKey
    });

    socket.join(data.streamKey);
    console.log('🔌 Socket joined stream room:', data.streamKey);

    // Emit stream initialization event
    streamEvents.emit(STREAM_EVENTS.STREAM_INITIALIZED, {
      streamKey: data.streamKey,
      userId: data.userId,
      status: 'initializing'
    });

    ffmpegCommand
      .on('error', (err) => {
        console.error(`❌ FFmpeg error for stream ${data.streamKey}:`, err);
        streamData.status = 'error';
        
        streamEvents.emit(STREAM_EVENTS.STREAM_ERROR, {
          error: err.message,
          streamKey: data.streamKey,
        });
      })

      .on('start', () => {
        console.log('🎬 FFmpeg started for stream:', data.streamKey);
        streamData.status = 'active';
        
        // Emit stream started event
        streamEvents.emit(STREAM_EVENTS.STREAM_STARTED, {
          streamKey: data.streamKey,
          userId: data.userId,
          status: 'active'
        });
        
        // Notify the broadcaster that stream is ready
        socket.emit('stream-started', {
          streamKey: data.streamKey,
          status: 'active',
          message: 'Stream is now broadcasting'
        });
        
        console.log('✅ FFmpeg stream is now active and ready to receive data');
        console.log('✅ Stream status updated to active');
      })

      .on('progress', (progress) => {
        console.log('📊 FFmpeg progress for stream:', data.streamKey, progress);
        console.log('📊 Progress details:', {
          streamKey: data.streamKey,
          frames: progress.frames,
          currentFps: progress.currentFps,
          currentKbps: progress.currentKbps,
          targetSize: progress.targetSize,
          timemark: progress.timemark,
          percent: progress.percent
        });
      })

      .on('end', (res) => {
        console.log('🏁 FFmpeg ended for stream:', data.streamKey, res);
        streamData.status = 'ended';
        activeStreams.delete(data.streamKey);
        
        streamEvents.emit(STREAM_EVENTS.STREAM_END, {
          streamKey: data.streamKey,
        });
      });

    console.log('🎬 Starting FFmpeg command...');
    // FFmpeg is already started in streamService.ts with .save(outputPath)
    // No need to call .run() again
    console.log('✅ FFmpeg command started');

    // Check if the output directory and files are created
    setTimeout(async () => {
      try {
        const fs = require('fs');
        const path = require('path');
        const streamPath = path.join(process.cwd(), 'public', 'livestreams', data.streamKey);
        const m3u8Path = path.join(streamPath, 'stream.m3u8');
        
        if (fs.existsSync(streamPath)) {
          console.log('✅ Stream directory created:', streamPath);
          const files = fs.readdirSync(streamPath);
          console.log('📁 Files in stream directory:', files);
          
          // Update stream status to ready
          streamData.status = 'ready';
          streamData.isInitialized = true;
          
          // Emit stream ready event
          streamEvents.emit(STREAM_EVENTS.STREAM_READY, {
            streamKey: data.streamKey,
            userId: data.userId,
            status: 'ready',
            files: files
          });
          
          // Notify broadcaster that stream is ready
          socket.emit('stream-ready', {
            streamKey: data.streamKey,
            status: 'ready',
            files: files,
            message: 'Stream files are ready for broadcasting'
          });
        } else {
          console.log('❌ Stream directory not created:', streamPath);
          streamData.status = 'error';
        }
        
        if (fs.existsSync(m3u8Path)) {
          console.log('✅ M3U8 file created:', m3u8Path);
          const stats = fs.statSync(m3u8Path);
          console.log('📊 M3U8 file stats:', stats);
        } else {
          console.log('❌ M3U8 file not created:', m3u8Path);
          
          // Create a basic HLS manifest if it doesn't exist
          console.log('📝 Creating basic HLS manifest...');
          const basicManifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:2
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:EVENT`;
          
          try {
            await fs.promises.writeFile(m3u8Path, basicManifest, 'utf8');
            console.log('✅ Basic HLS manifest created (ready for segments)');
          } catch (writeError) {
            console.error('❌ Failed to create basic HLS manifest:', writeError);
          }
        }
        
        // Set up periodic manifest health check
        const manifestHealthCheck = setInterval(async () => {
          try {
            if (fs.existsSync(m3u8Path)) {
              let manifestContent = fs.readFileSync(m3u8Path, 'utf8');
              const segmentFiles = fs.readdirSync(streamPath).filter(file => file.endsWith('.ts'));
              
              // If we have segments but manifest has ENDLIST, fix it
              if (segmentFiles.length > 0 && manifestContent.includes('#EXT-X-ENDLIST')) {
                console.log('🔧 Periodic health check: fixing manifest with ENDLIST');
                
                manifestContent = manifestContent.replace(/#EXT-X-ENDLIST[\r\n]*/g, '');
                
                if (!manifestContent.includes('#EXT-X-PLAYLIST-TYPE:EVENT')) {
                  manifestContent = manifestContent.replace(
                    '#EXT-X-MEDIA-SEQUENCE:0',
                    '#EXT-X-MEDIA-SEQUENCE:0\n#EXT-X-PLAYLIST-TYPE:EVENT'
                  );
                }
                
                fs.writeFileSync(m3u8Path, manifestContent, 'utf8');
                console.log('✅ Manifest health check: fixed ENDLIST issue');
              }
            }
          } catch (healthCheckError) {
            console.error('❌ Manifest health check error:', healthCheckError);
          }
        }, 5000); // Check every 5 seconds
        
        // Store the interval reference for cleanup
        streamData.manifestHealthCheck = manifestHealthCheck;
        
      } catch (checkError) {
        console.error('❌ Error checking stream files:', checkError);
      }
    }, 2000); // Check after 2 seconds

  } catch (error) {
    console.error('❌ Error in handleStartStream:', error);
    
    // Emit error event
    streamEvents.emit(STREAM_EVENTS.STREAM_ERROR, {
      error: error instanceof Error ? error.message : 'Unknown error',
      streamKey: data.streamKey,
    });
    
    // Notify broadcaster of error
    socket.emit('stream-error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      streamKey: data.streamKey,
    });
    
    throw error;
  }
}

/**
 * Handle streaming
 * Todo: Ideally we will want to process stream to a CDN.
 */
export function handleStreamData(socket: Socket, data: { streamKey: string; chunk: Buffer }) {
  console.log('🔍 handleStreamData called with:', {
    streamKey: data.streamKey,
    chunkType: typeof data.chunk,
    chunkIsBuffer: Buffer.isBuffer(data.chunk),
    chunkLength: data.chunk?.length || 'unknown',
    socketId: socket.id,
    timestamp: Date.now()
  });

  const stream = activeStreams.get(data.streamKey);

  if (!stream?.inputStream) {
    console.log('❌ Stream not found or no input stream:', data.streamKey);
    console.log('❌ Available streams:', Array.from(activeStreams.keys()));
    console.log('❌ Stream data if exists:', stream);
    return;
  }

  try {
    const chunk = Buffer.isBuffer(data.chunk) ? data.chunk : Buffer.from(data.chunk);
    
    console.log(`📡 Processing stream chunk: ${chunk.length} bytes, stream: ${data.streamKey}`);
    console.log(`📡 Chunk type: ${typeof data.chunk}, isBuffer: ${Buffer.isBuffer(data.chunk)}`);
    console.log(`📡 Stream input stream state:`, {
      hasInputStream: !!stream.inputStream,
      isDestroyed: stream.inputStream?.destroyed,
      readable: stream.inputStream?.readable,
      flowing: stream.inputStream?.flowing
    });
    
    // Push the chunk to the FFmpeg input stream
    if (stream.inputStream && !stream.inputStream.destroyed) {
      stream.inputStream.push(chunk);
      console.log(`✅ Stream data pushed to FFmpeg: ${chunk.length} bytes, stream: ${data.streamKey}`);
      
      // Check if the chunk was actually processed
      console.log(`🔍 Post-push verification:`, {
        inputStreamDestroyed: stream.inputStream.destroyed,
        inputStreamReadable: stream.inputStream.readable,
        inputStreamFlowing: stream.inputStream.flowing
      });
      
      // Check if FFmpeg is actually processing the data
      if (stream.command) {
        console.log(`🔍 FFmpeg command state:`, {
          streamKey: data.streamKey,
          hasCommand: !!stream.command,
          commandState: stream.command._currentOutput?.ffmpegProc?.killed || 'unknown'
        });
      }
    } else {
      console.log('⚠️ Input stream is destroyed or unavailable');
    }
    
    // Check if HLS files are being created
    try {
      const fs = require('fs');
      const path = require('path');
      const streamPath = path.join(process.cwd(), 'public', 'livestreams', data.streamKey);
      const m3u8Path = path.join(streamPath, 'stream.m3u8');
      
      if (fs.existsSync(streamPath)) {
        const files = fs.readdirSync(streamPath);
        const segmentFiles = files.filter(file => file.endsWith('.ts'));
        const hasManifest = fs.existsSync(m3u8Path);
        
        console.log('📁 Stream directory status:', {
          streamKey: data.streamKey,
          hasManifest,
          segmentCount: segmentFiles.length,
          files: files
        });
        
        // Check and fix manifest if it has ENDLIST (which means stream ended prematurely)
        if (hasManifest && segmentFiles.length > 0) {
          try {
            let manifestContent = fs.readFileSync(m3u8Path, 'utf8');
            
            if (manifestContent.includes('#EXT-X-ENDLIST')) {
              console.log('⚠️ Manifest has ENDLIST but stream is active, fixing...');
              
              // Remove ENDLIST and ensure proper format
              manifestContent = manifestContent.replace(/#EXT-X-ENDLIST[\r\n]*/g, '');
              
              // Ensure we have the proper headers
              if (!manifestContent.includes('#EXT-X-PLAYLIST-TYPE:EVENT')) {
                manifestContent = manifestContent.replace(
                  '#EXT-X-MEDIA-SEQUENCE:0',
                  '#EXT-X-MEDIA-SEQUENCE:0\n#EXT-X-PLAYLIST-TYPE:EVENT'
                );
              }
              
              fs.writeFileSync(m3u8Path, manifestContent, 'utf8');
              console.log('✅ Manifest fixed - removed ENDLIST and added EVENT type');
            }
          } catch (manifestFixError) {
            console.error('❌ Error fixing manifest:', manifestFixError);
          }
        }
        
        // If we have segments, notify viewers that new content is available
        if (segmentFiles.length > 0) {
          socket.to(data.streamKey).emit('stream-segments-updated', {
            streamKey: data.streamKey,
            segmentCount: segmentFiles.length,
            latestSegment: segmentFiles[segmentFiles.length - 1],
            timestamp: Date.now()
          });
          
          console.log('🎯 Stream segments found and viewers notified:', {
            streamKey: data.streamKey,
            segmentCount: segmentFiles.length,
            latestSegment: segmentFiles[segmentFiles.length - 1]
          });
        } else {
          console.log('⚠️ No stream segments found yet for:', data.streamKey);
          console.log('⚠️ This may indicate FFmpeg is not processing the input stream');
        }
      }
    } catch (fileCheckError) {
      console.log('⚠️ Could not check stream files:', fileCheckError);
    }
    
    // Broadcast stream data to all viewers in the same stream room
    const viewersInRoom = stream.viewers.size;
    socket.to(data.streamKey).emit('stream-data', {
      streamKey: data.streamKey,
      chunk: chunk,
      timestamp: Date.now()
    });
    
    console.log(`📡 Stream data sent to ${viewersInRoom} viewers for stream: ${data.streamKey}`);
    
    // Also emit to the broadcaster for confirmation
    socket.emit('stream-data-sent', {
      streamKey: data.streamKey,
      viewersCount: viewersInRoom,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('❌ Error handling stream data:', error);
    streamEvents.emit(STREAM_EVENTS.STREAM_ERROR, {
      error: error.message,
      streamKey: data.streamKey,
    });
  }
}

/**
 * Handle ending stream
 */

export async function handleEndStream(
  socket: Socket,
  data: {
    streamKey: string;
    userId: string;
  },
) {
  const stream = activeStreams.get(data.streamKey);

  if (!stream || stream.userId !== data.userId) return;

  try {
    // Close the input stream
    if (stream.inputStream) {
      stream.inputStream.push(null);
    }

    // Kill FFmpeg process if it exists
    if (stream.command) {
      stream.command.kill('SIGKILL');
    }

    // Clean up manifest health check interval
    if (stream.manifestHealthCheck) {
      clearInterval(stream.manifestHealthCheck);
      console.log('✅ Manifest health check interval cleared');
    }

    // Properly end the HLS manifest with ENDLIST
    try {
      const fs = require('fs');
      const path = require('path');
      const streamPath = path.join(process.cwd(), 'public', 'livestreams', data.streamKey);
      const m3u8Path = path.join(streamPath, 'stream.m3u8');
      
      if (fs.existsSync(m3u8Path)) {
        let manifestContent = fs.readFileSync(m3u8Path, 'utf8');
        
        // Add ENDLIST tag to properly close the stream
        if (!manifestContent.includes('#EXT-X-ENDLIST')) {
          manifestContent += '\n#EXT-X-ENDLIST';
          fs.writeFileSync(m3u8Path, manifestContent, 'utf8');
          console.log('✅ HLS manifest properly ended with #EXT-X-ENDLIST');
        }
      }
    } catch (manifestError) {
      console.error('❌ Error ending HLS manifest:', manifestError);
    }

    activeStreams.delete(data.streamKey);
    socket.leave(data.streamKey);

    streamEvents.emit(STREAM_EVENTS.STREAM_END, {
      streamKey: data.streamKey,
    });

    await cleanupStreamDirectory(data.streamKey);
  } catch (error) {
    console.error('Stream end error:', error);
    streamEvents.emit(STREAM_EVENTS.STREAM_ERROR, {
      error: error.message,
      streamKey: data.streamKey,
    });
  }
}

/**
 * Initialize stream data for HTTP endpoints (without socket)
 * This is used when the /start endpoint is called to prepare the stream
 */
export async function initializeStreamForHttp(
  streamKey: string,
  userId: string
) {
  try {
    console.log('🎬 Initializing stream data for HTTP endpoint:', streamKey);
    
    // Check if stream already exists
    let streamData = activeStreams.get(streamKey);
    
    if (!streamData) {
      // Create basic stream data structure
      streamData = {
        userId: userId,
        streamKey: streamKey,
        command: null, // Will be set when broadcaster connects
        inputStream: null, // Will be set when broadcaster connects
        viewers: new Set(),
        broadcasterSocketId: null, // Will be set when broadcaster connects
        startedAt: new Date(),
        isInitialized: true, // Mark as initialized
        status: 'waiting_for_broadcaster' // Waiting for broadcaster to connect
      };
      activeStreams.set(streamKey, streamData);
      console.log('✅ Stream data initialized for HTTP endpoint');
    } else {
      // Update existing stream data
      streamData.isInitialized = true;
      streamData.status = 'waiting_for_broadcaster';
      streamData.startedAt = new Date();
      console.log('✅ Existing stream data updated for HTTP endpoint');
    }

    // Emit stream initialization event
    streamEvents.emit(STREAM_EVENTS.STREAM_INITIALIZED, {
      streamKey: streamKey,
      userId: userId,
      status: 'waiting_for_broadcaster'
    });

    console.log(`🎯 Stream ${streamKey} is now waiting for broadcaster to connect`);
    return streamData;

  } catch (error) {
    console.error('❌ Failed to initialize stream for HTTP endpoint:', error);
    throw error;
  }
}

const cleanupStreamDirectory = async (streamKey: string): Promise<void> => {
  try {
    const streamPath = path.join(process.cwd(), 'public', 'livestreams', streamKey);
    if (fs.existsSync(streamPath)) {
      await fs.promises.rm(streamPath, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`Error cleaning up stream directory:`, error);
  }
};

/**
 * Handle viewer joining a stream
 */
export function handleJoinStream(socket: Socket, data: { streamKey: string }) {
  const stream = activeStreams.get(data.streamKey);

  if (!stream) {
    console.log('❌ Stream not found for join request:', data.streamKey);
    socket.emit('stream-error', {
      error: 'Stream not found',
      streamKey: data.streamKey
    });
    return;
  }

  console.log('👥 Viewer joining stream:', {
    streamKey: data.streamKey,
    viewerId: socket.id,
    currentViewers: stream.viewers.size,
    broadcasterId: stream.broadcasterSocketId
  });

  socket.join(data.streamKey);
  stream.viewers.add(socket.id);

  // Check if HLS stream files exist and provide them to the viewer
  try {
    const fs = require('fs');
    const path = require('path');
    const streamPath = path.join(process.cwd(), 'public', 'livestreams', data.streamKey);
    const m3u8Path = path.join(streamPath, 'stream.m3u8');
    
    if (fs.existsSync(m3u8Path)) {
      const manifestContent = fs.readFileSync(m3u8Path, 'utf8');
      const segmentFiles = fs.readdirSync(streamPath).filter(file => file.endsWith('.ts'));
      
      console.log('📁 Found existing HLS files for viewer:', {
        streamKey: data.streamKey,
        manifestExists: !!manifestContent,
        segmentCount: segmentFiles.length,
        segments: segmentFiles
      });

      // Send existing stream data to the viewer
      socket.emit('stream-initialized', {
        streamKey: data.streamKey,
        manifestUrl: `/livestream/${data.streamKey}/stream.m3u8`,
        segmentCount: segmentFiles.length,
        isLive: true,
        message: 'Stream initialized with existing HLS data'
      });
    } else {
      console.log('⚠️ No HLS files found for viewer, stream may not be started yet');
      
      // Send stream joined without HLS data
      socket.emit('stream-joined', {
        streamKey: data.streamKey,
        viewerCount: stream.viewers.size,
        isLive: false,
        message: 'Stream joined but not yet started'
      });
    }
  } catch (error) {
    console.error('❌ Error checking HLS files for viewer:', error);
    
    // Fallback to basic stream joined
    socket.emit('stream-joined', {
      streamKey: data.streamKey,
      viewerCount: stream.viewers.size,
      isLive: false,
      message: 'Stream joined (HLS check failed)'
    });
  }

  // Notify the broadcaster that a new viewer joined
  socket.to(stream.broadcasterSocketId).emit('viewer-joined', {
    streamKey: data.streamKey,
    viewerId: socket.id,
    viewerCount: stream.viewers.size
  });

  // Update viewer count for all
  streamEvents.emit(STREAM_EVENTS.VIEWER_COUNT, {
    streamKey: data.streamKey,
    count: stream.viewers.size,
  });

  console.log('✅ Viewer joined stream successfully:', {
    streamKey: data.streamKey,
    viewerId: socket.id,
    totalViewers: stream.viewers.size
  });
}

/**
 * Handle socket disconnection
 * This handles both broadcaster and viewer disconnections
 */
export function handleDisconnect(socket: Socket) {
  // Check if the disconnected socket was a broadcaster
  for (const [streamKey, stream] of activeStreams.entries()) {
    if (stream.broadcasterSocketId === socket.id) {
      // Broadcaster disconnected - end the stream
      try {
        // Close the input stream
        if (stream.inputStream) {
          stream.inputStream.push(null);
        }

        // Kill FFmpeg process if it exists
        if (stream.command) {
          stream.command.kill('SIGKILL');
        }

        // Clean up manifest health check interval
        if (stream.manifestHealthCheck) {
          clearInterval(stream.manifestHealthCheck);
          console.log('✅ Manifest health check interval cleared on disconnect');
        }

        // Properly end the HLS manifest with ENDLIST
        try {
          const fs = require('fs');
          const path = require('path');
          const streamPath = path.join(process.cwd(), 'public', 'livestreams', streamKey);
          const m3u8Path = path.join(streamPath, 'stream.m3u8');
          
          if (fs.existsSync(m3u8Path)) {
            let manifestContent = fs.readFileSync(m3u8Path, 'utf8');
            
            // Add ENDLIST tag to properly close the stream
            if (!manifestContent.includes('#EXT-X-ENDLIST')) {
              manifestContent += '\n#EXT-X-ENDLIST';
              fs.writeFileSync(m3u8Path, manifestContent, 'utf8');
              console.log('✅ HLS manifest properly ended with #EXT-X-ENDLIST on disconnect');
            }
          }
        } catch (manifestError) {
          console.error('❌ Error ending HLS manifest on disconnect:', manifestError);
        }

        activeStreams.delete(streamKey);

        streamEvents.emit(STREAM_EVENTS.STREAM_END, {
          streamKey: streamKey,
        });
      } catch (error) {
        console.error('Stream end error on disconnect:', error);
        streamEvents.emit(STREAM_EVENTS.STREAM_ERROR, {
          error: error.message,
          streamKey: streamKey,
        });
      }
      return;
    }

    // Check if the disconnected socket was a viewer
    if (stream.viewers.has(socket.id)) {
      stream.viewers.delete(socket.id);

      console.log('👋 Viewer disconnected from stream:', {
        streamKey: streamKey,
        viewerId: socket.id,
        remainingViewers: stream.viewers.size
      });

      // Notify the broadcaster that a viewer left
      socket.to(stream.broadcasterSocketId).emit('viewer-left', {
        streamKey: streamKey,
        viewerId: socket.id,
        viewerCount: stream.viewers.size
      });

      streamEvents.emit(STREAM_EVENTS.VIEWER_COUNT, {
        streamKey: streamKey,
        count: stream.viewers.size,
      });
    }
  }
}
