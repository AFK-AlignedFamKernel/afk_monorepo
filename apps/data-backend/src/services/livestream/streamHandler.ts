import { Socket } from 'socket.io';
import * as fs from 'fs';
import path from 'path';
import { streamEvents, STREAM_EVENTS } from './streamEvent';
import { setupStream } from './streamService';

/**
 * Simplified Stream Handler
 * 
 * Process:
 * 1. Host connects via WebSocket
 * 2. Video data flows through WebSocket → FFmpeg → HLS segments
 * 3. NIP-53 event gets streaming URL for viewers
 */

// Store active streams
export const activeStreams = new Map();

/**
 * Handle start stream - simplified version
 */
export async function handleStartStream(
  socket: Socket,
  data: {
    userId: string;
    streamKey: string;
  },
) {
  try {
    console.log('🎬 Starting stream:', data.streamKey);
    
    // Setup FFmpeg stream
    const { ffmpegCommand, outputPath, inputStream } = await setupStream({
      streamKey: data.streamKey,
      userId: data.userId,
    });

    console.log('✅ FFmpeg setup complete for:', data.streamKey);

    // Create stream data
    const streamData = {
      userId: data.userId,
      streamKey: data.streamKey,
      command: ffmpegCommand,
      inputStream: inputStream,
      viewers: new Set(),
      broadcasterSocketId: socket.id,
      startedAt: new Date(),
      status: 'active'
    };
    
    activeStreams.set(data.streamKey, streamData);
    console.log('✅ Stream added to active streams');

    // Join socket to stream room
    socket.join(data.streamKey);

    // FFmpeg event handlers
    ffmpegCommand
      .on('start', () => {
        console.log('🎬 FFmpeg started for:', data.streamKey);
        streamData.status = 'broadcasting';
        
        // Notify broadcaster
        socket.emit('stream-started', {
          streamKey: data.streamKey,
          status: 'broadcasting'
        });
      })
      .on('progress', (progress) => {
        console.log('📊 FFmpeg progress:', progress.frames, 'frames');
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg error:', err.message);
        streamData.status = 'error';
        socket.emit('stream-error', { error: err.message });
      })
      .on('end', () => {
        console.log('🏁 FFmpeg ended for:', data.streamKey);
        activeStreams.delete(data.streamKey);
        socket.emit('stream-ended', { streamKey: data.streamKey });
      });

    console.log('✅ Stream setup complete');

  } catch (error) {
    console.error('❌ Stream setup failed:', error);
    socket.emit('stream-error', { error: error.message });
  }
}

/**
 * Handle video data from WebSocket - simplified version
 */
export function handleStreamData(socket: Socket, data: { streamKey: string; chunk: Buffer }) {
  const stream = activeStreams.get(data.streamKey);

  if (!stream?.inputStream) {
    console.log('❌ Stream not found:', data.streamKey);
    return;
  }

  try {
    const chunk = Buffer.isBuffer(data.chunk) ? data.chunk : Buffer.from(data.chunk);
    
    console.log(`📡 Processing chunk: ${chunk.length} bytes for ${data.streamKey}`);
    
    // Push to FFmpeg input stream
    if (stream.inputStream && !stream.inputStream.destroyed) {
      stream.inputStream.push(chunk);
      console.log(`✅ Chunk sent to FFmpeg: ${chunk.length} bytes`);
    }
    
    // Check for generated HLS segments
    const streamPath = path.join(process.cwd(), 'public', 'livestreams', data.streamKey);
    if (fs.existsSync(streamPath)) {
      const files = fs.readdirSync(streamPath);
      const segments = files.filter(file => file.endsWith('.ts'));
      
      if (segments.length > 0) {
        console.log(`🎯 HLS segments found: ${segments.length} for ${data.streamKey}`);
        
        // Notify viewers of new content
        socket.to(data.streamKey).emit('stream-segments-updated', {
          streamKey: data.streamKey,
          segmentCount: segments.length
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error processing stream data:', error);
  }
}

/**
 * Handle stream end - simplified version
 */
export async function handleEndStream(
  socket: Socket,
  data: { streamKey: string; userId: string; }
) {
  const stream = activeStreams.get(data.streamKey);
  if (!stream || stream.userId !== data.userId) return;

  try {
    console.log('🛑 Ending stream:', data.streamKey);
    
    // Stop FFmpeg
    if (stream.command) {
      stream.command.kill('SIGKILL');
    }
    
    // Close input stream
    if (stream.inputStream) {
      stream.inputStream.push(null);
    }
    
    // Remove from active streams
    activeStreams.delete(data.streamKey);
    socket.leave(data.streamKey);
    
    console.log('✅ Stream ended:', data.streamKey);
    
  } catch (error) {
    console.error('❌ Error ending stream:', error);
  }
}

/**
 * Handle viewer joining - simplified version
 */
export function handleJoinStream(socket: Socket, data: { streamKey: string }) {
  const stream = activeStreams.get(data.streamKey);
  
  if (!stream) {
    socket.emit('stream-error', { error: 'Stream not found' });
    return;
  }

  console.log('👥 Viewer joining:', data.streamKey);
  
  socket.join(data.streamKey);
  stream.viewers.add(socket.id);
  
  // Send current stream info
  socket.emit('stream-joined', {
    streamKey: data.streamKey,
    viewerCount: stream.viewers.size
  });
  
  // Notify broadcaster
  socket.to(stream.broadcasterSocketId).emit('viewer-joined', {
    streamKey: data.streamKey,
    viewerCount: stream.viewers.size
  });
}

/**
 * Handle socket disconnect - simplified version
 */
export function handleDisconnect(socket: Socket) {
  // Check if broadcaster disconnected
  for (const [streamKey, stream] of activeStreams.entries()) {
    if (stream.broadcasterSocketId === socket.id) {
      console.log('🛑 Broadcaster disconnected, ending stream:', streamKey);
      handleEndStream(socket, { streamKey, userId: stream.userId });
      return;
    }
    
    // Remove viewer
    if (stream.viewers.has(socket.id)) {
      stream.viewers.delete(socket.id);
      console.log('👋 Viewer disconnected from:', streamKey);
      
      // Notify broadcaster
      socket.to(stream.broadcasterSocketId).emit('viewer-left', {
        streamKey,
        viewerCount: stream.viewers.size
      });
    }
  }
}
