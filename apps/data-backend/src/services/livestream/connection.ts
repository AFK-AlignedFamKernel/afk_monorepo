import fs from "fs";
import { Server, Socket } from "socket.io";
import {
  ffmpegCommands,
  handleStreamData,
  inputStreams,
  streamStore,
} from "./util";

import path from "path";
import { publicDir } from "../..";
import { SocketStreamDataType, StreamMetadata } from "./stream.store";

/**
 * End a stream FN
 * @param streamKey
 * @param socket
 */
export const endStream = (streamKey: string, socket: Socket): void => {
  //NB: I dont think we need to cleanup cloudinary so live stream can be watched later.
  //:cleanupCloudinary(streamKey);
  const streamData = streamStore.get(streamKey);
  if (streamData && streamData.streamerId === socket.id) {
    streamStore.set(streamKey, { ...streamData, active: false });

    // Clean up stream directory
    const streamDir = path.join(publicDir, "live-streams", streamKey);
    fs.rmSync(streamDir, { recursive: true, force: true });

    // Stop FFmpeg command
    const command = ffmpegCommands.get(streamKey);

    if (command) {
      command.kill("SIGKILL");
      ffmpegCommands.delete(streamKey);
    }

    // Close input stream
    const inputStream = inputStreams.get(streamKey);
    if (inputStream) {
      inputStream.end();
      inputStreams.delete(streamKey);
    }

    // Remove stream from active streams
    streamStore.delete(streamKey);
  }
};

/**
 * Start Stream Util
 * @param streamKey
 * @param userId
 */
export const startStreamUtil = async (
  streamKey: string,
  userId: string
): Promise<void> => {
  const streamDir = path.join(publicDir, "live-streams", streamKey);
  fs.mkdirSync(streamDir, { recursive: true });

  const streamMetadata: StreamMetadata = {
    streamerId: userId,
    startTime: Date.now(),
    viewers: new Set(),
    active: true,
  };

  streamStore.set(streamKey, streamMetadata);
};

/**
 * Handle Start Stream
 * @param socket
 * @param data
 */
export const handleStartStream = async (
  socket: Socket,
  data: SocketStreamDataType
) => {
  try {
    await startStreamUtil(data.streamKey, socket.id);
    socket.join(data.streamKey);

    socket.emit("stream-started", {
      streamKey: data.streamKey,
      metadata: data.metadata,
    });
  } catch (error) {
    socket.emit("stream-error", { message: "Failed to start stream" });
  }
};

/**
 * Handle Join Stream
 * @param socket
 * @param param1
 */
export const handleJoinStream = (
  socket: Socket,
  { streamKey, userId }: { streamKey: string; userId: string }
) => {
  const streamData = streamStore.get(streamKey);
  console.log(streamData, "data");
  if (streamData?.active) {
    socket.join(streamKey);
    streamData.viewers.add(userId);

    socket.emit("viewer-count", streamData.viewers.size);

    if (streamData.hlsUrl) {
      socket.emit("playback-url", streamData.hlsUrl);
    }
  } else {
    socket.emit("stream-error", { message: "Stream not found or inactive" });
  }
};

/**
 * Handle Disconnect stream
 * @param socket
 */
export const handleDisconnect = (socket: Socket) => {
  const streams = streamStore.getAll();

  for (const [streamKey, metadata] of streams) {
    if (metadata.streamerId === socket.id) {
      endStream(streamKey, socket);
      socket.to(streamKey).emit("stream-ended", { streamKey });
    }

    if (metadata.viewers.has(socket.id)) {
      metadata.viewers.delete(socket.id);
      socket.to(streamKey).emit("viewer-count", metadata.viewers.size);
    }
  }
};

/**
 * Handle End Stream
 * @param socket
 * @param streamKey
 */
export const handleEndStream = (socket: Socket, streamKey: string) => {
  const streamData = streamStore.get(streamKey);
  if (streamData && streamData.streamerId === socket.id) {
    endStream(streamKey, socket);
    socket.to(streamKey).emit("stream-ended", { streamKey });
    socket.leave(streamKey);
    console.log(`Stream ended: ${streamKey}`);
  } else {
    socket.emit("stream-error", { message: "Unauthorized to end stream" });
  }
};

/**
 * Setup websocket connection
 * @param io
 */
export const setupWebSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    socket.on("start-stream", (data) => handleStartStream(socket, data));
    socket.on("join-stream", (data) => handleJoinStream(socket, data));
    socket.on("stream-data", (data) => handleStreamData(socket, data));
    socket.on("end-stream", (streamKey: string) =>
      handleEndStream(socket, streamKey)
    );

    // WebRTC signaling
    socket.on("stream-offer", (data) => {
      socket.to(data.streamKey).emit("stream-offer", {
        offer: data.offer,
        streamerId: socket.id,
      });
    });

    socket.on("stream-answer", (data) => {
      socket.to(data.streamerId).emit("stream-answer", {
        answer: data.answer,
        viewerId: socket.id,
      });
    });

    socket.on("ice-candidate", (data) => {
      socket.to(data.recipientId).emit("ice-candidate", {
        candidate: data.candidate,
        senderId: socket.id,
      });
    });

    socket.on("disconnect", () => handleDisconnect(socket));
  });
};
