# Livestream WebSocket Integration

This document explains how the new WebSocket-based livestream system works and how to use it.

## Overview

The livestream system now uses WebSocket connections to handle real-time video streaming between the frontend and backend. This replaces the previous approach that only updated database status without actual video streaming.

## Components

### 1. LivestreamWebSocketContext
- **Location**: `src/contexts/LivestreamWebSocketContext.tsx`
- **Purpose**: Manages WebSocket connections and stream state
- **Features**:
  - Automatic connection management
  - Stream start/stop handling
  - Viewer count updates
  - Error handling

### 2. useMediaStream Hook
- **Location**: `src/hooks/useMediaStream.ts`
- **Purpose**: Manages camera and screen sharing streams
- **Features**:
  - Camera start/stop
  - Microphone toggle
  - Screen sharing
  - Stream combination

### 3. useVideoElement Hook
- **Location**: `src/hooks/useVideoElement.ts`
- **Purpose**: Manages video element state and controls
- **Features**:
  - Play/pause controls
  - Volume management
  - Time seeking
  - Auto-sync with streams

## How It Works

### Stream Flow
1. **User clicks "Go Live"**
2. **WebSocket connection** is established to the backend
3. **Media stream** is captured from camera/screen
4. **Video data** is sent via WebSocket to backend
5. **Backend processes** the stream and creates HLS segments
6. **Viewers can watch** the live stream via HLS URL

### Backend Requirements
The backend needs to:
- Accept WebSocket connections
- Handle `start-stream` events
- Process incoming video chunks
- Generate HLS manifest and segments
- Serve the stream via HTTP endpoints (e.g., `/livestream/{streamId}/stream.m3u8`)
- Handle both WebSocket streaming and HTTP HLS serving from the same server

## Usage Example

### In a Component
```tsx
import { useLivestreamWebSocket } from '@/contexts/LivestreamWebSocketContext';
import { useMediaStream } from '@/hooks/useMediaStream';

function MyLivestreamComponent() {
  const { connect, startStream, isConnected } = useLivestreamWebSocket();
  const { startCamera, stream } = useMediaStream();

  const handleGoLive = async () => {
    // Start camera
    await startCamera();
    
    // Connect to WebSocket
    connect('stream-123');
    
    // Start streaming
    startStream('stream-123', 'user-456');
  };

  return (
    <div>
      <button onClick={handleGoLive}>Go Live</button>
      <video ref={videoRef} autoPlay />
      {isConnected && <span>Connected to stream</span>}
    </div>
  );
}
```

### Environment Variables
```bash
# Backend URL (handles both WebSocket and HLS streaming)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Optional: CDN URL if you want to serve streams from a CDN later
# NEXT_PUBLIC_CLOUDFARE_BUCKET_URL=https://your-cdn.com
```

## Integration Steps

### 1. Wrap your app with the context
```tsx
// In your root layout or app component
import { LivestreamWebSocketProvider } from '@/contexts/LivestreamWebSocketContext';

export default function App() {
  return (
    <LivestreamWebSocketProvider>
      {/* Your app components */}
    </LivestreamWebSocketProvider>
  );
}
```

### 2. Use the hooks in your components
```tsx
const { connect, startStream } = useLivestreamWebSocket();
const { startCamera, stream } = useMediaStream();
```

### 3. Handle stream lifecycle
```tsx
// Start stream
await startCamera();
connect(streamId);
startStream(streamId, userId);

// Stop stream
stopStream();
disconnect();
```

## Troubleshooting

### Common Issues

1. **"Socket not connected"**
   - Check if backend is running
   - Verify `NEXT_PUBLIC_BACKEND_URL` is correct
   - Check browser console for connection errors

2. **"No media stream available"**
   - Ensure camera permissions are granted
   - Check if `startCamera()` was called successfully
   - Verify browser supports `getUserMedia`

3. **Stream not showing for viewers**
   - Check if backend is processing video chunks
   - Verify HLS manifest is being generated
   - Check CDN URL configuration

### Debug Mode
Enable debug logging by checking the browser console for:
- WebSocket connection status
- Stream start/stop events
- Media stream state changes
- Error messages

## Backend Integration

The backend should implement these WebSocket events:

- `start-stream`: Initialize stream processing
- `stream-data`: Receive video chunks
- `stop-stream`: End stream processing
- `join-stream`: Viewer joins stream
- `leave-stream`: Viewer leaves stream

## Future Enhancements

- Adaptive bitrate streaming
- Multiple quality levels
- Recording functionality
- Chat integration
- Analytics and metrics
