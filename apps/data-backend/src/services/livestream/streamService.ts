import ffmpeg from "fluent-ffmpeg";
import { mkdir, access } from "fs/promises";
import { constants } from "fs";
import { join } from "path";
import { Readable } from "stream";

export type StreamSource = "camera" | "screen";

type StreamSetup = {
  userId: string;
  streamKey: string;
  source: StreamSource;
};

// Ensure directory exists
export async function ensureDir(dir) {
  try {
    await access(dir, constants.F_OK);
  } catch {
    await mkdir(dir, { recursive: true });
  }
}

// Create input stream for FFmpeg
export function createInputStream() {
  return new Readable({
    read() {},
  });
}

// Handle stream setup
export async function setupStream(data: StreamSetup) {
  const streamPath = join(
    process.cwd(),
    "public",
    "livestreams",
    data.streamKey,
    data.source
  );
  await ensureDir(streamPath);

  const outputPath = join(streamPath, "stream.m3u8");
  const inputStream = createInputStream();

  const ffmpegCommand = ffmpeg()
    .input(inputStream)
    .inputFormat("webm")
    .format("hls")
    .videoCodec("libx264")
    .audioCodec("aac")
    .outputOptions([
      "-hls_time 2",
      "-hls_list_size 3",
      "-hls_flags delete_segments",
      "-hls_segment_filename",
      join(streamPath, "segment_%d.ts"),
    ]);

  return { ffmpegCommand, outputPath, inputStream };
}
