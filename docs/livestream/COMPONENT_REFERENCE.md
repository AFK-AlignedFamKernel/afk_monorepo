# Livestream Component Reference

## Overview

This document provides detailed reference information for all livestream-related components, their props, methods, and usage patterns.

## Frontend Components (PWA)

### LivestreamMain.tsx

**Purpose**: Main orchestrator component for the livestream experience

**Location**: `/apps/pwa/src/components/Livestream/LivestreamMain.tsx`

#### Props
```typescript
interface LivestreamMainProps {
  streamId?: string;           // Initial stream identifier
  isStreamer?: boolean;        // Whether user is a streamer
  className?: string;          // Additional CSS classes
}
```

#### Key Methods
- `handleNavigateToStream(id: string, note?: EventLivestreamNostr | NDKEvent)`: Navigate to stream view
- `handleNavigateToStreamView(id: string, recordingUrl?: string, note?: EventLivestreamNostr | NDKEvent)`: Navigate to stream view as viewer
- `handleNavigateToHostStudio(id: string, note?: NDKEvent)`: Navigate to host studio
- `handleViewEventFromNostr(streamId: string)`: Handle NIP-53 event view action
- `handleRefreshStreamStatus()`: Manually refresh stream status

#### State Management
- `currentView`: Current view state ('studio' | 'stream' | 'chat' | 'host-studio')
- `streamStatus`: Stream availability status ('loading' | 'available' | 'not_started' | 'error')
- `isStreaming`: Whether currently streaming
- `isChatVisible`: Chat panel visibility

#### Key Features
- NIP-53 event integration and URL extraction
- External vs internal URL detection
- Stream status monitoring with retry logic
- View navigation and state management

### StreamVideoPlayer.tsx

**Purpose**: Video player component for streaming and viewing

**Location**: `/apps/pwa/src/components/Livestream/StreamVideoPlayer.tsx`

#### Props
```typescript
interface StreamVideoPlayerProps {
  streamingUrl?: string;                    // HLS stream URL
  recordingUrl?: string;                    // Recording URL for playback
  isStreamer?: boolean;                     // Whether user is streaming
  onStreamStart?: () => void;               // Stream start callback
  onStreamStop?: () => void;                // Stream stop callback
  onStreamError?: (error: string) => void;  // Error callback
  className?: string;                       // Additional CSS classes
  streamId?: string;                        // Stream identifier
  streamStatus?: 'loading' | 'available' | 'not_started' | 'error';
  onRefreshStatus?: () => void;             // Status refresh callback
}
```

#### Key Methods
- `handleTogglePlayPause()`: Toggle video play/pause
- `handleToggleMute()`: Toggle audio mute
- `toggleFullscreen()`: Toggle fullscreen mode
- `handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>)`: Handle volume changes
- `handleSeek(e: React.ChangeEvent<HTMLInputElement>)`: Handle seeking

#### State Management
- `isPlaying`: Video playing state
- `isMuted`: Audio muted state
- `isFullscreen`: Fullscreen state
- `currentTime`: Current playback time
- `duration`: Video duration
- `volume`: Audio volume level
- `isLive`: Live stream indicator
- `viewerCount`: Number of viewers
- `isLoading`: Loading state
- `loadError`: Error message

#### Key Features
- HLS.js integration for adaptive bitrate streaming
- External URL support (YouTube, Twitch, etc.)
- Real-time stream monitoring
- Automatic retry logic for failed streams
- Video controls (play, pause, volume, seek, fullscreen)

### HostStudio.tsx

**Purpose**: Broadcasting interface for stream hosts

**Location**: `/apps/pwa/src/components/Livestream/HostStudio.tsx`

#### Props
```typescript
interface HostStudioProps {
  streamId: string;           // Stream identifier
  onGoLive?: () => void;      // Go live callback
  onBack?: () => void;        // Back navigation callback
}
```

#### Key Methods
- `setupCameraCapture()`: Setup camera media stream
- `setupScreenSharing()`: Setup screen sharing media stream
- `toggleMicrophone()`: Toggle microphone on/off
- `switchToCamera()`: Switch to camera source
- `switchToScreen()`: Switch to screen sharing source
- `handleGoLive()`: Start streaming process
- `handleStopStream()`: Stop streaming process
- `loadHLSStream()`: Load HLS stream for preview

#### State Management
- `isGoingLive`: Going live process state
- `streamStatus`: Connection status ('idle' | 'connecting' | 'connected' | 'streaming' | 'error' | 'loading')
- `error`: Error message
- `cameraEnabled`: Camera active state
- `microphoneEnabled`: Microphone active state
- `screenSharing`: Screen sharing active state
- `currentMediaStream`: Current media stream
- `backendStreamStatus`: Backend stream status
- `liveEventId`: NIP-53 event identifier

#### Key Features
- Camera and screen sharing support
- Microphone controls
- Real-time backend status monitoring
- NIP-53 event lifecycle management
- WebSocket integration for streaming

