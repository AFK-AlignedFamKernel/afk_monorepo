# HLS Streaming Troubleshooting Guide

## Overview
This guide helps diagnose and fix common HLS (HTTP Live Streaming) issues in the livestream system.

## Common Issues and Solutions

### 1. Video Loads But Doesn't Play (Black Screen)

**Symptoms:**
- Video element loads but shows black screen
- Console shows "Video load started" but no playback
- Manifest loads successfully but no video content

**Causes & Solutions:**

#### A. Segment Naming Mismatch
**Problem:** Manifest references segments with different naming than actual files
- Manifest: `segment0.ts`, `segment1.ts`
- Files: `segment_0.ts`, `segment_1.ts`

**Solution:**
```bash
# Check segment naming
ls apps/data-backend/public/livestreams/{streamId}/

# Fix FFmpeg configuration in streamService.ts
"-hls_segment_filename",
join(streamPath, "segment_%d.ts"),  # Use underscores
```

#### B. Missing HLS Headers
**Problem:** Manifest missing required HLS headers

**Solution:**
```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:2
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:EVENT  # For live streams
#EXT-X-DISCONTINUITY        # If needed
```

#### C. CORS Issues
**Problem:** Browser blocks HLS requests due to CORS

**Solution:**
```typescript
// Ensure CORS headers in server
reply.header('Access-Control-Allow-Origin', '*');
reply.header('Access-Control-Allow-Methods', 'GET, HEAD');
reply.header('Access-Control-Allow-Headers', '*');
```

### 2. Manifest Loads But Segments Fail

**Symptoms:**
- Manifest loads successfully
- Individual segment requests return 404 or errors
- Console shows network errors

**Solutions:**

#### A. Check Segment Accessibility
```bash
# Test individual segments
curl -I http://localhost:5050/livestream/{streamId}/segment_0.ts
curl -I http://localhost:5050/livestream/{streamId}/segment_1.ts
```

#### B. Verify Route Registration
```typescript
// Ensure segment route is registered
fastify.get('/livestream/:streamId/:filename', async (request, reply) => {
  const { filename } = request.params;
  if (!filename.endsWith('.ts')) {
    return reply.status(404).send({ error: 'Not found' });
  }
  return serveHLSSegment(request, reply);
});
```

### 3. FFmpeg Not Generating Segments

**Symptoms:**
- No segment files in stream directory
- Manifest exists but no segments listed
- FFmpeg process not running

**Solutions:**

#### A. Check FFmpeg Process
```bash
ps aux | grep ffmpeg
```

#### B. Verify FFmpeg Configuration
```typescript
const ffmpegCommand = ffmpeg()
  .input(inputStream)
  .inputFormat("webm")
  .format("hls")
  .videoCodec("libx264")
  .audioCodec("aac")
  .outputOptions([
    "-hls_time", "2",
    "-hls_list_size", "0",
    "-hls_flags", "delete_segments+append_list",
    "-hls_segment_filename", join(streamPath, "segment_%d.ts"),
    // ... other options
  ]);
```

#### C. Check Input Stream
```typescript
// Ensure input stream is receiving data
inputStream.on('data', (chunk) => {
  console.log('Received data chunk:', chunk.length, 'bytes');
});
```

### 4. Browser Compatibility Issues

**Symptoms:**
- Works in some browsers but not others
- HLS not supported error
- Video element shows "not supported" message

**Solutions:**

#### A. Use HLS.js Library
```html
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script>
if (Hls.isSupported()) {
  const video = document.getElementById('video');
  const hls = new Hls();
  hls.loadSource('http://localhost:5050/livestream/{streamId}/stream.m3u8');
  hls.attachMedia(video);
} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
  video.src = 'http://localhost:5050/livestream/{streamId}/stream.m3u8';
}
</script>
```

#### B. Check Browser Support
```javascript
// Check HLS support
const video = document.createElement('video');
const canPlayHLS = video.canPlayType('application/vnd.apple.mpegurl');
console.log('HLS support:', canPlayHLS);
```

### 5. Live Stream Not Updating

**Symptoms:**
- Video plays but doesn't show new content
- Manifest doesn't update with new segments
- Stream appears "frozen"

**Solutions:**

