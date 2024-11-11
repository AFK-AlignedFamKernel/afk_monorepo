import { Socket } from "socket.io";
import { streamEvents, STREAM_EVENTS } from "./streamEvent";
import { setupStream, StreamSource } from "./streamService";

/**
 * Stream Component
 *
 * This component manages the entire lifecycle of a live stream, encompassing:
 * - Start
 * - Data streaming
 * - User join
 * - End stream
 *
 * Key features:
 * - Attempts to support simultaneous streaming from multiple sources, such as camera and screen share.
 * - Processes the stream at dedicated endpoints:
 *     - `/public/livestream/{streamkey}/camera` for camera input.
 *     - `/public/livestream/{streamkey}/screen` for screen-sharing input.
 *
 * Current Limitation:
 * - Simultaneous streaming of both camera and screen may not function as expected, potentially causing performance issues or conflicts.
 *
 * Future Integration:
 * - Plan to integrate with a CDN to store the processed stream, providing users with a playback URL upon stream completion.
 *
 * Note:
 * - This component serves as a foundational building block for live streaming functionality, allowing for future enhancements
 *   and extensions as streaming requirements evolve.
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
    source: StreamSource;
  }
) {
  try {
    const { ffmpegCommand, outputPath, inputStream } = await setupStream({
      streamKey: data.streamKey,
      userId: data.userId,
      source: data.source,
    });

    let streamData = activeStreams.get(data.streamKey);

    if (!streamData) {
      streamData = {
        userId: data.userId,
        streamKey: data.streamKey,
        sources: new Map(),
      };
      activeStreams.set(data.streamKey, streamData);
    }

    // Setup stream for specific source
    streamData.sources.set(data.source, {
      command: ffmpegCommand,
      inputStream,
      viewers: new Set(),
    });

    socket.join(`${data.streamKey}-${data.source}`);

    ffmpegCommand
      .on("error", (err) => {
        streamEvents.emit(STREAM_EVENTS.STREAM_ERROR, {
          error: err.message,
          streamKey: data.streamKey,
          source: data.source,
        });
      })
      .on("end", () => {
        const stream = activeStreams.get(data.streamKey);
        stream?.sources.delete(data.source);
        if (stream?.sources.size === 0) {
          activeStreams.delete(data.streamKey);
        }
        streamEvents.emit(STREAM_EVENTS.STREAM_END, {
          streamKey: data.streamKey,
          source: data.source,
        });
      });

    ffmpegCommand.output(outputPath).run();

    streamEvents.emit(STREAM_EVENTS.PLAYBACK_URL, {
      playbackUrl: `/public/livestreams/${data.streamKey}/${data.source}/stream.m3u8`,
      source: data.source,
    });
  } catch (error) {
    console.error(error);
    streamEvents.emit(STREAM_EVENTS.STREAM_ERROR, {
      error: error.message,
      streamKey: data.streamKey,
      source: data.source,
    });
  }
}

/**
 * Handle streaming
 * Todo: Ideally we will want to process stream to a CDN.
 */
export function handleStreamData(
  socket: Socket,
  data: { streamKey: string; chunk: Buffer; source: StreamSource }
) {
  const stream = activeStreams.get(data.streamKey);
  const sourceStream = stream?.sources.get(data.source);

  if (!sourceStream?.inputStream) return;

  try {
    sourceStream.inputStream.push(Buffer.from(data.chunk));
  } catch (error) {
    streamEvents.emit(STREAM_EVENTS.STREAM_ERROR, {
      error: error.message,
      streamKey: data.streamKey,
      source: data.source,
    });
  }
}

/**
 * Handle ending a specific stream source
 */
export function handleEndStream(
  socket: Socket,
  data: {
    streamKey: string;
    source: StreamSource;
    userId: string;
  }
) {
  const stream = activeStreams.get(data.streamKey);
  if (!stream || stream.userId !== data.userId) return;

  try {
    const sourceStream = stream.sources.get(data.source);
    if (sourceStream) {
      // Close the input stream
      if (sourceStream.inputStream) {
        sourceStream.inputStream.push(null);
      }

      // Kill FFmpeg process if it exists
      if (sourceStream.command) {
        sourceStream.command.kill("SIGKILL");
      }

      // Remove the source from the stream
      stream.sources.delete(data.source);

      // Remove the stream if no sources left
      if (stream.sources.size === 0) {
        activeStreams.delete(data.streamKey);
      }

      socket.leave(`${data.streamKey}-${data.source}`);

      streamEvents.emit(STREAM_EVENTS.STREAM_END, {
        streamKey: data.streamKey,
        source: data.source,
      });
    }
  } catch (error) {
    console.error("Stream end error:", error);
    streamEvents.emit(STREAM_EVENTS.STREAM_ERROR, {
      error: error.message,
      streamKey: data.streamKey,
      source: data.source,
    });
  }
}

/**
 * Handle viewer joining a stream
 */
export function handleJoinStream(
  socket: Socket,
  data: { streamKey: string; source: StreamSource }
) {
  const stream = activeStreams.get(data.streamKey);
  const sourceStream = stream?.sources.get(data.source);

  if (!sourceStream) {
    streamEvents.emit(STREAM_EVENTS.STREAM_ERROR, {
      error: "Stream not found",
      source: data.source,
    });
    return;
  }

  socket.join(`${data.streamKey}-${data.source}`);
  sourceStream.viewers.add(socket.id);

  streamEvents.emit(STREAM_EVENTS.VIEWER_COUNT, {
    streamKey: data.streamKey,
    source: data.source,
    count: sourceStream.viewers.size,
  });
}

/**
 * Handle socket disconnection
 */
export function handleDisconnect(socket: Socket, userId: string) {
  for (const [streamKey, stream] of activeStreams.entries()) {
    if (stream.userId === userId) {
      // Streamer disconnected
      for (const [source, sourceStream] of stream.sources) {
        if (sourceStream.inputStream) {
          sourceStream.inputStream.push(null);
        }
        if (sourceStream.command) {
          sourceStream.command.kill("SIGKILL");
        }
        streamEvents.emit(STREAM_EVENTS.STREAM_END, { streamKey, source });
      }
      activeStreams.delete(streamKey);
    } else {
      // Check if viewer disconnected from any source
      for (const [source, sourceStream] of stream.sources) {
        if (sourceStream.viewers.has(socket.id)) {
          sourceStream.viewers.delete(socket.id);
          streamEvents.emit(STREAM_EVENTS.VIEWER_COUNT, {
            streamKey,
            source,
            count: sourceStream.viewers.size,
          });
        }
      }
    }
  }
}
