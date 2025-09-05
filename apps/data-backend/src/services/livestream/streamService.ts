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
  
  // Use temporary WebM file instead of input stream
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
      "-reconnect", "1",              // Enable reconnection
      "-reconnect_streamed", "1",     // Reconnect streamed input
      "-reconnect_delay_max", "2",    // Max delay for reconnection
      "-live", "1"                    // Enable live input mode
    ])
    .format("hls")
    .videoCodec("libx264")
    .audioCodec("aac")
    .outputOptions([
      // === VIDEO QUALITY SETTINGS (Industry Standard) ===
      "-preset", "veryfast",           // Balance between speed and quality
      "-crf", "23",                    // High quality (18-28 range, 23 is excellent)
      "-maxrate", "4000k",             // Maximum bitrate for 1080p
      "-bufsize", "8000k",             // Buffer size (2x maxrate for stability)
      "-pix_fmt", "yuv420p",           // Standard pixel format
      "-profile:v", "high",            // High profile for better quality
      "-level", "4.1",                 // Level 4.1 for 1080p support
      
      // === RESOLUTION AND FRAME RATE ===
      "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2", // Scale to 1080p
      "-r", "30",                      // Force 30fps output
      "-g", "60",                      // Keyframe every 2 seconds (30fps * 2)
      "-keyint_min", "30",             // Minimum keyframe interval
      
      // === AUDIO SETTINGS (High Quality) ===
      "-ar", "48000",                  // Professional sample rate
      "-ac", "2",                      // Stereo
      "-b:a", "192k",                  // High quality audio bitrate
      "-acodec", "aac",                // AAC codec
      "-strict", "experimental",       // Allow experimental codecs
      
      // === STREAM MAPPING ===
      "-map", "0:v:0",                 // Map first video stream
      "-map", "0:a:0?",                // Map first audio stream if available
      
      // === HLS OPTIMIZATION ===
      "-hls_time", "2",                // 2-second segments
      "-hls_list_size", "0",           // Keep all segments in playlist
      "-hls_flags", "independent_segments+delete_segments", // Independent segments with cleanup
      "-hls_segment_filename", join(streamPath, "segment_%d.ts"),
      "-hls_allow_cache", "0",         // No caching for live streams
      "-hls_start_number_source", "datetime", // Start numbering from current time
      
      // === LIVE STREAMING OPTIMIZATIONS ===
      "-tune", "zerolatency",          // Zero latency for live streaming
      "-probesize", "32M",             // Larger probe size for better detection
      "-analyzeduration", "10M",       // Analysis duration for better quality
      "-fflags", "+genpts+igndts",     // Generate timestamps, ignore DTS
      
      // === ENCODING OPTIMIZATIONS ===
      "-x264opts", "no-scenecut:keyint=60:min-keyint=30:8x8dct=1:aq-mode=2:aq-strength=0.8:deblock=0,0:ref=2:bframes=0:weightp=1:subme=6:mixed-refs=1:me=hex:merange=16:trellis=1:psy-rd=1.0,0.0:rc-lookahead=30:me_range=16:qcomp=0.6:qmin=10:qmax=51:qdiff=4:bf=0:8x8dct=1:me=hex:subme=6:me_range=16:trellis=1:psy-rd=1.0,0.0:aq-mode=2:aq-strength=0.8:deblock=0,0:ref=2:bframes=0:weightp=1:subme=6:mixed-refs=1:me=hex:merange=16:trellis=1:psy-rd=1.0,0.0:rc-lookahead=30",
      
      // === TIMESTAMP AND SYNC ===
      "-avoid_negative_ts", "make_zero", // Handle negative timestamps
      "-vsync", "cfr",                 // Constant frame rate
      "-async", "1",                   // Audio sync
      
      // === ADDITIONAL COMPATIBILITY ===
      "-movflags", "+faststart",       // Fast start for web playback
      "-f", "hls",                     // Force HLS format
      "-threads", "0"                  // Use all available CPU threads
    ]);

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

  // Start FFmpeg processing when temp file has data
  console.log('🎬 Waiting for WebM data to accumulate...');
  console.log('📁 Output path:', outputPath);
  console.log('📁 Temp WebM path:', tempWebmPath);
  
  // Wait for temp file to exist and have data
  const waitForData = async () => {
    try {
      const stats = await import('fs').then(fs => fs.promises.stat(tempWebmPath));
      if (stats.size > 0) {
        console.log('🎬 Temp WebM file has data, starting FFmpeg...');
        ffmpegCommand.output(outputPath).run();
      } else {
        console.log('⏳ Temp WebM file exists but is empty, waiting...');
        setTimeout(waitForData, 1000);
      }
    } catch (error) {
      console.log('⏳ Temp WebM file not ready yet, waiting...');
      setTimeout(waitForData, 1000);
    }
  };
  
  // Start checking for data after a short delay
  setTimeout(waitForData, 1000);

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
