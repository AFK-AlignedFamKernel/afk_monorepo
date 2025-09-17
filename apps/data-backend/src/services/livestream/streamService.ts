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

// Create multiple quality variants for adaptive bitrate streaming
export async function createQualityVariants(streamPath: string, data: StreamSetup) {
  const qualities = [
    { name: "720p", width: 1280, height: 720, bitrate: "2500k", audioBitrate: "128k" },
    { name: "480p", width: 854, height: 480, bitrate: "1500k", audioBitrate: "96k" },
    { name: "360p", width: 640, height: 360, bitrate: "800k", audioBitrate: "64k" }
  ];

  const masterPlaylist = `#EXTM3U
#EXT-X-VERSION:6
#EXT-X-INDEPENDENT-SEGMENTS

#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.640028,mp4a.40.2"
720p/stream.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=854x480,CODECS="avc1.64001f,mp4a.40.2"
480p/stream.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,CODECS="avc1.64001e,mp4a.40.2"
360p/stream.m3u8
`;

  const masterPlaylistPath = join(streamPath, "master.m3u8");
  await writeFile(masterPlaylistPath, masterPlaylist, 'utf8');
  console.log('✅ Master playlist created for adaptive bitrate streaming');
  
  return masterPlaylistPath;
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
  
  // Use temporary WebM file for input
  const tempWebmPath = join(streamPath, "temp.webm");
  
  const ffmpegCommand = ffmpeg()
    .input(tempWebmPath)              // Use temporary WebM file
    .inputFormat("webm")              // Keep WebM format
    .inputOptions([
      "-fflags", "+genpts+igndts",    // Generate timestamps, ignore DTS
      "-avoid_negative_ts", "make_zero", // Handle negative timestamps
      "-analyzeduration", "50M",      // Much larger analysis duration
      "-probesize", "100M",           // Much larger probe size
      "-f", "webm",                   // Force WebM format
      "-thread_queue_size", "1024",   // Large thread queue for buffering
      "-max_delay", "5000000",        // Maximum delay in microseconds
      "-stream_loop", "-1"            // Loop the input file continuously
    ])
    .format("hls")
    .videoCodec("libx264")
    .audioCodec("aac")
    .outputOptions([
      // === BASIC VIDEO SETTINGS ===
      "-preset", "veryfast",           // Fast encoding
      "-crf", "23",                    // Good quality
      "-pix_fmt", "yuv420p",           // Standard pixel format
      
      // === RESOLUTION AND FRAME RATE ===
      "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2", // Scale to 1080p
      "-r", "30",                      // 30fps output
      "-g", "60",                      // Keyframe every 2 seconds
      
      // === AUDIO SETTINGS ===
      "-ar", "48000",                  // Sample rate
      "-ac", "2",                      // Stereo
      "-b:a", "128k",                  // Audio bitrate
      
      // === HLS SETTINGS ===
      "-hls_time", "2",                // 2-second segments
      "-hls_list_size", "0",           // Keep all segments
      "-hls_flags", "independent_segments", // Independent segments
      "-hls_segment_filename", join(streamPath, "segment_%d.ts"),
      
      // === LIVE STREAMING ===
      "-tune", "zerolatency",          // Low latency
      "-fps_mode", "cfr",             // Constant frame rate
      
      // === COMPATIBILITY ===
      "-f", "hls"                      // HLS format
    ])
    .output(outputPath);               // Set the output path

  // Add event listeners for better debugging
  ffmpegCommand.on('start', (commandLine) => {
    console.log('🎬 FFmpeg started with command:', commandLine);
    console.log('📡 FFmpeg is now processing video input stream');
  });

  // Add input stream monitoring
  inputStream.on('data', (chunk) => {
    console.log('📥 FFmpeg received chunk:', chunk.length, 'bytes');
  });

  inputStream.on('end', () => {
    console.log('📥 FFmpeg input stream ended');
  });

  inputStream.on('error', (error) => {
    console.error('❌ FFmpeg input stream error:', error);
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

  // FFmpeg will be started when first video data is received
  console.log('🎬 FFmpeg command prepared, waiting for video data...');
  console.log('📁 Output path:', outputPath);

  // Set up file watcher for HLS segments
  watcherFn(streamPath, data, outputPath);

  // Create initial manifest that's ready for segments (without ENDLIST)
  const initialManifest = `#EXTM3U
#EXT-X-VERSION:6
#EXT-X-TARGETDURATION:2
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:EVENT
#EXT-X-INDEPENDENT-SEGMENTS
`;
  
  try {
    await writeFile(outputPath, initialManifest, 'utf8');
    console.log('✅ Initial HLS manifest created (ready for segments)');
  } catch (writeError) {
    console.error('❌ Failed to create initial HLS manifest:', writeError);
  }

  // Set up periodic manifest validation (reduced frequency to prevent loops)
  const manifestCheckInterval = setInterval(async () => {
    try {
      await validateAndFixManifest(outputPath);
    } catch (error) {
      console.error('❌ Error in periodic manifest check:', error);
    }
  }, 30000); // Check every 30 seconds instead of 5

  // Cleanup interval on process exit
  process.on('exit', () => clearInterval(manifestCheckInterval));

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
      console.log('⚠️ Segment file does not exist:', segmentPath);
      return;
    }

    console.log(`🎬 Processing segment: ${basename(segmentPath)}`);
    
    // Check segment size
    const stats = await import('fs').then(fs => fs.promises.stat(segmentPath));
    console.log(`📊 Segment size: ${stats.size} bytes`);

    if (stats.size === 0) {
      console.log('⚠️ Segment is empty, skipping...');
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
    
    // Ensure proper line endings
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Ensure the file ends with a newline
    if (!content.endsWith('\n')) {
      content += '\n';
    }

    await writeFile(localM3u8Path, content, "utf8");
    await uploadFileToR2(config.cloudfare.r2BucketName, localM3u8Path, streamKey, "m3u8");
  } catch (err) {
    console.error("Error updating and uploading m3u8:", err);
    throw err;
  }
}

const watcherFn = (streamPath: string, data: { streamKey: string }, outputPath: string) => {
  // Debounce manifest validation to prevent infinite loops
  let manifestValidationTimeout: NodeJS.Timeout | null = null;
  
  const watcher = watch(streamPath, async (eventType, filename) => {
    console.log(`📁 File watcher: ${eventType} - ${filename}`);
    
    if (eventType === 'rename' && filename?.endsWith('.ts')) {
      const segmentPath = join(streamPath, filename);
      console.log(`🎬 New segment detected: ${filename}`);
      await processSegment(segmentPath, data.streamKey, outputPath);
    }
    
    // Also watch for manifest updates with debouncing
    if (eventType === 'change' && filename === 'stream.m3u8') {
      console.log('📋 HLS manifest updated, scheduling validation...');
      
      // Clear existing timeout
      if (manifestValidationTimeout) {
        clearTimeout(manifestValidationTimeout);
      }
      
      // Debounce manifest validation by 1 second
      manifestValidationTimeout = setTimeout(async () => {
        console.log('📋 HLS manifest updated, validating...');
        await validateAndFixManifest(outputPath);
      }, 1000);
    }
  });

  // Cleanup watcher on process exit
  // process.on("exit", () => watcher.close());
  return watcher;
};

// End HLS manifest by adding ENDLIST tag
export async function endHLSManifest(streamKey: string) {
  try {
    const manifestPath = join(process.cwd(), 'public', 'livestreams', streamKey, 'stream.m3u8');
    
    if (!(await fileExists(manifestPath))) {
      console.log('⚠️ Manifest file does not exist for ending:', streamKey);
      return;
    }

    let content = await readFile(manifestPath, 'utf8');
    
    // Add ENDLIST tag if not already present
    if (!content.includes('#EXT-X-ENDLIST')) {
      content += '\n#EXT-X-ENDLIST\n';
      await writeFile(manifestPath, content, 'utf8');
      console.log('✅ HLS manifest ended with ENDLIST tag for stream:', streamKey);
    } else {
      console.log('✅ HLS manifest already has ENDLIST tag for stream:', streamKey);
    }
  } catch (error) {
    console.error('❌ Error ending HLS manifest:', error);
  }
}

// Validate and fix HLS manifest
async function validateAndFixManifest(manifestPath: string) {
  try {
    if (!(await fileExists(manifestPath))) {
      console.log('⚠️ Manifest file does not exist');
      return;
    }

    const content = await readFile(manifestPath, 'utf8');
    console.log('📋 Current manifest content:', content);

    // Check if manifest has proper structure
    if (!content.includes('#EXTM3U') || !content.includes('#EXT-X-VERSION')) {
      console.log('⚠️ Manifest is malformed, recreating...');
      const fixedManifest = `#EXTM3U
#EXT-X-VERSION:6
#EXT-X-TARGETDURATION:2
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:EVENT
#EXT-X-INDEPENDENT-SEGMENTS
`;
      await writeFile(manifestPath, fixedManifest, 'utf8');
      return;
    }

    // Check if manifest has segments
    const lines = content.split('\n');
    const segments = lines.filter(line => line.endsWith('.ts'));
    
    if (segments.length === 0) {
      console.log('⚠️ Manifest has no segments, waiting for FFmpeg to generate them...');
      // Don't add placeholder content - this causes infinite loops
      // Just log and wait for actual segments from FFmpeg
    } else {
      console.log(`✅ Manifest has ${segments.length} segments`);
    }
  } catch (error) {
    console.error('❌ Error validating manifest:', error);
  }
}
