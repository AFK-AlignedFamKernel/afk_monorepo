# Live Stream Start Guide

## Overview
This guide explains how to properly start a live stream so that viewers can watch it.

## Current Issue
The HLS test pages are showing `levelEmptyError` because:
- ✅ Backend server is running
- ✅ HLS manifest exists
- ❌ **No FFmpeg process running** (no video segments)
- ❌ **No active stream** (no video content being fed)

## How to Start a Live Stream

### 1. **Host Side (Streamer)**
The host needs to start broadcasting using the HostStudio component:

```typescript
// In HostStudio.tsx or similar component
const startStream = async () => {
  // 1. Get screen share permission
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true  // IMPORTANT: Include audio
  });
  
  // 2. Send stream to backend
  const streamKey = 'd0c914f7d474fd3f3cdbb1b50ef434bd';
  await sendStreamToBackend(stream, streamKey);
};
```

### 2. **Backend Side (Stream Processing)**
The backend needs to:
- Receive the video stream from the host
- Process it with FFmpeg
- Generate HLS segments
- Update the manifest

### 3. **Viewer Side (Watching)**
Viewers can then:
- Load the HLS manifest
- Watch the live stream
- Hear audio (if included)

## Step-by-Step Instructions

### **Step 1: Start the Backend Server**
```bash
cd apps/data-backend
npm run dev
# or
pnpm dev
```

### **Step 2: Start the Frontend (PWA)**
```bash
cd apps/pwa
npm run dev
# or
pnpm dev
```

### **Step 3: Host Starts Broadcasting**
1. Open the PWA app in browser
2. Navigate to HostStudio or streaming page
3. Click "Start Stream" or "Go Live"
4. **IMPORTANT**: When prompted for screen share:
   - Select the screen/window to share
   - ✅ **Check "Share audio"** checkbox
   - Click "Share"

### **Step 4: Verify Stream is Active**
Check that FFmpeg is running:
```bash
ps aux | grep ffmpeg
```

You should see something like:
```
ffmpeg -f webm -i pipe:0 -y -acodec aac -vcodec libx264 -f hls ...
```

### **Step 5: Test Viewer Experience**
1. Open the HLS test page
2. The stream should now work without `levelEmptyError`
3. You should see video and hear audio

## Troubleshooting

### **Issue: levelEmptyError**
**Cause**: No active stream
**Solution**: Start broadcasting from host side

### **Issue: No FFmpeg Process**
**Cause**: Stream not started
**Solution**: Host needs to start screen sharing

### **Issue: No Audio**
**Cause**: Screen share doesn't include audio
**Solution**: Re-share screen with audio enabled

### **Issue: Black Screen**
**Cause**: Video not being processed
**Solution**: Check FFmpeg logs for errors

## Testing the Complete Flow

### **1. Test Stream Creation**
```bash
# Check if stream directory exists
ls -la apps/data-backend/public/livestreams/

# Check if manifest exists
curl http://localhost:5050/livestream/{streamId}/stream.m3u8
```

### **2. Test Stream Activity**
```bash
# Check if FFmpeg is running
ps aux | grep ffmpeg

# Check if segments are being generated
ls -la apps/data-backend/public/livestreams/{streamId}/segment_*.ts
```

### **3. Test HLS Playback**
```bash
# Open test page
open apps/data-backend/src/services/livestream/test-audio-hls.html
```

## Expected Flow

1. **Host starts stream** → FFmpeg process starts
2. **FFmpeg processes video** → Generates segments
3. **Manifest updates** → Includes new segments
4. **Viewers load manifest** → Can play video
5. **HLS.js loads segments** → Video plays successfully

## Common Mistakes

### **Mistake 1: Testing Without Host**
- ❌ Opening HLS test page without host broadcasting
- ✅ Host must be actively streaming

### **Mistake 2: Not Including Audio**
- ❌ Screen sharing without audio
- ✅ Always check "Share audio" option

### **Mistake 3: Wrong Stream ID**
- ❌ Using old/expired stream ID
- ✅ Use the current active stream ID

## Quick Start Commands

```bash
# 1. Start backend
cd apps/data-backend && pnpm dev

# 2. Start frontend (in new terminal)
cd apps/pwa && pnpm dev

# 3. Open host studio
open http://localhost:3000/host-studio

# 4. Start broadcasting (in browser)
# Click "Start Stream" → Share screen with audio

# 5. Test viewer experience
open apps/data-backend/src/services/livestream/test-audio-hls.html
```

## Monitoring

### **Backend Logs**
Watch for:
- `🎬 FFmpeg started with command`
- `🎵 Audio detected`
- `📊 FFmpeg progress`

### **Frontend Logs**
Watch for:
- `✅ HLS manifest parsed successfully`
- `📦 Fragment loaded`
- No `levelEmptyError`

### **Network Tab**
Check:
- Manifest loads successfully
- Segments load successfully
- No 404 errors

## Success Indicators

- ✅ FFmpeg process running
- ✅ Segments being generated
- ✅ Manifest updating with new segments
- ✅ HLS test page shows video
- ✅ Audio plays (if included)
- ✅ No `levelEmptyError`