#### A. Check Manifest Refresh
```javascript
// Monitor manifest changes
setInterval(async () => {
  const response = await fetch(manifestUrl);
  const manifest = await response.text();
  console.log('Manifest updated:', manifest);
}, 2000);
```

#### B. Verify FFmpeg Segment Generation
```bash
# Watch for new segments
watch -n 1 'ls -la apps/data-backend/public/livestreams/{streamId}/segment_*.ts | tail -5'
```

### 6. Audio Issues

**Symptoms:**
- Video plays but no audio
- Audio codec not supported
- Muted by default

**Solutions:**

#### A. Check Audio Codec
```typescript
// Ensure AAC audio codec
.audioCodec("aac")
```

#### B. Check Audio Tracks
```javascript
video.addEventListener('loadedmetadata', () => {
  console.log('Audio tracks:', video.audioTracks?.length || 0);
  console.log('Video tracks:', video.videoTracks?.length || 0);
});
```

## Testing Tools

### 1. Simple HLS Test
```bash
# Open in browser
open apps/data-backend/src/services/livestream/test-simple-hls.html
```

### 2. Live Stream Test
```bash
# Open comprehensive test
open apps/data-backend/src/services/livestream/test-live-hls-streaming.html
```

### 3. Manifest Validation
```bash
# Check manifest format
curl -s http://localhost:5050/livestream/{streamId}/stream.m3u8 | head -20
```

### 4. Segment Testing
```bash
# Test segment accessibility
for i in {0..5}; do
  curl -I http://localhost:5050/livestream/{streamId}/segment_${i}.ts
done
```

## Debug Checklist

- [ ] FFmpeg process is running
- [ ] Input stream is receiving data
- [ ] Segment files are being generated
- [ ] Manifest is updating with new segments
- [ ] CORS headers are set correctly
- [ ] Segment naming matches manifest
- [ ] Browser supports HLS (or HLS.js is loaded)
- [ ] Video element has correct source
- [ ] No JavaScript errors in console
- [ ] Network requests are successful

## Common Error Messages

### "DEMUXER_ERROR_DETECTED_HLS"
- **Cause:** HLS manifest format issue or missing segments
- **Solution:** Check manifest format and segment accessibility

### "MEDIA_ERR_SRC_NOT_SUPPORTED"
- **Cause:** Browser doesn't support HLS or URL is incorrect
- **Solution:** Use HLS.js library or check URL

### "MEDIA_ERR_NETWORK"
- **Cause:** Network error or server not responding
- **Solution:** Check server status and network connectivity

### "MEDIA_ERR_DECODE"
- **Cause:** Video/audio codec not supported
- **Solution:** Use supported codecs (H.264 video, AAC audio)

## Performance Optimization

### 1. Segment Size
```typescript
// Smaller segments for lower latency
"-hls_time", "2",  // 2 seconds per segment
```

### 2. Encoding Settings
```typescript
// Optimize for live streaming
"-preset", "ultrafast",
"-crf", "28",
"-tune", "zerolatency",
```

### 3. Manifest Size
```typescript
// Keep manifest small for live streams
"-hls_list_size", "0",  // Keep all segments
```

## Monitoring

### 1. Log Analysis
```javascript
// Monitor video events
video.addEventListener('error', (e) => {
  console.error('Video error:', e.target.error);
});
```

### 2. Network Monitoring
```javascript
// Monitor network state
video.addEventListener('waiting', () => {
  console.log('Video waiting for data');
});
```

### 3. Buffer Monitoring
```javascript
// Monitor buffering
video.addEventListener('progress', () => {
  if (video.buffered.length > 0) {
    const buffered = video.buffered.end(video.buffered.length - 1);
    const duration = video.duration;
    const percent = (buffered / duration * 100).toFixed(1);
    console.log(`Buffered: ${percent}%`);
  }
});
```

## Quick Fixes

1. **Restart FFmpeg process** if segments stop generating
2. **Clear browser cache** if manifest doesn't update
3. **Check CORS headers** if requests are blocked
4. **Verify segment naming** if manifest loads but video doesn't play
5. **Use HLS.js** for better browser compatibility
6. **Check network connectivity** if segments fail to load
7. **Monitor console logs** for specific error messages
8. **Test with different browsers** to isolate issues
