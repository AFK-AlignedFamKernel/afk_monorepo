# DEMUXER_ERROR_DETECTED_HLS Fix Guide

## Problem Identified
The `DEMUXER_ERROR_DETECTED_HLS` error occurs because the HLS stream is missing audio tracks. The FFmpeg configuration was not properly encoding audio, resulting in video-only segments that cause demuxer errors in HLS.js.

## Root Cause
- FFmpeg audio codec settings were commented out
- HLS stream only contained video (H.264) without audio (AAC)
- HLS.js expects both video and audio tracks for proper playback

## Solution Applied

### 1. Fixed FFmpeg Configuration
**File**: `apps/data-backend/src/services/livestream/streamService.ts`

**Changes Made**:
```typescript
// ENABLED audio codec settings
"-acodec", "aac",
"-ar", "44100",        // Sample rate
"-ac", "2",            // Stereo audio
"-b:a", "128k",        // Audio bitrate
"-af", "aresample=44100", // Resample audio

// ADDED HLS-specific optimizations
"-hls_flags", "delete_segments+append_list+independent_segments",
"-hls_allow_cache", "0",
"-hls_start_number_source", "datetime",

// ADDED video codec optimizations
"-profile:v", "baseline",
"-level", "3.0",
"-pix_fmt", "yuv420p",
```

### 2. Enhanced Error Handling
**File**: `apps/pwa/src/components/Livestream/StreamVideoPlayer.tsx`

**Changes Made**:
- Added specific handling for `DEMUXER_ERROR_DETECTED_HLS`
- Improved audio track detection in manifest parsing
- Better recovery mechanisms for demuxer errors

## How to Apply the Fix

### Step 1: Restart the Stream
The FFmpeg process needs to be restarted with the new configuration:

1. **Stop the current stream** (if running)
2. **Start a new stream** - the new FFmpeg configuration will be applied
3. **Verify audio tracks** are present in the new segments

### Step 2: Verify the Fix
Check that new segments contain both video and audio:

```bash
# Check a new segment for audio tracks
ffprobe -v quiet -print_format json -show_streams http://localhost:5050/livestream/d0c914f7d474fd3f3cdbb1b50ef434bd/segment_0.ts
```

**Expected Output**:
```json
{
  "streams": [
    {
      "codec_name": "h264",
      "codec_type": "video",
      ...
    },
    {
      "codec_name": "aac",
      "codec_type": "audio",
      ...
    }
  ]
}
```

### Step 3: Test Playback
1. Open the video player
2. The `DEMUXER_ERROR_DETECTED_HLS` error should be resolved
3. Video should play with audio

## Technical Details

### Why This Fixes the Error
- **HLS Standard**: Requires both video and audio tracks for proper demuxing
- **HLS.js Expectation**: Expects audio tracks to be present in the manifest
- **Demuxer Error**: Occurs when trying to demux audio from a video-only stream

### Audio Configuration Explained
- **`-acodec aac`**: Uses AAC codec for audio (HLS standard)
- **`-ar 44100`**: Sets sample rate to 44.1kHz (standard)
- **`-ac 2`**: Stereo audio (2 channels)
- **`-b:a 128k`**: Audio bitrate of 128kbps (good quality)
- **`-af aresample=44100`**: Ensures consistent sample rate

### HLS Optimizations
- **`independent_segments`**: Makes segments independently decodable
- **`hls_allow_cache 0`**: Prevents caching issues
- **`hls_start_number_source datetime`**: Better segment numbering

## Verification Commands

### Check Segment Audio
```bash
ffprobe -v quiet -print_format json -show_streams http://localhost:5050/livestream/d0c914f7d474fd3f3cdbb1b50ef434bd/segment_0.ts | jq '.streams[] | select(.codec_type == "audio")'
```

### Check Manifest
```bash
curl -s http://localhost:5050/livestream/d0c914f7d474fd3f3cdbb1b50ef434bd/stream.m3u8 | head -10
```

### Test HLS Playback
```bash
# Use the test pages
open apps/data-backend/src/services/livestream/test-hls-error-diagnosis.html
```

## Expected Results

After applying this fix:
- ✅ **No more `DEMUXER_ERROR_DETECTED_HLS` errors**
- ✅ **Video plays successfully**
- ✅ **Audio is present and working**
- ✅ **HLS.js can properly demux the stream**
- ✅ **Retry mechanisms work correctly**

## Troubleshooting

### If errors persist:
1. **Clear browser cache** - old segments might be cached
2. **Restart the backend server** - ensure new configuration is loaded
3. **Check FFmpeg logs** - verify audio encoding is working
4. **Test with fresh stream** - create a new stream ID

### If audio is still missing:
1. **Check input source** - ensure screen share includes audio
2. **Verify FFmpeg process** - check if audio encoding is active
3. **Test with different input** - try with microphone input

## Related Files
- `streamService.ts` - FFmpeg configuration
- `StreamVideoPlayer.tsx` - HLS.js error handling
- `test-hls-error-diagnosis.html` - Diagnostic tool
