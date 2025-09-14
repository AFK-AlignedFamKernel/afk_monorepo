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
    
    // Check if stream already exists and is active
    const existingStream = activeStreams.get(data.streamKey);
    if (existingStream && existingStream.status === 'active') {
      console.log('✅ Stream already active, reusing existing stream:', data.streamKey);
      
      // Update the existing stream with new broadcaster info
      existingStream.broadcasterSocketId = socket.id;
      existingStream.userId = data.userId;
      
      // Join socket to stream room
      socket.join(data.streamKey);
      
      // Send immediate success response
      socket.emit('stream-started', {
        streamKey: data.streamKey,
        status: 'broadcasting',
        message: 'Stream already active, reusing existing setup'
      });
      
      console.log('✅ Stream reused successfully');
      return;
    }
    
    // Setup new FFmpeg stream
    const { ffmpegCommand, outputPath, inputStream } = await setupStream({
      streamKey: data.streamKey,
      userId: data.userId,
    });

    console.log('✅ FFmpeg setup complete for:', data.streamKey);

    // Start stream activity monitor
    const activityMonitor = setInterval(() => {
      const now = new Date();
      const timeSinceLastData = now.getTime() - streamData.lastDataReceived.getTime();
      
      // If no data received for more than 30 seconds, consider ending the stream
      if (timeSinceLastData > 30000) {
        console.log('⚠️ No data received for 30 seconds, ending stream:', data.streamKey);
        clearInterval(activityMonitor);
        activeStreams.delete(data.streamKey);
        socket.emit('stream-ended', { streamKey: data.streamKey });
      }
    }, 10000); // Check every 10 seconds
    // Create stream data
    const streamData = {
      userId: data.userId,
      streamKey: data.streamKey,
      command: ffmpegCommand,
      inputStream: inputStream,
      chunkAccumulator: Buffer.alloc(0), // Initialize chunk accumulator
      viewers: new Set(),
      broadcasterSocketId: socket.id,
      startedAt: new Date(),
      lastDataReceived: new Date(),
      status: 'active',
      activityMonitor: activityMonitor
    };
    
    activeStreams.set(data.streamKey, streamData);
    console.log('✅ Stream added to active streams');

    // Join socket to stream room
    socket.join(data.streamKey);


    // Store the interval ID for cleanup
    streamData.activityMonitor = activityMonitor;

    // FFmpeg event handlers
    ffmpegCommand
      .on('start', (commandLine) => {
        console.log('🎬 FFmpeg started for:', data.streamKey);
        console.log('🎬 FFmpeg command:', commandLine);
        streamData.status = 'broadcasting';
        
        // Notify broadcaster
        socket.emit('stream-started', {
          streamKey: data.streamKey,
          status: 'broadcasting'
        });
      })
      .on('progress', (progress) => {
        console.log('📊 FFmpeg progress:', progress.frames, 'frames,', progress.percent, '%');
      })
      .on('stderr', (stderrLine) => {
        console.log('📝 FFmpeg stderr:', stderrLine);
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg error:', err.message);
        console.error('❌ FFmpeg full error:', err);
        
        // Check for specific input format errors
        if (err.message.includes('Invalid data found when processing input')) {
          console.error('❌ FFmpeg input format error - WebM chunks may be malformed');
          console.error('❌ This usually means the input stream format is not compatible');
        }
        
        streamData.status = 'error';
        socket.emit('stream-error', { 
          error: err.message,
        });
      })
      .on('end', () => {
        console.log('🏁 FFmpeg ended for:', data.streamKey);
        
        // Only end the stream if it's not actively receiving data
        const stream = activeStreams.get(data.streamKey);
        if (stream && stream.status === 'active') {
          console.log('⚠️ FFmpeg ended but stream is still active, attempting restart...');
          
          // Try to restart FFmpeg if we have recent data
          setTimeout(async () => {
            try {
              const tempWebmPath = path.join(process.cwd(), 'public', 'livestreams', data.streamKey, 'temp.webm');
              const stats = await fs.promises.stat(tempWebmPath);
              
              if (stats.size > 1024) {
                console.log('🔄 Restarting FFmpeg with existing data...');
                // Restart FFmpeg with the existing temp file
                const { ffmpegCommand: newCommand } = await setupStream({
                  streamKey: data.streamKey,
                  userId: data.userId,
                });
                
                // Update the stream with new command
                stream.command = newCommand;
                stream.status = 'active';
                
                newCommand.output(path.join(process.cwd(), 'public', 'livestreams', data.streamKey, 'stream.m3u8')).run();
              } else {
                console.log('❌ Not enough data to restart FFmpeg, ending stream');
                activeStreams.delete(data.streamKey);
                socket.emit('stream-ended', { streamKey: data.streamKey });
              }
            } catch (error) {
              console.error('❌ Error restarting FFmpeg:', error);
              activeStreams.delete(data.streamKey);
              socket.emit('stream-ended', { streamKey: data.streamKey });
            }
          }, 2000);
        } else {
          console.log('✅ Stream ended normally');
          
          // Clean up activity monitor
          if (stream.activityMonitor) {
            clearInterval(stream.activityMonitor);
          }
          
          activeStreams.delete(data.streamKey);
          socket.emit('stream-ended', { streamKey: data.streamKey });
        }
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
export async function handleStreamData(socket: Socket, data: { streamKey: string; chunk: Buffer }) {
  const stream = activeStreams.get(data.streamKey);

  if (!stream?.inputStream) {
    console.log('❌ Stream not found:', data.streamKey);
    return;
  }

  try {
    const chunk = Buffer.isBuffer(data.chunk) ? data.chunk : Buffer.from(data.chunk);
    
    console.log(`📡 Processing chunk: ${chunk.length} bytes for ${data.streamKey}`);
    
    // Update last data received timestamp
    stream.lastDataReceived = new Date();
    
    // Initialize chunk accumulator if not exists
    if (!stream.chunkAccumulator) {
      stream.chunkAccumulator = Buffer.alloc(0);
      console.log('📦 Initialized chunk accumulator for stream:', data.streamKey);
    }
    
    // Accumulate chunks to create a continuous stream
    stream.chunkAccumulator = Buffer.concat([stream.chunkAccumulator, chunk]);
    console.log(`📦 Accumulated chunks: ${stream.chunkAccumulator.length} bytes total`);
    
    // Write accumulated data to a temporary file for FFmpeg to process
    const tempWebmPath = path.join(process.cwd(), 'public', 'livestreams', data.streamKey, 'temp.webm');
    
    try {
      // Ensure the directory exists
      await fs.promises.mkdir(path.dirname(tempWebmPath), { recursive: true });
      
      // For the first chunk, create the file; for subsequent chunks, append
      if (stream.chunkAccumulator.length === chunk.length) {
        // This is the first chunk - create the file
        await fs.promises.writeFile(tempWebmPath, chunk);
        console.log(`✅ First chunk written to temp file: ${chunk.length} bytes`);
      } else {
        // This is a subsequent chunk - append to the file
        await fs.promises.appendFile(tempWebmPath, chunk);
        console.log(`✅ Chunk appended to temp file: ${chunk.length} bytes`);
      }
      
      // If this is the first chunk, start FFmpeg processing
      if (stream.chunkAccumulator.length === chunk.length) {
        console.log('🎬 First chunk received, starting FFmpeg processing...');
        // FFmpeg will be started by the stream setup after delay
      }
      
    } catch (error) {
      console.error('❌ Error writing chunk to temp file:', error);
    }
    
    // Check for generated HLS segments
    const streamPath = path.join(process.cwd(), 'public', 'livestreams', data.streamKey);
    if (fs.existsSync(streamPath)) {
      const files = fs.readdirSync(streamPath);
      const segments = files.filter(file => file.endsWith('.ts'));
      const manifest = files.filter(file => file.endsWith('.m3u8'));
      
      console.log(`📁 Stream directory contents: ${files.length} files (${segments.length} segments, ${manifest.length} manifests)`);
      
      if (segments.length > 0) {
        console.log(`🎯 HLS segments found: ${segments.length} for ${data.streamKey}`);
        
        // Check segment sizes
        segments.forEach(segment => {
          const segmentPath = path.join(streamPath, segment);
          const stats = fs.statSync(segmentPath);
          console.log(`📄 Segment ${segment}: ${stats.size} bytes`);
        });
        
        // Notify viewers of new content
        socket.to(data.streamKey).emit('stream-segments-updated', {
          streamKey: data.streamKey,
          segmentCount: segments.length
        });
      } else {
        console.log('⚠️ No HLS segments found yet - FFmpeg may not be processing data');
      }
    } else {
      console.log('❌ Stream directory does not exist:', streamPath);
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
  if (!stream) {
    console.log('❌ Stream not found for ending:', data.streamKey);
    return;
  }

  // Check if the user is authorized to end this stream
  if (stream.userId !== data.userId && stream.broadcasterSocketId !== socket.id) {
    console.log('❌ User not authorized to end stream:', data.streamKey, 'userId:', data.userId);
    return;
  }

  try {
    console.log('🛑 Ending stream:', data.streamKey);
    
    // Stop activity monitor
    if (stream.activityMonitor) {
      clearInterval(stream.activityMonitor);
      console.log('✅ Activity monitor stopped');
    }
    
    // Stop FFmpeg process
    if (stream.command) {
      console.log('🛑 Killing FFmpeg process...');
      stream.command.kill('SIGKILL');
      console.log('✅ FFmpeg process killed');
    }
    
    // Close input stream
    if (stream.inputStream) {
      stream.inputStream.push(null);
      console.log('✅ Input stream closed');
    }
    
    // Clean up temporary files
    try {
      const tempWebmPath = path.join(process.cwd(), 'public', 'livestreams', data.streamKey, 'temp.webm');
      if (fs.existsSync(tempWebmPath)) {
        fs.unlinkSync(tempWebmPath);
        console.log('✅ Temporary WebM file cleaned up');
      }
    } catch (cleanupError) {
      console.warn('⚠️ Error cleaning up temp file:', cleanupError);
    }
    
    // Remove from active streams
    activeStreams.delete(data.streamKey);
    socket.leave(data.streamKey);
    
    // Emit stream-ended event to all connected clients
    socket.to(data.streamKey).emit('stream-ended', { streamKey: data.streamKey });
    socket.emit('stream-ended', { streamKey: data.streamKey });
    
    console.log('✅ Stream ended successfully:', data.streamKey);
    
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
      
      // Clean up activity monitor
      if (stream.activityMonitor) {
        clearInterval(stream.activityMonitor);
      }
      
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
