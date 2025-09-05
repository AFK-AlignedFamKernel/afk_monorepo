# Simplified Streaming Process

This document explains the streamlined livestreaming implementation that focuses on the core WebSocket + FFmpeg + HLS pipeline.

## Overview

The streaming process has been simplified to follow a clear, linear flow:

```
Host goes live → WebSocket connection → Video data flows → FFmpeg processes → HLS segments → Viewers can watch
```

## Step-by-Step Process

### 1. **Host Goes Live**
- Host opens HostStudio component
- WebSocket connection is established automatically
- Host clicks "Go Live" button

### 2. **WebSocket Connection**
- Frontend connects to backend via Socket.IO
- Connection is established with stream ID
- Backend acknowledges connection

### 3. **Stream Start**
- Host calls `startStream(streamId, userId)`
- Backend creates FFmpeg command and input stream
- Stream is added to `activeStreams` map
- Backend emits `stream-started` event

### 4. **MediaRecorder Setup**
- Frontend requests camera access
- MediaRecorder is configured with supported MIME type
- MediaRecorder starts recording with 1-second intervals

### 5. **Video Data Flow**
- MediaRecorder generates video chunks every second
- Chunks are sent via WebSocket `stream-data` event
- Backend receives chunks and pushes to FFmpeg input stream

### 6. **FFmpeg Processing**
- FFmpeg receives video data from input stream
- FFmpeg processes data and generates HLS segments (.ts files)
- HLS manifest (stream.m3u8) is updated with new segments

### 7. **HLS Delivery**
- Viewers can access stream at `/livestream/{streamId}/stream.m3u8`
- HLS player loads manifest and segments
- Live video playback begins

## Key Components

### Backend (`streamHandler.ts`)
- **`handleStartStream`**: Sets up FFmpeg and stream data
- **`handleStreamData`**: Processes incoming video chunks
- **`handleEndStream`**: Cleans up stream resources
- **`handleDisconnect`**: Handles socket disconnections

### Frontend (`LivestreamWebSocketContext.tsx`)
- **`connect`**: Establishes WebSocket connection
- **`startStream`**: Initiates streaming on backend
- **`setupMediaStream`**: Configures MediaRecorder
- **`sendStreamData`**: Sends video chunks to backend

### HostStudio Component
- **Camera capture**: Gets user media stream
- **Go Live button**: Triggers streaming process
- **Status display**: Shows connection and streaming state

## Testing

Use the test script to verify the streaming pipeline:

```bash
cd apps/data-backend/src/services/livestream
node test-streaming.js
```

This will test:
1. WebSocket connection
2. Stream start
3. Video data transmission
4. HLS file generation
5. HTTP endpoint accessibility

## Troubleshooting

### Common Issues

1. **No video segments generated**
   - Check if FFmpeg is running
   - Verify input stream is receiving data
   - Check backend logs for errors

2. **WebSocket connection fails**
   - Verify backend is running on correct port
   - Check CORS settings
   - Verify Socket.IO configuration

3. **MediaRecorder not generating data**
   - Check camera permissions
   - Verify MediaStream is active
   - Check MIME type support

### Debug Logs

The simplified version includes focused logging:
- `🔌` WebSocket connection events
- `🎬` Stream start/stop events
- `📡` Video data transmission
- `🎯` HLS segment generation
- `✅` Success confirmations
- `❌` Error details

## Benefits of Simplified Approach

1. **Clearer flow**: Linear process easier to debug
2. **Reduced complexity**: Fewer moving parts
3. **Better error handling**: Focused error detection
4. **Easier testing**: Step-by-step verification
5. **Maintainable code**: Simpler logic paths

## Next Steps

1. **Test the simplified pipeline** using the test script
2. **Verify HLS generation** in the backend
3. **Check frontend streaming** in HostStudio
4. **Validate viewer experience** with StreamVideoPlayer
5. **Integrate with NIP-53** for Nostr compatibility
