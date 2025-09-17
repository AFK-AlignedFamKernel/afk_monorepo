# Livestream Technical Architecture

## Overview

The AFK livestream system is a comprehensive real-time streaming solution that combines WebSocket-based real-time communication, FFmpeg video processing, HLS (HTTP Live Streaming) delivery, and NIP-53 Nostr event integration. The system supports both internal streaming (via WebSocket + FFmpeg) and external streaming (via Cloudinary integration).

## System Architecture

### High-Level Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend PWA  │    │  Data Backend   │    │   External      │
│                 │    │                 │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • LivestreamMain│◄──►│ • WebSocket     │    │ • Cloudinary    │
│ • StreamVideo   │    │ • FFmpeg        │    │ • R2 Storage    │
│ • HostStudio    │    │ • HLS Server    │    │ • CDN Delivery  │
│ • WebSocket Ctx │    │ • Stream Handler│    │                 │
│ • Media Streams │    │ • API Endpoints │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Frontend Architecture (PWA)

### Core Components

#### 1. LivestreamMain.tsx
**Purpose**: Main orchestrator component that manages the overall livestream experience
**Key Responsibilities**:
- Manages view state (studio, stream, chat, host-studio)
- Handles NIP-53 event integration and streaming URL extraction
- Coordinates between different livestream components
- Manages stream status and error handling

**Key Features**:
- NIP-53 event parsing for streaming URLs
- External vs internal URL detection
- Stream status monitoring and retry logic
- Navigation between different views

#### 2. StreamVideoPlayer.tsx
**Purpose**: Video player component for both streaming and viewing
**Key Responsibilities**:
- HLS stream playback using HLS.js
- Video controls (play, pause, volume, fullscreen)
- Stream status overlays and error handling
- Auto-joining streams as viewer

**Key Features**:
- HLS.js integration for adaptive bitrate streaming
- External URL support (YouTube, Twitch, etc.)
- Real-time stream monitoring
- Automatic retry logic for failed streams

#### 3. HostStudio.tsx
**Purpose**: Broadcasting interface for stream hosts
**Key Responsibilities**:
- Media stream capture (camera, screen sharing)
- WebSocket connection management
- NIP-53 live event creation and updates
- Real-time stream monitoring

**Key Features**:
- Camera and screen sharing support
- Microphone controls
- Real-time backend status monitoring
- NIP-53 event lifecycle management

#### 4. LivestreamWebSocketContext.tsx
**Purpose**: WebSocket connection and stream management context
**Key Responsibilities**:
- WebSocket connection lifecycle
- Stream start/stop operations
- MediaRecorder setup and data transmission
- Real-time event handling

**Key Features**:
- Automatic reconnection logic
- MediaRecorder with WebM encoding
- Chunk-based data transmission
- Event emission for component communication

### State Management

#### Livestream Store
- `noteEvent`: Current NIP-53 event data
- `currentStreamId`: Active stream identifier
- `setNoteEvent`: Update event data
- `setCurrentStreamId`: Update stream ID

#### UI Store Integration
- Toast notifications for user feedback
- Modal management for stream creation
- Error state management

## Backend Architecture (Data Backend)

### Core Services

#### 1. WebSocket Handler (socket.ts)
**Purpose**: Real-time communication hub
**Key Responsibilities**:
- WebSocket connection management
- Stream event routing
- Real-time data transmission
- Viewer management

**Key Events**:
- `start-stream`: Initialize new stream
- `stream-data`: Video data transmission
- `join-stream`: Viewer connection
- `end-stream`: Stream termination

#### 2. Stream Handler (streamHandler.ts)
**Purpose**: Stream lifecycle and data processing
**Key Responsibilities**:
- FFmpeg process management
- Video data accumulation and processing
- HLS segment generation
- Stream activity monitoring

**Key Features**:
- Chunk accumulation for continuous streaming
- Temporary WebM file management
- Activity monitoring with auto-cleanup
- FFmpeg process lifecycle management

#### 3. Stream Service (streamService.ts)
**Purpose**: FFmpeg configuration and HLS generation
**Key Responsibilities**:
- FFmpeg command setup
- HLS manifest generation
- Quality variant creation
- File system management

**Key Features**:
- Adaptive bitrate streaming (720p, 480p, 360p)
- HLS segment management
- R2 storage integration
- Manifest validation and fixing

