# Complete Streaming Process Verification Guide

This guide provides step-by-step instructions to verify that the entire streaming pipeline is working correctly, from broadcaster setup to viewer experience.

## Overview

The streaming process follows this flow:
```
Broadcaster → WebSocket → FFmpeg → HLS → NIP-53 → Viewer → Video Player
```

## Prerequisites

1. **Backend running** on `http://localhost:5050`
2. **Frontend running** with HostStudio component
3. **FFmpeg installed** on the backend system
4. **Camera/microphone access** granted in browser

## Testing Steps

### Phase 1: Backend Pipeline Verification

#### Step 1: Test Complete Streaming Pipeline
```bash
cd apps/data-backend/src/services/livestream
node test-complete-streaming.js
```

**Expected Output:**
- ✅ WebSocket connection established
- ✅ Stream started on backend
- ✅ Video data transmitted
- ✅ HLS files generated
- ✅ HTTP endpoints working
- ✅ Viewer simulation successful
- ✅ NIP-53 streaming URL accessible

**What This Tests:**
- Backend WebSocket handling
- FFmpeg setup and processing
- HLS file generation
- HTTP endpoint accessibility

#### Step 2: Test Viewer Connection
```bash
node test-viewer-connection.js
```

**Expected Output:**
- ✅ HLS manifest endpoint accessible
- ✅ Stream status endpoint working
- ✅ WebSocket connection established
- ✅ Viewer can join stream
- ✅ NIP-53 streaming URL format correct

**What This Tests:**
- Viewer access to streams
- HLS manifest delivery
- Stream status information
- WebSocket viewer functionality

### Phase 2: Frontend Broadcaster Testing

#### Step 1: Open HostStudio
1. Navigate to HostStudio component
2. Enter a stream ID (e.g., `test-stream-123`)
3. Allow camera/microphone access when prompted

**Expected Behavior:**
- WebSocket connects automatically
- Status shows "Connected - Ready to go live"
- Camera preview appears in video container

#### Step 2: Test Media Sources
1. **Camera Button**: Click to activate camera
   - Should show camera feed in preview
   - Status should show "Camera: Active"

2. **Screen Share Button**: Click to activate screen sharing
   - Should show screen selection dialog
   - Should display selected screen in preview
   - Status should show "Screen: Active"

3. **Microphone Button**: Click to toggle audio
   - Should mute/unmute microphone
   - Status should show "Microphone: Active/Inactive"

**Expected Behavior:**
- Only one media source active at a time
- Video preview updates accordingly
- Status indicators reflect current state

#### Step 3: Go Live
1. Ensure a media source is active
2. Click "Go Live" button
3. Wait for stream to start

**Expected Behavior:**
- Button shows "Going Live..." during setup
- Status changes to "LIVE - Broadcasting"
- Console shows streaming setup logs
- MediaRecorder starts generating data

**Console Logs to Look For:**
```
🎬 Going live...
✅ Stream started on backend
✅ MediaRecorder setup complete
🎥 Live streaming started!
```

### Phase 3: Frontend Viewer Testing

#### Step 1: Open Stream View
1. Navigate to a stream view (e.g., `/livestream/{streamId}`)
2. Check if video player loads

**Expected Behavior:**
- If stream is live: Video starts playing
- If stream is waiting: Shows "waiting for broadcaster" message
- If stream is offline: Shows appropriate offline message

#### Step 2: Test Stream Status
1. Check the stream status display
2. Look for "LIVE" indicator if broadcasting
3. Check viewer count if available

**Expected Behavior:**
- Status accurately reflects stream state
- Viewer count updates in real-time
- Connection status is visible

### Phase 4: NIP-53 Integration Verification

#### Step 1: Check Streaming URL Format
The streaming URL should follow this format:
```
http://localhost:5050/livestream/{streamId}/stream.m3u8
```

#### Step 2: Verify NIP-53 Event Structure
NIP-53 events should include:
```json
{
  "kind": 30315,
  "tags": [
    ["streaming", "http://localhost:5050/livestream/{streamId}/stream.m3u8"],
    ["status", "live"],
    ["title", "Stream Title"],
    ["summary", "Stream Description"]
  ]
}
```

#### Step 3: Test URL Accessibility
```bash
curl http://localhost:5050/livestream/{streamId}/stream.m3u8
```

**Expected Output:**
- Valid HLS manifest content
- Proper MIME type headers
- No CORS errors

## Troubleshooting

### Common Issues and Solutions

#### Issue: No HLS segments generated
**Symptoms:**
- Backend shows `hasVideoContent: false`
- No `.ts` files in stream directory
- Video player shows "waiting for broadcaster"

**Solutions:**
1. Check if MediaRecorder is generating data in frontend
2. Verify WebSocket connection is established
3. Check FFmpeg logs in backend
4. Ensure video data is being sent via `stream-data` events

#### Issue: WebSocket connection fails
**Symptoms:**
- Frontend shows "WebSocket connection failed"
- Status remains "connecting"

**Solutions:**
1. Verify backend is running on correct port
2. Check CORS settings
3. Verify Socket.IO configuration
4. Check network connectivity

#### Issue: Video player shows errors
**Symptoms:**
- `DEMUXER_ERROR_COULD_NOT_OPEN`
- `DEMUXER_ERROR_DETECTED_HLS`
- Video fails to load

**Solutions:**
1. Check HLS manifest format
2. Verify segments are being generated
3. Check if stream has ended prematurely
4. Verify MIME types are correct

#### Issue: Camera/microphone not working
**Symptoms:**
- No video preview
- Permission denied errors
- MediaRecorder not starting

**Solutions:**
1. Grant camera/microphone permissions
2. Check if device is in use by another application
3. Verify MediaRecorder support
4. Check browser compatibility

## Success Criteria

The streaming process is working correctly when:

1. **Backend Pipeline:**
   - WebSocket connections establish successfully
   - FFmpeg processes video data
   - HLS segments are generated
   - HTTP endpoints return correct content

2. **Frontend Broadcaster:**
   - Camera/screen sharing works
   - MediaRecorder generates data
   - WebSocket sends video chunks
   - Status updates correctly

3. **Frontend Viewer:**
   - HLS manifest loads without errors
   - Video player displays appropriate messages
   - Stream status is accurate
   - Real-time updates work

4. **NIP-53 Integration:**
   - Streaming URLs are accessible
   - Events contain correct streaming information
   - Viewers can access streams via events

## Next Steps

After successful verification:

1. **Test with real video content** (not test chunks)
2. **Verify performance** under different network conditions
3. **Test multiple concurrent streams**
4. **Validate error handling** and edge cases
5. **Test viewer experience** on different devices/browsers

## Support

If you encounter issues during verification:

1. Check the console logs for detailed error messages
2. Use the test scripts to isolate specific problems
3. Verify each component individually before testing the full pipeline
4. Check the troubleshooting section for common solutions
