import fs from "fs";
import { Socket } from "socket.io";
import ffmpeg from "fluent-ffmpeg";
import { processStreamChunk } from "./stream.process";
import { SegmentStatus, StreamMetadata } from "./stream.store";

// Enhanced resource tracking
export const ffmpegCommands: Map<string, ffmpeg.FfmpegCommand> = new Map();
export const inputStreams: Map<string, fs.WriteStream> = new Map();
export const uploadedSegments = new Map<string, Set<number>>();
export const uploadQueue: Map<string, Promise<any>> = new Map();
export const activeStreams = new Map<string, StreamMetadata>();
export const segmentTracker = new Map<string, Map<number, SegmentStatus>>();
export const streamStore = {
  get: (streamKey: string) => activeStreams.get(streamKey),
  set: (streamKey: string, metadata: StreamMetadata) =>
    activeStreams.set(streamKey, metadata),
  delete: (streamKey: string) => activeStreams.delete(streamKey),
  getAll: () => activeStreams,
};
const retryDelays = [1000, 2000, 5000];

//Stream Data
export const handleStreamData = async (
  socket: Socket,
  data: { streamKey: string; chunk: Buffer; isCamera: boolean }
) => {
  try {
    const streamKey = data.streamKey;

    if (!data?.chunk) return;
    const resp = await processStreamChunk(streamKey, data.chunk, data.isCamera);
  } catch (error) {
    console.error("Stream processing error:", error);
    socket.emit("stream-error", { message: "Stream processing failed" });
  }
};

// Enhanced upload with retry mechanism
export async function retryOperation<T>(
  operation: () => Promise<T>,
  retryCount = 3
): Promise<T> {
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === retryCount - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
    }
  }
  throw new Error("All retry attempts failed");
}
