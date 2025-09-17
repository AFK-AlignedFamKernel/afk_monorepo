# Livestream API Reference

## Overview

This document provides comprehensive API reference for the AFK livestream system, covering both WebSocket events and HTTP endpoints.

## WebSocket API

### Connection

**Endpoint**: `ws://localhost:5050` (or configured backend URL)

**Authentication**: None required (public streams)

**Query Parameters**:
- `streamKey`: Stream identifier for connection context

### Events

#### Client → Server Events

##### `start-stream`
Initialize a new stream for broadcasting.

**Payload**:
```typescript
{
  userId: string;      // User identifier
  streamKey: string;   // Unique stream identifier
}
```

**Response Events**:
- `stream-started`: Stream successfully initialized
- `stream-error`: Stream initialization failed

**Example**:
```javascript
socket.emit('start-stream', {
  userId: 'user123',
  streamKey: 'stream456'
});
```

##### `stream-data`
Send video data chunks to the stream.

**Payload**:
```typescript
{
  streamKey: string;   // Stream identifier
  chunk: Buffer;       // Binary video data (WebM format)
}
```

**Frequency**: ~1 second intervals
**Data Format**: WebM chunks (VP8/VP9 + Vorbis/Opus)

**Example**:
```javascript
socket.emit('stream-data', {
  streamKey: 'stream456',
  chunk: videoChunkBuffer
});
```

##### `join-stream`
Join an existing stream as a viewer.

**Payload**:
```typescript
{
  streamKey: string;   // Stream identifier
  userId: string;      // Viewer identifier
}
```

**Response Events**:
- `stream-joined`: Successfully joined stream
- `stream-error`: Failed to join stream

##### `end-stream`
Stop/end the current stream.

**Payload**:
```typescript
{
  streamKey: string;   // Stream identifier
  userId: string;      // User identifier (must be stream owner)
}
```

**Response Events**:
- `stream-ended`: Stream successfully ended

##### `leave-stream`
Leave a stream as a viewer.

**Payload**:
```typescript
{
  streamKey: string;   // Stream identifier
}
```

#### Server → Client Events

##### `stream-started`
Confirmation that stream has started.

**Payload**:
```typescript
{
  streamKey: string;   // Stream identifier
  status: 'broadcasting' | 'active';
  message?: string;    // Optional status message
}
```

##### `stream-ended`
Notification that stream has ended.

**Payload**:
```typescript
{
  streamKey: string;   // Stream identifier
  reason?: string;     // Optional reason for ending
}
```

##### `stream-error`
Error notification for stream operations.

**Payload**:
```typescript
{
  error: string;       // Error message
  streamKey?: string;  // Stream identifier (if applicable)
  code?: string;       // Error code (if applicable)
}
```

##### `stream-joined`
Confirmation of joining a stream.

**Payload**:
```typescript
{
  streamKey: string;   // Stream identifier
  viewerCount: number; // Current number of viewers
  isLive: boolean;     // Whether stream is currently live
}
```

##### `viewer-joined`
Notification that a new viewer joined.

**Payload**:
```typescript
{
  streamKey: string;   // Stream identifier
  viewerCount: number; // Updated viewer count
}
```

##### `viewer-left`
Notification that a viewer left.

**Payload**:
```typescript
{
  streamKey: string;   // Stream identifier
  viewerCount: number; // Updated viewer count
}
```

##### `stream-segments-updated`
Notification of new HLS segments available.

**Payload**:
```typescript
{
  streamKey: string;   // Stream identifier
  segmentCount: number; // Number of segments available
}
```

## HTTP API

### Base URL
`http://localhost:5050` (or configured backend URL)

### Headers
All requests should include:
```
Content-Type: application/json
```

### Endpoints

#### Stream Manifest

##### `GET /livestream/:streamId/stream.m3u8`
Get HLS manifest for a stream.

**Parameters**:
- `streamId` (path): Stream identifier

**Response**:
- **200 OK**: HLS manifest content
- **404 Not Found**: Stream not found
- **500 Internal Server Error**: Server error

**Headers**:
```
Content-Type: application/vnd.apple.mpegurl
Cache-Control: no-cache
Access-Control-Allow-Origin: *
```

