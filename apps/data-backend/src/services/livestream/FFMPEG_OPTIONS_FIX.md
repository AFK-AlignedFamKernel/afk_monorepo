# FFmpeg Options Fix

## Problem
FFmpeg was failing with error code 8 due to deprecated options and invalid input options:

```
❌ FFmpeg error: ffmpeg exited with code 8: -vsync is deprecated. Use -fps_mode
Option reconnect not found.
Error opening input file temp.webm.
Error opening input files: Option not found
```

## Root Causes

### 1. Deprecated `-vsync` Option
- `-vsync` is deprecated in newer FFmpeg versions
- Should be replaced with `-fps_mode`

### 2. Invalid Reconnect Options
- `-reconnect`, `-reconnect_streamed`, `-reconnect_delay_max` are not valid input options
- These options are for network inputs, not file inputs

### 3. Overly Complex Configuration
- Too many conflicting options
- Some options were redundant or incompatible

## Solutions Applied

### 1. Fixed Deprecated Options
```typescript
// BEFORE (deprecated)
"-vsync", "cfr",                 // Deprecated option

// AFTER (fixed)
"-fps_mode", "cfr",             // Modern equivalent
```

### 2. Removed Invalid Options
```typescript
// BEFORE (invalid for file input)
"-reconnect", "1",              // Not valid for file input
"-reconnect_streamed", "1",     // Not valid for file input
"-reconnect_delay_max", "2",    // Not valid for file input
"-live", "1"                    // Not valid for file input

// AFTER (removed invalid options)
// These options removed entirely
```

### 3. Simplified Configuration
```typescript
// BEFORE (overly complex)
.outputOptions([
  // 30+ different options including:
  "-x264opts", "no-scenecut:keyint=60:min-keyint=30:8x8dct=1:aq-mode=2:aq-strength=0.8:deblock=0,0:ref=2:bframes=0:weightp=1:subme=6:mixed-refs=1:me=hex:merange=16:trellis=1:psy-rd=1.0,0.0:rc-lookahead=30:me_range=16:qcomp=0.6:qmin=10:qmax=51:qdiff=4:bf=0:8x8dct=1:me=hex:subme=6:me_range=16:trellis=1:psy-rd=1.0,0.0:aq-mode=2:aq-strength=0.8:deblock=0,0:ref=2:bframes=0:weightp=1:subme=6:mixed-refs=1:me=hex:merange=16:trellis=1:psy-rd=1.0,0.0:rc-lookahead=30",
  // ... many more complex options
])

// AFTER (simplified and reliable)
.outputOptions([
  // === BASIC VIDEO SETTINGS ===
  "-preset", "veryfast",           // Fast encoding
  "-crf", "23",                    // Good quality
  "-pix_fmt", "yuv420p",           // Standard pixel format
  
  // === RESOLUTION AND FRAME RATE ===
  "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
  "-r", "30",                      // 30fps output
  "-g", "60",                      // Keyframe every 2 seconds
  
  // === AUDIO SETTINGS ===
  "-ar", "48000",                  // Sample rate
  "-ac", "2",                      // Stereo
  "-b:a", "128k",                  // Audio bitrate
  
  // === HLS SETTINGS ===
  "-hls_time", "2",                // 2-second segments
  "-hls_list_size", "0",           // Keep all segments
  "-hls_flags", "independent_segments",
  "-hls_segment_filename", join(streamPath, "segment_%d.ts"),
  
  // === LIVE STREAMING ===
  "-tune", "zerolatency",          // Low latency
  "-fps_mode", "cfr",             // Constant frame rate
  
  // === COMPATIBILITY ===
  "-f", "hls"                      // HLS format
])
```

## Key Improvements

### 1. **Modern FFmpeg Compatibility**
- Replaced deprecated `-vsync` with `-fps_mode`
- Removed options that don't work with file inputs
- Ensured compatibility with current FFmpeg versions

### 2. **Simplified Configuration**
- Reduced from 30+ options to essential ones
- Removed conflicting and redundant options
- Focused on core functionality for live streaming

### 3. **Better Error Handling**
- Cleaner FFmpeg command line
- Fewer potential points of failure
- More reliable processing

### 4. **Optimized for Live Streaming**
- `-tune zerolatency` for low latency
- `-preset veryfast` for real-time encoding
- `-fps_mode cfr` for consistent frame rate

## Expected Results

### Before Fix:
```
❌ FFmpeg error: ffmpeg exited with code 8: -vsync is deprecated. Use -fps_mode
Option reconnect not found.
Error opening input file temp.webm.
Error opening input files: Option not found
```

### After Fix:
```
🎬 FFmpeg started with command: ffmpeg -i temp.webm -preset veryfast -crf 23 ...
📡 FFmpeg is now processing video input stream
📋 HLS manifest updated, validating...
✅ Manifest has 3 segments
```

## Configuration Details

### Input Options (Simplified)
```typescript
.inputOptions([
  "-fflags", "+genpts+igndts",    // Generate timestamps
  "-avoid_negative_ts", "make_zero", // Handle negative timestamps
  "-analyzeduration", "50M",      // Analysis duration
  "-probesize", "100M",           // Probe size
  "-f", "webm",                   // Force WebM format
  "-thread_queue_size", "1024"    // Thread queue size
])
```

### Output Options (Essential Only)
```typescript
.outputOptions([
  // Video: Fast encoding with good quality
  "-preset", "veryfast",
  "-crf", "23",
  "-pix_fmt", "yuv420p",
  
  // Resolution: Scale to 1080p
  "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
  "-r", "30",
  "-g", "60",
  
  // Audio: Standard settings
  "-ar", "48000",
  "-ac", "2",
  "-b:a", "128k",
  
  // HLS: Live streaming optimized
  "-hls_time", "2",
  "-hls_list_size", "0",
  "-hls_flags", "independent_segments",
  "-hls_segment_filename", "segment_%d.ts",
  
  // Live: Low latency
  "-tune", "zerolatency",
  "-fps_mode", "cfr",
  
  // Format
  "-f", "hls"
])
```

## Benefits
- ✅ Compatible with modern FFmpeg versions
- ✅ Cleaner, more reliable configuration
- ✅ Better error handling
- ✅ Optimized for live streaming
- ✅ Reduced complexity and maintenance
- ✅ Faster processing with essential options only
