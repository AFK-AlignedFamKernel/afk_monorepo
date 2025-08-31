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
    const { ffmpegCommand, outputPath, inputStream } = await setupStream({
      streamKey: data.streamKey,
      userId: data.userId,
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
      };
      activeStreams.set(data.streamKey, streamData);
    }

    socket.join(data.streamKey);

    ffmpegCommand
      .on('error', (err) => {
        console.log(`Stream ${data.streamKey} Just triggered ended`, err);

        streamEvents.emit(STREAM_EVENTS.STREAM_ERROR, {
          error: err.message,
          streamKey: data.streamKey,
        });
      })

      .on('end', (res) => {
        console.log('ended', res);
        activeStreams.delete(data.streamKey);
        streamEvents.emit(STREAM_EVENTS.STREAM_END, {
          streamKey: data.streamKey,
        });
      });

    ffmpegCommand.output(outputPath).run();

    // Emit stream started confirmation to the broadcaster
    socket.emit('stream-started', {
      streamKey: data.streamKey,
      streamingUrl: `${streamingUrl(data.streamKey, 'stream.m3u8')}`
    });

    // Notify all viewers that stream has started
    socket.to(data.streamKey).emit('stream-started', {
      streamKey: data.streamKey,
      streamingUrl: `${streamingUrl(data.streamKey, 'stream.m3u8')}`
    });

    streamEvents.emit(STREAM_EVENTS.STREAMING_URL, {
      streamingUrl: `${streamingUrl(data.streamKey, 'stream.m3u8')}`,
    });
  } catch (error) {
    console.error(error);
    streamEvents.emit(STREAM_EVENTS.STREAM_ERROR, {
      error: error.message,
      streamKey: data.streamKey,
    });
  }
}

/**
 * Handle streaming
 * Todo: Ideally we will want to process stream to a CDN.
 */
export function handleStreamData(socket: Socket, data: { streamKey: string; chunk: Buffer }) {
  const stream = activeStreams.get(data.streamKey);

  if (!stream?.inputStream) {
    console.log('❌ Stream not found or no input stream:', data.streamKey);
    return;
  }

  try {
    const chunk = Buffer.isBuffer(data.chunk) ? data.chunk : Buffer.from(data.chunk);
    stream.inputStream.push(chunk);
    
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

  // Notify the broadcaster that a new viewer joined
  socket.to(stream.broadcasterSocketId).emit('viewer-joined', {
    streamKey: data.streamKey,
    viewerId: socket.id,
    viewerCount: stream.viewers.size
  });

  // Notify the viewer that they successfully joined
  socket.emit('stream-joined', {
    streamKey: data.streamKey,
    viewerCount: stream.viewers.size,
    isLive: true
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