**Example Response**:
```
#EXTM3U
#EXT-X-VERSION:6
#EXT-X-TARGETDURATION:2
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:EVENT
#EXT-X-INDEPENDENT-SEGMENTS

#EXTINF:2.0,
segment_0.ts
#EXTINF:2.0,
segment_1.ts
```

#### Video Segments

##### `GET /livestream/:streamId/segment_:segmentNumber.ts`
Get HLS video segment.

**Parameters**:
- `streamId` (path): Stream identifier
- `segmentNumber` (path): Segment number

**Response**:
- **200 OK**: Video segment content
- **404 Not Found**: Segment not found
- **500 Internal Server Error**: Server error

**Headers**:
```
Content-Type: video/mp2t
Cache-Control: public, max-age=3600
Access-Control-Allow-Origin: *
```

#### Stream Status

##### `GET /livestream/:streamId/status`
Get comprehensive stream status information.

**Parameters**:
- `streamId` (path): Stream identifier

**Response**:
```typescript
{
  streamId: string;
  local: {
    isActive: boolean;
    manifestExists: boolean;
    streamDirExists: boolean;
    streamData?: {
      userId: string;
      startedAt: string;
      viewers: number;
      hasFfmpegCommand: boolean;
      hasInputStream: boolean;
      broadcasterSocketId: string | null;
    };
    files: string[];
    manifestContent: string | null;
  };
  cloudinary?: {
    status: string;
    playbackUrl?: string;
    streamUrl?: string;
  };
  overall: {
    isActive: boolean;
    hasManifest: boolean;
    hasStreamDir: boolean;
    hasVideoContent: boolean;
  };
}
```

**Example Response**:
```json
{
  "streamId": "stream123",
  "local": {
    "isActive": true,
    "manifestExists": true,
    "streamDirExists": true,
    "streamData": {
      "userId": "user123",
      "startedAt": "2024-01-01T12:00:00Z",
      "viewers": 5,
      "hasFfmpegCommand": true,
      "hasInputStream": true,
      "broadcasterSocketId": "socket456"
    },
    "files": ["stream.m3u8", "segment_0.ts", "segment_1.ts"],
    "manifestContent": "#EXTM3U\n#EXT-X-VERSION:6\n..."
  },
  "cloudinary": {
    "status": "active",
    "playbackUrl": "https://res.cloudinary.com/...",
    "streamUrl": "rtmp://..."
  },
  "overall": {
    "isActive": true,
    "hasManifest": true,
    "hasStreamDir": true,
    "hasVideoContent": true
  }
}
```

#### List Active Streams

##### `GET /livestream/active`
Get list of all active streams from Cloudinary.

**Response**:
```typescript
{
  count: number;
  streams: Array<{
    streamId: string;
    userId: string;
    status: string;
    startedAt: string;
    isActive: boolean;
    playbackUrl?: string;
    ingestUrl?: string;
  }>;
}
```

#### Start Stream

##### `POST /livestream/:streamId/start`
Start a new Cloudinary stream.

**Parameters**:
- `streamId` (path): Stream identifier

**Request Body**:
```typescript
{
  userId?: string;           // User identifier
  action: 'start';           // Must be 'start'
  timestamp: number;         // Unix timestamp
  title?: string;            // Stream title
  description?: string;      // Stream description
}
```

**Response**:
```typescript
{
  status: 'created_and_started' | 'already_exists';
  streamId: string;
  message: string;
  playbackUrl?: string;
  ingestUrl?: string;
  timestamp: string;
}
```

**Example Request**:
```json
{
  "userId": "user123",
  "action": "start",
  "timestamp": 1704110400,
  "title": "My Live Stream",
  "description": "Live streaming session"
}
```

#### Stop Stream

##### `POST /livestream/:streamId/stop`
Stop a Cloudinary stream.

**Parameters**:
- `streamId` (path): Stream identifier

**Request Body**:
```typescript
{
  userId?: string;           // User identifier
  action: 'stop';            // Must be 'stop'
  timestamp: number;         // Unix timestamp
}
```

**Response**:
```typescript
{
  status: 'stopped' | 'already_stopped';
  streamId: string;
  message: string;
  timestamp: string;
}
```

#### Health Check

##### `GET /livestream/health`
Get system health information.

