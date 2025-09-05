# Continuous Stream Fix for FFmpeg Processing

## Problem
FFmpeg was receiving individual WebM chunks but not generating HLS segments. The issue was that FFmpeg needs a continuous stream, not fragmented chunks.

## Root Cause
- MediaRecorder sends individual WebM chunks every 1000ms
- Each chunk is a complete WebM fragment, not a continuous stream
- FFmpeg was trying to process individual chunks instead of a continuous stream
- No HLS segments were being generated

## Solution Applied

### 1. File-Based Processing Approach
Instead of using a stream input, we now use a temporary WebM file:

```typescript
// BEFORE (problematic)
const ffmpegCommand = ffmpeg()
  .input(inputStream)  // Direct stream input
  .inputFormat("webm")

// AFTER (fixed)
const tempWebmPath = join(streamPath, "temp.webm");
const ffmpegCommand = ffmpeg()
  .input(tempWebmPath)  // File-based input
  .inputFormat("webm")
```

### 2. Chunk Accumulation to File
WebM chunks are now written to a temporary file:

```typescript
// Write accumulated data to a temporary file for FFmpeg to process
const tempWebmPath = path.join(process.cwd(), 'public', 'livestreams', data.streamKey, 'temp.webm');

try {
  // Append chunk to temporary WebM file
  await fs.promises.appendFile(tempWebmPath, chunk);
  console.log(`✅ Chunk appended to temp file: ${chunk.length} bytes`);
} catch (error) {
  console.error('❌ Error writing chunk to temp file:', error);
}
```

### 3. Smart FFmpeg Startup
FFmpeg now waits for the temp file to have data before starting:

```typescript
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
```

### 4. Enhanced Input Options
Added live input mode and better buffering:

```typescript
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
```

## Key Improvements

### 1. **File-Based Processing**
- WebM chunks are written to a temporary file
- FFmpeg processes the file instead of individual chunks
- Creates a continuous stream for FFmpeg to work with

### 2. **Smart Startup Logic**
- FFmpeg waits for data to be available before starting
- Prevents FFmpeg from starting with empty input
- Reduces startup errors and improves reliability

### 3. **Better Error Handling**
- Async/await for file operations
- Proper error handling for file writes
- Better logging for debugging

### 4. **Live Input Mode**
- Added `-live 1` flag for better live streaming support
- Enhanced reconnection capabilities
- Better buffering for continuous data

## Expected Results

### Before Fix:
```
📡 Processing chunk: 315758 bytes for stream
✅ Chunk sent to FFmpeg: 315758 bytes
⚠️ No HLS segments found yet - FFmpeg may not be processing data
```

### After Fix:
```
📡 Processing chunk: 315758 bytes for stream
✅ Chunk appended to temp file: 315758 bytes
🎬 Temp WebM file has data, starting FFmpeg...
📋 HLS manifest updated, validating...
✅ Manifest has 3 segments
```

## Testing
To verify the fix:
1. Start a stream as a host
2. Check that chunks are being written to `temp.webm`
3. Verify FFmpeg starts when file has data
4. Confirm HLS segments are generated
5. Check that viewers can see the stream

## File Structure
```
public/livestreams/{streamKey}/
├── temp.webm          # Temporary WebM file (accumulated chunks)
├── stream.m3u8        # HLS manifest
├── segment_0.ts       # HLS video segments
├── segment_1.ts
└── ...
```

## Benefits
- ✅ FFmpeg can process continuous WebM data
- ✅ HLS segments are generated properly
- ✅ More reliable streaming
- ✅ Better error handling
- ✅ Reduced startup issues
- ✅ Live streaming optimizations