### LivestreamWebSocketContext.tsx

**Purpose**: WebSocket connection and stream management context

**Location**: `/apps/pwa/src/contexts/LivestreamWebSocketContext.tsx`

#### Context Interface
```typescript
interface LivestreamWebSocketContextType {
  socket: Socket | null;                    // Socket.IO instance
  isConnected: boolean;                     // Connection status
  isStreaming: boolean;                     // Streaming status
  streamKey: string | null;                 // Current stream key
  viewerCount: number;                      // Number of viewers
  connect: (streamKey: string) => void;     // Connect to stream
  disconnect: () => void;                   // Disconnect
  startStream: (streamKey: string, userId: string) => void;
  stopStream: (userId?: string) => void;
  sendStreamData: (chunk: Blob) => void;    // Send video data
  joinStream: (streamKey: string, userId: string) => void;
  leaveStream: () => void;
  setupMediaStream: (mediaStream: MediaStream, streamKeyParam?: string) => void;
  cleanup: () => void;                      // Cleanup resources
}
```

#### Key Methods
- `connect(streamKey: string)`: Establish WebSocket connection
- `disconnect()`: Close WebSocket connection
- `startStream(streamKey: string, userId: string)`: Start streaming
- `stopStream(userId?: string)`: Stop streaming
- `sendStreamData(chunk: Blob)`: Send video data chunks
- `joinStream(streamKey: string, userId: string)`: Join as viewer
- `leaveStream()`: Leave stream
- `setupMediaStream(mediaStream: MediaStream, streamKeyParam?: string)`: Setup MediaRecorder
- `cleanup()`: Cleanup all resources

#### State Management
- `socket`: Socket.IO instance
- `isConnected`: WebSocket connection status
- `isStreaming`: Active streaming status
- `streamKey`: Current stream identifier
- `viewerCount`: Real-time viewer count

#### Key Features
- Automatic reconnection logic
- MediaRecorder with WebM encoding
- Chunk-based data transmission
- Event emission for component communication
- Resource cleanup management

### LiveChat.tsx

**Purpose**: Live chat component for streams

**Location**: `/apps/pwa/src/components/Livestream/LiveChat.tsx`

#### Props
```typescript
interface LiveChatProps {
  streamId: string;           // Stream identifier
  isVisible: boolean;         // Chat visibility
  onToggle?: () => void;      // Toggle callback
  className?: string;         // Additional CSS classes
}
```

#### Key Features
- Real-time chat messages
- Message history
- User presence indicators
- Chat moderation tools

### StudioModule.tsx

**Purpose**: Studio interface for stream management

**Location**: `/apps/pwa/src/components/Livestream/StudioModule.tsx`

#### Props
```typescript
interface StudioModuleProps {
  onNavigateToStream: (id: string, note?: EventLivestreamNostr | NDKEvent) => void;
  onNavigateToStreamView: (id: string, recordingUrl?: string, note?: EventLivestreamNostr | NDKEvent) => void;
  onNavigateToRecordView: (id: string, note?: NDKEvent) => void;
  onNavigateToHostStudio: (id: string, note?: NDKEvent) => void;
  onViewEventFromNostr: (streamId: string) => void;
}
```

#### Key Features
- Stream discovery and listing
- NIP-53 event integration
- Navigation to different stream views
- Stream creation and management

## Backend Components (Data Backend)

### WebSocket Handler (socket.ts)

**Purpose**: WebSocket connection and event management

**Location**: `/apps/data-backend/src/services/livestream/socket.ts`

#### Key Functions
- `setupWebSocket(io: Server)`: Initialize WebSocket server
- Event handlers for all WebSocket events
- Stream event broadcasting
- Connection management

#### Events Handled
- `start-stream`: Initialize new stream
- `stream-data`: Process video data
- `join-stream`: Add viewer to stream
- `end-stream`: Stop stream
- `leave-stream`: Remove viewer from stream

### Stream Handler (streamHandler.ts)

**Purpose**: Stream lifecycle and data processing

**Location**: `/apps/data-backend/src/services/livestream/streamHandler.ts`

#### Key Functions
- `handleStartStream(socket: Socket, data: StartStreamData)`: Initialize stream
- `handleStreamData(socket: Socket, data: StreamData)`: Process video data
- `handleEndStream(socket: Socket, data: EndStreamData)`: Stop stream
- `handleJoinStream(socket: Socket, data: JoinStreamData)`: Add viewer
- `handleDisconnect(socket: Socket)`: Handle disconnection

#### Data Structures
```typescript
interface StreamData {
  userId: string;
  streamKey: string;
  command: ffmpeg.FfmpegCommand | null;
  inputStream: Readable | null;
  chunkAccumulator: Buffer;
  viewers: Set<string>;
  broadcasterSocketId: string;
  startedAt: Date;
  lastDataReceived: Date;
  status: 'active' | 'broadcasting' | 'error';
  activityMonitor: NodeJS.Timeout;
}
```

### Stream Service (streamService.ts)

