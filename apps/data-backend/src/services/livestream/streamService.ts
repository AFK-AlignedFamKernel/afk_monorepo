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

// Only create S3 client if R2 is properly configured
const s3Client = isR2Configured() ? new S3Client({
  region: "auto",
  endpoint: config.cloudfare.r2Domain,
  credentials: {
    accessKeyId: config.cloudfare.r2Access,
    secretAccessKey: config.cloudfare.r2Secret,
  },
}) : null;

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

// Check if R2 configuration is valid
export function isR2Configured(): boolean {
  return !!(config.cloudfare.r2Domain && 
           config.cloudfare.r2Access && 
           config.cloudfare.r2Secret && 
           config.cloudfare.r2BucketName);
}

// Create input stream for FFmpeg
export function createInputStream() {
  return new Readable({
    read() {},
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

  console.log('🎬 Creating FFmpeg command with options...');
  
  const ffmpegCommand = ffmpeg()
    .input(inputStream)
    .inputFormat("webm")
    .format("hls")
    .videoCodec("libx264")
    .audioCodec("aac")
    .outputOptions([
      // Audio specific settings - CRITICAL for HLS compatibility
      // Note: audioCodec("aac") above already sets the codec
      "-ar", "44100",        // Sample rate
      "-ac", "2",            // Stereo audio
      "-b:a", "128k",        // Audio bitrate
      "-af", "aresample=44100", // Resample audio
      
      // Video quality and encoding - HLS optimized
      "-preset",
      "ultrafast", // Changed from medium for faster encoding
      "-crf",
      "28", // Changed from 23 for faster encoding
      "-maxrate",
      "2500k",
      "-bufsize",
      "5000k",
      "-profile:v",
      "baseline",
      "-level",
      "3.0",
      "-pix_fmt",
      "yuv420p",

      // Scaling and resolution - handled by video codec settings
      // "-vf", "scale=1280:720", // Removed duplicate scaling

      // HLS specific settings - CRITICAL for proper HLS generation
      "-hls_time",
      "2",
      "-hls_list_size",
      "0",
      "-hls_flags",
      "delete_segments+append_list+independent_segments",
      "-hls_segment_filename",
      join(streamPath, "segment_%d.ts"),
      "-hls_allow_cache",
      "0",
      "-hls_start_number_source",
      "datetime",

      // Keyframe interval - reduced for faster segment generation
      "-g",
      "30", // Changed from 60 for faster keyframe generation

      // Additional optimization
      "-sc_threshold",
      "0",
      "-movflags",
      "+faststart",

      // Force keyframe generation
      "-force_key_frames",
      "expr:gte(t,n_forced*1)", // Changed from 2 for more frequent keyframes

      // Better compatibility
      "-profile:v",
      "baseline",
      "-level",
      "3.0",

      // Additional settings for better live streaming
      "-tune",
      "zerolatency",
      "-probesize",
      "32",
      "-analyzeduration",
      "0"
    ]);

  // Add event listeners for better debugging
  ffmpegCommand.on('start', (commandLine) => {
    console.log('🎬 FFmpeg started with command:', commandLine);
    console.log('📡 FFmpeg is now processing video input stream');
  });

  // Monitor audio processing
  ffmpegCommand.on('stderr', (stderrLine) => {
    if (stderrLine.includes('Audio:')) {
      console.log('🎵 Audio detected:', stderrLine);
    }
    if (stderrLine.includes('No audio')) {
      console.warn('⚠️ No audio detected in input stream');
    }
    if (stderrLine.includes('Stream #0:1')) {
      console.log('🎵 Audio stream info:', stderrLine);
    }
  });

  // Monitor progress for audio bitrate
  ffmpegCommand.on('progress', (progress) => {
    if (progress.currentKbps) {
      console.log('Current keyframe bitrate:', progress.currentKbps, 'kbps');
    }
  });

  ffmpegCommand.on('progress', (progress) => {
    console.log('📊 FFmpeg progress:', {
      frames: progress.frames,
      currentFps: progress.currentFps,
      currentKbps: progress.currentKbps,
      targetSize: progress.targetSize,
      timemark: progress.timemark,
      percent: progress.percent
    });
  });

  ffmpegCommand.on('error', (err) => {
    console.error('❌ FFmpeg error:', err);
    console.error('❌ FFmpeg error details:', err.message);
  });

  ffmpegCommand.on('end', () => {
    console.log('✅ FFmpeg finished successfully');
  });

  ffmpegCommand.on('stderr', (stderrLine) => {
    console.log('🔍 FFmpeg stderr:', stderrLine);
  });

  // Start FFmpeg processing
  console.log('🎬 Starting FFmpeg processing...');
  console.log('📁 Output path:', outputPath);
  ffmpegCommand.output(outputPath).run();

  // Set up file watcher for HLS segments
  watcherFn(streamPath, data, outputPath);

  // Create initial manifest that's ready for segments (without ENDLIST)
  const initialManifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:2
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:EVENT`;
  
  try {
    await writeFile(outputPath, initialManifest, 'utf8');
    console.log('✅ Initial HLS manifest created (ready for segments)');
  } catch (writeError) {
    console.error('❌ Failed to create initial HLS manifest:', writeError);
  }

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

    if (!s3Client) {
      console.log('⚠️ S3 client not available, skipping R2 upload');
      return `local://${filePath}`;
    }

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

    // Remove any existing ENDLIST tag - we don't want to end the stream prematurely
    content = content.replace(/#EXT-X-ENDLIST[\r\n]*/g, '');

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
