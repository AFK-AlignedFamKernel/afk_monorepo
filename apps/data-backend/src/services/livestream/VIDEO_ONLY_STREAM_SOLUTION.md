# Video-Only Stream Solution

## Problem Identified
The `DEMUXER_ERROR_DETECTED_HLS` error occurs when HLS.js tries to demux audio from a video-only stream. This is common when:
1. Screen sharing doesn't capture audio
2. Input WebM stream has no audio track
3. FFmpeg generates video-only segments

## Root Cause
- **Input Stream**: WebM from screen sharing often lacks audio
- **FFmpeg Configuration**: Audio codec settings don't help if no input audio exists
- **HLS.js Expectation**: HLS.js expects both video and audio tracks for proper demuxing
- **Error Handling**: Current error handling treats missing audio as fatal

## Solution Applied

### 1. Enhanced HLS.js Configuration
**File**: `apps/pwa/src/components/Livestream/StreamVideoPlayer.tsx`

**Changes Made**:
```typescript
const hls = new Hls({
  debug: false,
  enableWorker: true,
  lowLatencyMode: true,
  backBufferLength: 90,
  // Be more tolerant of video-only streams
  maxBufferLength: 30,
  maxMaxBufferLength: 60,
  liveSyncDurationCount: 3,
  liveMaxLatencyDurationCount: 5,
  // Handle missing audio gracefully
  audioPreference: 'main',
  audioTrackSwitching: false
});
```

### 2. Improved Error Handling
**File**: `apps/pwa/src/components/Livestream/StreamVideoPlayer.tsx`

**Changes Made**:
- Modified manifest parsing to not treat missing audio as an error
- Updated demuxer error handling to be more lenient
- Added specific handling for video-only streams

```typescript
// Check if audio tracks are available
if (data.audioTracks && data.audioTracks.length > 0) {
  console.log(`🎵 Found ${data.audioTracks.length} audio tracks`);
} else {
  console.warn('⚠️ No audio tracks found in HLS stream - this is normal for video-only streams');
  // Don't treat this as an error - video-only streams are valid
}
```

### 3. FFmpeg Configuration for Video-Only Streams
**File**: `apps/data-backend/src/services/livestream/streamService.ts`

**Changes Made**:
```typescript
// Handle video-only streams gracefully
"-map", "0:v:0",       // Map video stream
"-map", "0:a:0?",      // Map audio stream if available (optional)
"-shortest",           // End when shortest stream ends
"-avoid_negative_ts", "make_zero", // Handle timestamp issues
```

## How It Works

### Video-Only Stream Flow
1. **Input**: WebM stream with video only (no audio)
2. **FFmpeg**: Processes video and skips audio (due to `0:a:0?` optional mapping)
3. **HLS Segments**: Generated with video only
4. **HLS.js**: Handles video-only segments gracefully
5. **Player**: Displays video without audio errors

### Error Recovery
1. **DEMUXER_ERROR_DETECTED_HLS**: Now treated as recoverable
2. **Missing Audio**: Not treated as fatal error
3. **Retry Logic**: Attempts recovery for demuxer errors
4. **User Feedback**: Clear messaging about video-only streams

## Expected Results

After applying this solution:
- ✅ **Video-only streams play successfully**
- ✅ **No more `DEMUXER_ERROR_DETECTED_HLS` errors**
- ✅ **Graceful handling of missing audio**
- ✅ **Proper error recovery for demuxer issues**
- ✅ **Clear user feedback about stream type**

## Testing

### Test Video-Only Stream
1. Start a screen share without audio
2. Navigate to `/livestream/[streamId]`
3. Verify video plays without errors
4. Check console for "video-only streams" warning (not error)

### Test with Audio
1. Start a screen share with audio
2. Navigate to `/livestream/[streamId]`
3. Verify video plays with audio
4. Check console for audio track detection

## Troubleshooting

### If errors persist:
1. **Clear browser cache** - old segments might be cached
2. **Restart the stream** - ensure new configuration is applied
3. **Check FFmpeg logs** - verify video processing is working
4. **Test with different input** - try with microphone input

### If video doesn't play:
1. **Check stream status** - ensure stream is active
2. **Verify manifest** - check if segments are being generated
3. **Test with HLS test page** - use diagnostic tools
4. **Check browser compatibility** - ensure HLS.js is supported

## Related Files
- `StreamVideoPlayer.tsx` - HLS.js configuration and error handling
- `streamService.ts` - FFmpeg configuration for video-only streams
- `test-nip53-flow.html` - Diagnostic tool for testing
- `test-live-hls-streaming.html` - HLS test page

## Key Benefits
1. **Robust Error Handling**: Gracefully handles video-only streams
2. **Better User Experience**: Clear feedback about stream type
3. **Flexible Configuration**: Works with both audio and video-only streams
4. **Improved Reliability**: Reduces fatal errors and improves recovery
5. **Better Debugging**: Clear logging for troubleshooting