#### 4. Fastify Endpoints (fastifyEndpoints.ts)
**Purpose**: HTTP API for stream access and management
**Key Endpoints**:
- `GET /livestream/:streamId/stream.m3u8`: HLS manifest
- `GET /livestream/:streamId/segment_*.ts`: Video segments
- `GET /livestream/:streamId/status`: Stream status
- `POST /livestream/:streamId/start`: Start Cloudinary stream
- `POST /livestream/:streamId/stop`: Stop Cloudinary stream

### Data Flow

#### Streaming Flow
1. **Host connects** → WebSocket connection established
2. **Media capture** → Camera/screen stream captured
3. **Data transmission** → WebM chunks sent via WebSocket
4. **FFmpeg processing** → Chunks accumulated and processed
5. **HLS generation** → Segments and manifest created
6. **CDN distribution** → Files uploaded to R2/Cloudinary
7. **Viewer access** → HLS stream served via HTTP

#### Viewing Flow
1. **Event discovery** → NIP-53 event contains streaming URL
2. **URL resolution** → Internal vs external URL detection
3. **Stream joining** → WebSocket connection for real-time updates
4. **HLS playback** → Video player loads and plays stream
5. **Status monitoring** → Real-time stream status updates

## External Services Integration

### Cloudinary Integration
**Purpose**: Professional streaming infrastructure
**Features**:
- Global CDN distribution
- Automatic transcoding
- Stream management API
- Playback URL generation

### R2 Storage Integration
**Purpose**: File storage and CDN
**Features**:
- HLS segment storage
- Manifest file hosting
- CORS-enabled delivery
- Automatic cleanup

## Technical Specifications

### Video Processing
- **Input Format**: WebM (VP8/VP9 + Vorbis/Opus)
- **Output Format**: HLS (H.264 + AAC)
- **Resolutions**: 1080p, 720p, 480p, 360p
- **Bitrates**: 2500k, 1500k, 800k
- **Segment Duration**: 2 seconds
- **Keyframe Interval**: 2 seconds

### WebSocket Protocol
- **Transport**: WebSocket with Socket.IO
- **Data Format**: Binary chunks (Buffer)
- **Chunk Size**: Variable (typically 1-64KB)
- **Transmission Rate**: 1 second intervals
- **Reconnection**: Automatic with exponential backoff

### HLS Configuration
- **Version**: HLS 6
- **Segment Type**: Independent segments
- **Playlist Type**: Event (live)
- **Target Duration**: 2 seconds
- **Media Sequence**: Incremental

## Error Handling

### Frontend Error Handling
- Stream loading failures with retry logic
- WebSocket connection errors
- MediaRecorder errors
- HLS playback errors

### Backend Error Handling
- FFmpeg process errors
- File system errors
- WebSocket disconnection handling
- Stream timeout management

## Performance Considerations

### Frontend Optimization
- Lazy loading of video components
- Efficient WebSocket data handling
- HLS.js configuration for low latency
- Memory management for MediaRecorder

### Backend Optimization
- Chunk accumulation for efficient processing
- FFmpeg preset optimization (veryfast)
- File system monitoring with debouncing
- Automatic cleanup of temporary files

## Security Considerations

### CORS Configuration
- Wildcard CORS for development
- Specific origin restrictions for production
- Proper headers for HLS delivery

### Authentication
- Nostr public key verification
- Stream ownership validation
- Viewer access control

## Monitoring and Debugging

### Frontend Monitoring
- Console logging for all major operations
- Real-time status updates
- Error tracking and reporting
- Performance metrics

### Backend Monitoring
- Stream activity monitoring
- FFmpeg process health
- File system monitoring
- WebSocket connection tracking

## Scalability Considerations

### Horizontal Scaling
- Stateless WebSocket connections
- Shared storage for HLS files
- Load balancer compatibility
- CDN distribution

### Vertical Scaling
- Memory-efficient chunk processing
- Optimized FFmpeg configurations
- Efficient file system operations
- Connection pooling

## Future Enhancements

### Planned Features
- WebRTC integration for lower latency
- Advanced quality adaptation
- Multi-stream support
- Recording and playback features
- Analytics and metrics

### Technical Improvements
- Edge computing integration
- Advanced error recovery
- Performance optimization
- Enhanced monitoring
