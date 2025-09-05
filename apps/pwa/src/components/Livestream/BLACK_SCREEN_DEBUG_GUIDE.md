# 🖥️ Black Screen Debug Guide

This guide helps you debug why viewers see a black screen while the host can see their screen share.

## 🔍 **Common Causes & Solutions**

### **1. WebSocket Video Data Not Being Sent**

**Symptoms:**
- Host sees screen share
- Viewers see black screen
- No video chunks in backend logs

**Debug Steps:**
1. Open browser dev tools (F12)
2. Go to Console tab
3. Look for these logs:
   - `📡 MediaRecorder data available: X bytes`
   - `📡 Sending video chunk: X bytes to stream: streamId`
   - `✅ Video chunk sent to backend for stream: streamId`

**If missing:**
- Check if MediaRecorder is starting
- Check if screen sharing permissions are granted
- Check if WebSocket is connected

**Solution:**
```typescript
// Ensure MediaRecorder is properly configured
const mediaRecorder = new MediaRecorder(mediaStream, {
  mimeType: 'video/webm;codecs=vp9', // or vp8
  videoBitsPerSecond: 2500000
});
```

### **2. FFmpeg Not Processing Video Data**

**Symptoms:**
- Video chunks are being sent
- No HLS segments generated
- Backend logs show "Error processing stream data"

**Debug Steps:**
1. Check backend logs for FFmpeg errors
2. Verify FFmpeg is installed and working
3. Check if input stream is receiving data

**Solution:**
```bash
# Check if FFmpeg is working
ffmpeg -version

# Test FFmpeg with a simple video
ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 -f hls output.m3u8
```

### **3. HLS Segments Not Being Generated**

**Symptoms:**
- FFmpeg is running
- No .ts files in livestreams directory
- Manifest file is empty or basic

**Debug Steps:**
1. Check `/livestream/{streamId}/stream.m3u8` endpoint
2. Look for .ts files in backend livestreams directory
3. Check FFmpeg output for errors

**Solution:**
```typescript
// Ensure proper FFmpeg configuration
const ffmpegCommand = ffmpeg()
  .input(inputStream)
  .inputFormat("webm")
  .format("hls")
  .videoCodec("libx264")
  .audioCodec("aac")
  .outputOptions([
    "-preset", "ultrafast",
    "-crf", "28",
    "-hls_time", "2",
    "-hls_list_size", "0",
    "-hls_flags", "delete_segments+append_list"
  ]);
```

### **4. Video Format/Codec Issues**

**Symptoms:**
- MediaRecorder starts but no data
- Browser compatibility issues
- "No supported video format found" error

**Debug Steps:**
1. Check browser support for video formats
2. Test different MIME types
3. Check MediaRecorder state

**Solution:**
```typescript
// Test supported formats
const supportedTypes = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8', 
  'video/webm',
  'video/mp4;codecs=h264'
];

for (const type of supportedTypes) {
  if (MediaRecorder.isTypeSupported(type)) {
    console.log('✅ Supported:', type);
  } else {
    console.log('❌ Not supported:', type);
  }
}
```

### **5. MediaRecorder Configuration Problems**

**Symptoms:**
- MediaRecorder starts but stops immediately
- No data available events
- Permission errors

**Debug Steps:**
1. Check screen sharing permissions
2. Verify MediaStream is valid
3. Check MediaRecorder state

**Solution:**
```typescript
// Proper MediaRecorder setup
const mediaRecorder = new MediaRecorder(mediaStream, {
  mimeType: selectedMimeType,
  videoBitsPerSecond: 2500000
});

mediaRecorder.ondataavailable = (event) => {
  if (event.data && event.data.size > 0) {
    console.log('Data available:', event.data.size, 'bytes');
    // Send to WebSocket
  }
};

mediaRecorder.onerror = (event) => {
  console.error('MediaRecorder error:', event);
};

mediaRecorder.start(1000); // 1 second intervals
```

## 🛠️ **Debugging Tools**

### **1. StreamDebugger Component**

Use the `StreamDebugger` component to test the entire pipeline:

```typescript
import { StreamDebugger } from './components/Livestream';

<StreamDebugger streamId="your-stream-id" isHost={true} />
```

**Features:**
- Real-time connection status
- Video preview
- MediaRecorder testing
- WebSocket data monitoring
- HLS manifest checking

### **2. Browser Dev Tools**

**Console Logs to Look For:**
```
✅ WebSocket connected with stream key: streamId
🎬 MediaRecorder started for stream: streamId
📡 MediaRecorder data available: X bytes for stream: streamId
📡 Sending video chunk: X bytes to stream: streamId
✅ Video chunk sent to backend for stream: streamId
```

**Network Tab:**
- Check WebSocket connection status
- Look for `stream-data` events
- Verify data is being sent

### **3. Backend Logs**

**Look for these logs:**
```
🎬 Starting stream: streamId
✅ FFmpeg setup complete for: streamId
📡 Processing chunk: X bytes for streamId
✅ Chunk sent to FFmpeg: X bytes
🎯 HLS segments found: X for streamId
```

## 🔧 **Quick Fixes**

### **1. Restart Everything**
```bash
# Stop backend
# Restart backend
# Clear browser cache
# Refresh page
```

### **2. Check Permissions**
- Ensure screen sharing is allowed
- Check microphone permissions
- Verify camera access

### **3. Test with Camera First**
- Start with camera instead of screen share
- If camera works, issue is with screen sharing
- If camera doesn't work, issue is with MediaRecorder

### **4. Check Network**
- Ensure WebSocket connection is stable
- Check for firewall issues
- Verify backend is accessible

## 📊 **Step-by-Step Debugging**

1. **Open StreamDebugger**
2. **Test WebSocket connection**
3. **Setup screen sharing**
4. **Start recording**
5. **Check if chunks are being sent**
6. **Check backend logs**
7. **Check HLS manifest**
8. **Verify FFmpeg is processing**

## 🚨 **Emergency Fixes**

### **If Nothing Works:**

1. **Use Camera Instead:**
   ```typescript
   const stream = await navigator.mediaDevices.getUserMedia({
     video: true,
     audio: true
   });
   ```

2. **Check Browser Compatibility:**
   - Try Chrome/Chromium
   - Check if WebRTC is enabled
   - Verify HTTPS (required for screen sharing)

3. **Fallback to External URL:**
   - Use external streaming service
   - Set streaming URL in NIP-53 event
   - Bypass internal streaming

## 📞 **Getting Help**

If you're still having issues:

1. **Collect Debug Info:**
   - Browser console logs
   - Backend logs
   - Network tab data
   - StreamDebugger output

2. **Test Environment:**
   - Browser version
   - Operating system
   - Network conditions
   - Backend configuration

3. **Reproduction Steps:**
   - Exact steps to reproduce
   - Expected vs actual behavior
   - Error messages
   - Screenshots/videos
