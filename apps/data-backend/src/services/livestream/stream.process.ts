import * as path from "path";
import * as fs from "fs";
import ffmpeg from "fluent-ffmpeg";

import { setupFFmpegCommand } from "./ffmpeg.setup";
import { initializeStreamData, updateStreamStatus } from "./stream.store";
import { publicDir } from "../..";
import { processSegment } from "./segment.process";

// Store FFmpeg commands for multiple streams
const ffmpegCommands = new Map<string, ffmpeg.FfmpegCommand>();

export const processStreamChunk = async (
  streamKey: string,
  chunk: Buffer,
  isCamera: boolean
): Promise<string> => {
  const streamType = isCamera ? "camera" : "screen";
  const outputPath = path.join(publicDir, "live-streams", streamKey);
  const streamOutputPath = path.join(outputPath, streamType);

  // Ensure directories exist
  if (!fs.existsSync(streamOutputPath)) {
    fs.mkdirSync(streamOutputPath, { recursive: true });
  }

  // Initialize or get FFmpeg command
  const commandKey = `${streamKey}-${streamType}`;
  let ffmpegCommand = ffmpegCommands.get(commandKey);

  try {
    if (!ffmpegCommand || !ffmpegCommand.ffmpegProc?.stdin?.writable) {
      if (ffmpegCommand) {
        await stopStreamType(streamKey, isCamera);
      }

      ffmpegCommand = await setupFFmpegCommand(
        streamKey,
        streamType,
        outputPath,
        streamOutputPath,
        processSegment
      );
      ffmpegCommands.set(commandKey, ffmpegCommand);

      // Update stream status
      const streamData = initializeStreamData(streamKey);
      if (isCamera) {
        streamData.cameraActive = true;
      } else {
        streamData.screenActive = true;
      }
      updateStreamStatus(streamKey, streamData);
    }

    // Write chunk with error handling and retries
    let retries = 3;
    let lastError: Error | null = null;

    while (retries > 0) {
      try {
        if (!ffmpegCommand.ffmpegProc?.stdin?.writable) {
          throw new Error("FFmpeg process not writable");
        }

        await writeChunkToFFmpeg(ffmpegCommand, chunk);
        lastError = null;
        break;
      } catch (error) {
        lastError = error as Error;
        retries--;
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          // Recreate FFmpeg command if needed
          if (!ffmpegCommand.ffmpegProc?.stdin?.writable) {
            ffmpegCommand = await setupFFmpegCommand(
              streamKey,
              streamType,
              outputPath,
              streamOutputPath,
              processSegment
            );
            ffmpegCommands.set(commandKey, ffmpegCommand);
          }
        }
      }
    }

    if (lastError) {
      throw lastError;
    }

    // Generate Cloudinary HLS URL
    const cloudinaryHlsUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/live-streams/${streamKey}/${streamType}/playlist.m3u8`;

    return cloudinaryHlsUrl;
  } catch (error) {
    console.error(`Error in ${streamType} stream ${streamKey}:`, error);

    // Update stream status with error
    const streamData = initializeStreamData(streamKey);
    streamData.errors[streamType] = error.message;
    updateStreamStatus(streamKey, streamData);

    await stopStreamType(streamKey, isCamera);
    throw error;
  }
};

const writeChunkToFFmpeg = (
  command: ffmpeg.FfmpegCommand,
  chunk: Buffer
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!command.ffmpegProc?.stdin?.writable) {
      return reject(new Error("FFmpeg process not writable"));
    }

    const stdin = command.ffmpegProc.stdin;

    const errorHandler = (error: Error) => {
      stdin.removeListener("error", errorHandler);
      if (error.message.includes("EPIPE")) {
        resolve();
      } else {
        reject(error);
      }
    };

    stdin.once("error", errorHandler);

    const writeResult = stdin.write(chunk, (error) => {
      stdin.removeListener("error", errorHandler);
      if (error && !error.message.includes("EPIPE")) {
        reject(error);
      } else {
        resolve();
      }
    });

    if (!writeResult) {
      stdin.once("drain", () => resolve());
    }
  });
};

export const stopStreamType = async (
  streamKey: string,
  isCamera: boolean
): Promise<void> => {
  const streamType = isCamera ? "camera" : "screen";
  const commandKey = `${streamKey}-${streamType}`;
  const command = ffmpegCommands.get(commandKey);

  if (command?.ffmpegProc) {
    try {
      if (command.ffmpegProc.stdin?.writable) {
        command.ffmpegProc.stdin.end();
      }

      // Give FFmpeg time to clean up
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!command.ffmpegProc.killed) {
        command.ffmpegProc.kill("SIGKILL");
      }
    } catch (error) {
      console.error(`Error stopping ${streamType} stream:`, error);
    }
  }

  ffmpegCommands.delete(commandKey);

  // Update stream status
  const streamData = initializeStreamData(streamKey);
  if (isCamera) {
    streamData.cameraActive = false;
    streamData.cameraHlsUrl = undefined;
  } else {
    streamData.screenActive = false;
    streamData.screenHlsUrl = undefined;
  }
  updateStreamStatus(streamKey, streamData);

  // Clean up stream directory
  try {
    const streamPath = path.join(
      publicDir,
      "live-streams",
      streamKey,
      streamType
    );
    if (fs.existsSync(streamPath)) {
      await fs.promises.rm(streamPath, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`Error cleaning up ${streamType} stream directory:`, error);
  }
};

export const cleanupStream = async (streamKey: string): Promise<void> => {
  await Promise.all([
    stopStreamType(streamKey, true),
    stopStreamType(streamKey, false),
  ]);

  // Clean up main stream directory
  try {
    const streamPath = path.join(publicDir, "live-streams", streamKey);
    if (fs.existsSync(streamPath)) {
      await fs.promises.rm(streamPath, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`Error cleaning up stream directory:`, error);
  }
};
