import ffmpeg from "fluent-ffmpeg";
import { mkdir, access, unlink, readFile, writeFile } from "fs/promises";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { constants, createReadStream, watch } from "fs";
import { basename, join } from "path";
import { Readable } from "stream";
import { config } from "../../config";

type StreamSetup = {
  userId: string;
  streamKey: string;
};

const s3Client = new S3Client({
  region: "auto",
  endpoint: config.cloudfare.r2Domain,
  credentials: {
    accessKeyId: config.cloudfare.r2Access,
    secretAccessKey: config.cloudfare.r2Secret,
  },
});

export const streamingUrl = (streamKey: string, fileName: string) =>
  `${config.cloudfare.r2Domain}/livestream/${streamKey}/${fileName}`;

// Add CORS and caching headers
const getCommonHeaders = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD",
  "Access-Control-Allow-Headers": "*",
  "Cache-Control": "max-age=3600",
});

// Ensure directory exists
export async function ensureDir(dir: string) {
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
    // Enable object mode to handle Buffer chunks properly
    objectMode: false,
    // Set high water mark for better performance
    highWaterMark: 1024 * 1024 // 1MB
  });
}

// Handle stream setup
export async function setupStream(data: StreamSetup) {
  const streamPath = join(
    process.cwd(),
    "public",
    "livestreams",
    data.streamKey
  );
  await ensureDir(streamPath);

  const outputPath = join(streamPath, "stream.m3u8");
  const inputStream = createInputStream();

  console.log('🎬 Setting up FFmpeg for stream:', {
    streamKey: data.streamKey,
    streamPath,
    outputPath,
    hasInputStream: !!inputStream
  });

  const ffmpegCommand = ffmpeg()
    .input(inputStream)
    .inputFormat("webm")
    .format("hls")
    .videoCodec("libx264")
    .audioCodec("aac")
    .outputOptions([
      // Video quality and encoding
      "-preset",
      "medium",
      "-crf",
      "23",
      "-maxrate",
      "2500k",
      "-bufsize",
      "5000k",

      // Scaling and resolution
      "-vf",
      "scale=1280:720",

      // HLS specific settings
      "-hls_time",
      "2",
      "-hls_list_size",
      "0",
      "-hls_flags",
      "delete_segments+append_list",
      "-hls_segment_filename",
      join(streamPath, "segment_%d.ts"),

      // Keyframe interval
      "-g",
      "60",

      // Additional optimization
      "-sc_threshold",
      "0",
      "-movflags",
      "+faststart",

      // Force keyframe generation
      "-force_key_frames",
      "expr:gte(t,n_forced*2)",

      // Better compatibility
      "-profile:v",
      "baseline",
      "-level",
      "3.0"
    ]);

  // Add event listeners for better debugging
  ffmpegCommand.on('start', (commandLine) => {
    console.log('🎬 FFmpeg started with command:', commandLine);
  });

  ffmpegCommand.on('progress', (progress) => {
    console.log('📊 FFmpeg progress:', progress);
  });

  ffmpegCommand.on('error', (err) => {
    console.error('❌ FFmpeg error:', err);
  });

  ffmpegCommand.on('end', () => {
    console.log('✅ FFmpeg finished successfully');
  });

  // Start FFmpeg processing
  ffmpegCommand.save(outputPath);

  // Set up file watcher for HLS segments
  watcherFn(streamPath, data, outputPath);

  console.log('✅ FFmpeg setup completed for stream:', data.streamKey);

  return { ffmpegCommand, outputPath, inputStream };
}

// Delete File
async function deleteFile(filePath: string) {
  try {
    await unlink(filePath);
    console.log(`Deleted file: ${filePath}`);
  } catch (err) {
    console.error(`Error deleting file: ${filePath}`, err);
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// Upload
async function uploadFileToR2(
  bucketName: string,
  filePath: string,
  streamKey: string,
  fileType: "m3u8" | "ts"
): Promise<string> {
  const fileName = basename(filePath);
  const key = `livestream/${streamKey}/${fileName}`;

  try {
    const fileStream = createReadStream(filePath);

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: fileStream,
        ...getCommonHeaders(),
      },
    });

    await upload.done();
    return streamingUrl(streamKey, fileName);
  } catch (err) {
    console.error("Error uploading to R2", err);
    throw err;
  }
}

async function processSegment(
  segmentPath: string,
  streamKey: string,
  m3u8Path: string
) {
  try {
    if (!(await fileExists(segmentPath))) {
      return;
    }

    await uploadFileToR2(
      config.cloudfare.r2BucketName,
      segmentPath,
      streamKey,
      "ts"
    );

    if (await fileExists(m3u8Path)) {
      await updateAndUploadM3u8(m3u8Path, streamKey);
    }

    // Keep segments for now, don't delete immediately
    // setTimeout(async () => {
    //   if (await fileExists(segmentPath)) {
    //     await deleteFile(segmentPath);
    //   }
    // }, 30000); // Keep segments for 30 seconds before deletion
  } catch (err) {
    console.error(`Error processing segment ${basename(segmentPath)}:`, err);
  }
}

// Update and upload M3U8 file
async function updateAndUploadM3u8(localM3u8Path: string, streamKey: string) {
  try {
    if (!(await fileExists(localM3u8Path))) {
      return;
    }

    let content = await readFile(localM3u8Path, "utf8");

    // Ensure proper M3U8 headers
    if (!content.includes("#EXTM3U")) {
      content = "#EXTM3U\n#EXT-X-VERSION:3\n" + content;
    }

    await writeFile(localM3u8Path, content, "utf8");
    await uploadFileToR2(config.cloudfare.r2BucketName, localM3u8Path, streamKey, "m3u8");
  } catch (err) {
    console.error("Error updating and uploading m3u8:", err);
    throw err;
  }
}

const watcherFn = (streamPath: string, data: { streamKey: string }, outputPath: string) => {
  const watcher = watch(streamPath, async (eventType, filename) => {
    if (eventType === 'rename' && filename?.endsWith('.ts')) {
      const segmentPath = join(streamPath, filename);
      await processSegment(segmentPath, data.streamKey, outputPath);
    }
  });

  // Cleanup watcher on process exit
  // process.on("exit", () => watcher.close());
  return watcher;
};