**Response**:
```typescript
{
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  streamsDirectory: {
    exists: boolean;
    path: string;
  };
  activeStreams: {
    count: number;
    streams: Array<{
      streamKey: string;
      userId: string;
      startedAt: string;
      viewers: number;
      hasFfmpegCommand: boolean;
      hasInputStream: boolean;
    }>;
  };
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}
```

#### Debug Manifest

##### `GET /livestream/:streamId/debug`
Debug endpoint to inspect manifest content and stream files.

**Parameters**:
- `streamId` (path): Stream identifier

**Response**:
```typescript
{
  streamId: string;
  streamPath: string;
  m3u8Path: string;
  manifestExists: boolean;
  manifestContent: string;
  manifestLines: number;
  segmentsInManifest: number;
  segmentFiles: string[];
  segmentFilesCount: number;
  allFiles: string[];
  timestamp: string;
}
```

## Error Codes

### WebSocket Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `CONNECTION_FAILED` | WebSocket connection failed | Retry connection |
| `STREAM_NOT_FOUND` | Stream identifier not found | Check stream ID |
| `UNAUTHORIZED` | User not authorized for action | Check permissions |
| `STREAM_ALREADY_EXISTS` | Stream already active | Use existing stream |
| `MEDIA_ERROR` | Media capture/processing error | Check media permissions |
| `FFMPEG_ERROR` | FFmpeg processing error | Check stream data |

### HTTP Error Codes

| Status | Description | Action |
|--------|-------------|--------|
| `400 Bad Request` | Invalid request parameters | Check request format |
| `404 Not Found` | Stream or resource not found | Check stream ID |
| `500 Internal Server Error` | Server processing error | Retry or contact support |

## Rate Limits

### WebSocket
- **Connection rate**: 10 connections per minute per IP
- **Data transmission**: 1MB per minute per stream
- **Event rate**: 100 events per minute per connection

### HTTP API
- **General endpoints**: 100 requests per minute per IP
- **Stream endpoints**: 1000 requests per minute per IP
- **Status endpoints**: 60 requests per minute per IP

## CORS Configuration

All endpoints support CORS with the following headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, HEAD, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Authentication

Currently, the livestream API does not require authentication. Future versions may include:
- Nostr signature verification
- JWT token authentication
- API key authentication

## Webhooks

Future webhook support is planned for:
- Stream start/stop events
- Viewer join/leave events
- Error notifications
- Status change events

## SDK Examples

### JavaScript/TypeScript

```typescript
import { io } from 'socket.io-client';

// Connect to stream
const socket = io('ws://localhost:5050', {
  query: { streamKey: 'stream123' }
});

// Start streaming
socket.emit('start-stream', {
  userId: 'user123',
  streamKey: 'stream123'
});

// Send video data
const mediaRecorder = new MediaRecorder(mediaStream);
mediaRecorder.ondataavailable = (event) => {
  socket.emit('stream-data', {
    streamKey: 'stream123',
    chunk: event.data
  });
};

// Listen for events
socket.on('stream-started', (data) => {
  console.log('Stream started:', data);
});

socket.on('viewer-joined', (data) => {
  console.log('Viewer count:', data.viewerCount);
});
```

### Python

```python
import socketio
import requests

# WebSocket connection
sio = socketio.Client()

@sio.event
def connect():
    print('Connected to stream')

@sio.event
def stream_started(data):
    print('Stream started:', data)

# Connect and start stream
sio.connect('http://localhost:5050')
sio.emit('start-stream', {
    'userId': 'user123',
    'streamKey': 'stream123'
})

# HTTP API calls
response = requests.get('http://localhost:5050/livestream/stream123/status')
status = response.json()
print('Stream status:', status)
```

## Testing

### WebSocket Testing
Use the provided test files in `/apps/data-backend/src/services/livestream/`:
- `test-websocket-connection-simple.js`
- `test-websocket-streaming-state.js`
- `test-viewer-connection.js`

### HTTP API Testing
Use curl or Postman to test endpoints:

```bash
# Get stream status
curl -X GET http://localhost:5050/livestream/stream123/status

# Start stream
curl -X POST http://localhost:5050/livestream/stream123/start \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","action":"start","timestamp":1704110400}'

# Get HLS manifest
curl -X GET http://localhost:5050/livestream/stream123/stream.m3u8
```