**Purpose**: FFmpeg configuration and HLS generation

**Location**: `/apps/data-backend/src/services/livestream/streamService.ts`

#### Key Functions
- `setupStream(data: StreamSetup)`: Initialize FFmpeg stream
- `createQualityVariants(streamPath: string, data: StreamSetup)`: Create adaptive bitrate variants
- `endHLSManifest(streamKey: string)`: Finalize HLS manifest
- `ensureDir(dir: string)`: Ensure directory exists
- `createInputStream()`: Create input stream for FFmpeg

#### Configuration
- **Input Format**: WebM (VP8/VP9 + Vorbis/Opus)
- **Output Format**: HLS (H.264 + AAC)
- **Resolutions**: 1080p, 720p, 480p, 360p
- **Bitrates**: 2500k, 1500k, 800k
- **Segment Duration**: 2 seconds

### Fastify Endpoints (fastifyEndpoints.ts)

**Purpose**: HTTP API for stream access and management

**Location**: `/apps/data-backend/src/services/livestream/fastifyEndpoints.ts`

#### Key Functions
- `serveHLSManifest(request, reply)`: Serve HLS manifest
- `serveHLSSegment(request, reply)`: Serve video segments
- `getStreamStatus(request, reply)`: Get stream status
- `listStreams(request, reply)`: List active streams
- `startStream(request, reply)`: Start Cloudinary stream
- `stopStream(request, reply)`: Stop Cloudinary stream
- `healthCheck(request, reply)`: System health check

### Cloudinary Service (cloudinaryService.ts)

**Purpose**: Cloudinary integration for professional streaming

**Location**: `/apps/data-backend/src/services/livestream/cloudinaryService.ts`

#### Key Functions
- `createStream(data: CreateStreamData)`: Create new stream
- `startStream(streamId: string)`: Start stream
- `stopStream(streamId: string)`: Stop stream
- `getStream(streamId: string)`: Get stream info
- `getStreamStatus(streamId: string)`: Get stream status
- `listStreams()`: List all streams

## Hooks and Utilities

### useVideoElement Hook

**Purpose**: Video element state management

**Location**: `/apps/pwa/src/hooks/useVideoElement.ts`

#### Interface
```typescript
interface UseVideoElementReturn {
  videoRef: RefObject<HTMLVideoElement>;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (time: number) => void;
}
```

### useMediaStream Hook

**Purpose**: Media stream management

**Location**: `/apps/pwa/src/hooks/useMediaStream.ts`

#### Interface
```typescript
interface UseMediaStreamReturn {
  mediaStream: MediaStream | null;
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  isScreenSharing: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  startScreenSharing: () => Promise<void>;
  stopScreenSharing: () => void;
  toggleMicrophone: () => void;
  switchToCamera: () => Promise<void>;
  switchToScreen: () => Promise<void>;
}
```

## Styling

### SCSS Modules

**Location**: `/apps/pwa/src/components/Livestream/styles.module.scss`

#### Key Classes
- `.livestreamMain`: Main container
- `.streamView`: Stream view container
- `.videoContainer`: Video player container
- `.controls`: Video controls
- `.hostStudio`: Host studio interface
- `.liveIndicator`: Live stream indicator
- `.statusOverlay`: Status overlay
- `.errorOverlay`: Error display

## State Management

### Livestream Store

**Location**: `/apps/pwa/src/store/livestream.ts`

#### State
```typescript
interface LivestreamState {
  noteEvent: EventLivestreamNostr | null;
  currentStreamId: string | null;
  setNoteEvent: (event: EventLivestreamNostr | null) => void;
  setCurrentStreamId: (id: string | null) => void;
}
```

### UI Store Integration

**Location**: `/apps/pwa/src/store/uiStore.ts`

#### Integration
- Toast notifications for user feedback
- Modal management for stream creation
- Error state management
- Loading state management

## Error Handling

### Frontend Error Handling
- Stream loading failures with retry logic
- WebSocket connection errors
- MediaRecorder errors
- HLS playback errors
- User permission errors

### Backend Error Handling
- FFmpeg process errors
- File system errors
- WebSocket disconnection handling
- Stream timeout management
- Cloudinary API errors

## Performance Considerations

### Frontend Optimization
- Lazy loading of video components
- Efficient WebSocket data handling
- HLS.js configuration for low latency
- Memory management for MediaRecorder
- Debounced status updates

### Backend Optimization
- Chunk accumulation for efficient processing
- FFmpeg preset optimization (veryfast)
- File system monitoring with debouncing
- Automatic cleanup of temporary files
- Connection pooling

## Testing

### Test Files
- `test-websocket-connection-simple.js`
- `test-websocket-streaming-state.js`
- `test-viewer-connection.js`
- `test-stream-status-detection.js`
- `test-complete-streaming.js`

### Test HTML Files
- `test-live-hls-streaming.html`
- `test-hls-error-diagnosis.html`
- `test-stream-status.html`
- `test-simple-hls.html`
