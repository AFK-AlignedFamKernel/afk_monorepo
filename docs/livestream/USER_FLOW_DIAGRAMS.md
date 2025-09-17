# Livestream User Flow Diagrams

## Overview

This document provides comprehensive user flow diagrams and explanations for the AFK livestream system, covering both broadcaster and viewer experiences.

## 1. Broadcaster Flow (Host Studio)

### 1.1 Initial Setup Flow

```mermaid
graph TD
    A[User opens Host Studio] --> B[WebSocket Connection]
    B --> C{Connection Successful?}
    C -->|No| D[Show Error Message]
    C -->|Yes| E[Show Media Source Options]
    E --> F[User selects Camera/Screen]
    F --> G[Request Media Permissions]
    G --> H{Permissions Granted?}
    H -->|No| I[Show Permission Error]
    H -->|Yes| J[Start Media Preview]
    J --> K[Show Go Live Button]
    K --> L[Ready to Stream]
```

### 1.2 Going Live Flow

```mermaid
graph TD
    A[User clicks Go Live] --> B[Create NIP-53 Event]
    B --> C[Update Event Status to Live]
    C --> D[Start Backend Stream]
    D --> E[Setup MediaRecorder]
    E --> F[Start Video Capture]
    F --> G[Begin WebSocket Data Transmission]
    G --> H[FFmpeg Processing Starts]
    H --> I[Generate HLS Segments]
    I --> J[Upload to CDN]
    J --> K[Stream is LIVE]
    K --> L[Show Live Status]
```

### 1.3 Stream Management Flow

```mermaid
graph TD
    A[Stream is Live] --> B[Real-time Monitoring]
    B --> C{Stream Health Check}
    C -->|Healthy| D[Continue Broadcasting]
    C -->|Issues| E[Show Warning/Error]
    D --> F[User can Switch Sources]
    F --> G[Camera/Screen Toggle]
    G --> H[Update Media Stream]
    H --> I[Continue Broadcasting]
    E --> J[Retry/Stop Options]
    J --> K[User Decision]
    K -->|Retry| D
    K -->|Stop| L[End Stream]
```

### 1.4 Ending Stream Flow

```mermaid
graph TD
    A[User clicks Stop Stream] --> B[Update NIP-53 Event to Ended]
    B --> C[Stop MediaRecorder]
    C --> D[Stop WebSocket Data]
    D --> E[End FFmpeg Process]
    E --> F[Finalize HLS Manifest]
    F --> G[Cleanup Temporary Files]
    G --> H[Disconnect WebSocket]
    H --> I[Return to Studio View]
```

## 2. Viewer Flow

### 2.1 Discovery and Access Flow

```mermaid
graph TD
    A[User discovers Stream] --> B[Click on NIP-53 Event]
    B --> C[Extract Streaming URL]
    C --> D{URL Type?}
    D -->|Internal| E[Connect to WebSocket]
    D -->|External| F[Load External Player]
    E --> G[Join Stream Room]
    G --> H[Load HLS Stream]
    H --> I[Start Video Playback]
    F --> I
    I --> J[Stream is Playing]
```

### 2.2 Stream Loading Flow

```mermaid
graph TD
    A[Load Stream URL] --> B[Check Stream Status]
    B --> C{Stream Available?}
    C -->|No| D[Show Not Started Message]
    C -->|Yes| E[Initialize HLS Player]
    E --> F[Load Manifest]
    F --> G{Manifest Valid?}
    G -->|No| H[Show Error Message]
    G -->|Yes| I[Load Video Segments]
    I --> J[Start Playback]
    J --> K[Show Live Indicator]
    D --> L[Periodic Status Check]
    L --> C
```

### 2.3 Real-time Updates Flow

```mermaid
graph TD
    A[Viewer Connected] --> B[Listen for WebSocket Events]
    B --> C[Stream Status Updates]
    C --> D[Viewer Count Updates]
    D --> E[Stream Quality Changes]
    E --> F[Error Notifications]
    F --> G[Stream End Notifications]
    G --> H[Update UI Accordingly]
    H --> I[Continue Monitoring]
    I --> B
```

## 3. System Integration Flow

### 3.1 NIP-53 Event Integration

```mermaid
graph TD
    A[Nostr Event Created] --> B[Extract Streaming URL]
    B --> C{URL Format?}
    C -->|Internal HLS| D[Backend URL Pattern]
    C -->|External| E[Third-party URL]
    D --> F[Check Stream Status]
    E --> G[Load External Player]
    F --> H{Stream Active?}
    H -->|Yes| I[Show Live Status]
    H -->|No| J[Show Waiting Status]
    G --> K[External Stream Playing]
    I --> L[Internal Stream Playing]
    J --> M[Periodic Status Check]
```

### 3.2 Error Recovery Flow

```mermaid
graph TD
    A[Error Detected] --> B{Error Type?}
    B -->|Network| C[Retry Connection]
    B -->|Stream| D[Reload Stream]
    B -->|Media| E[Restart Media Capture]
    C --> F{Retry Successful?}
    D --> G{Reload Successful?}
    E --> H{Restart Successful?}
    F -->|Yes| I[Continue Normal Flow]
    F -->|No| J[Show Error Message]
    G -->|Yes| I
    G -->|No| J
    H -->|Yes| I
    H -->|No| J
    J --> K[User Action Required]
```

## 4. Technical Flow Diagrams

### 4.1 WebSocket Data Flow

```mermaid
sequenceDiagram
    participant H as Host
    participant WS as WebSocket
    participant BE as Backend
    participant FF as FFmpeg
    participant HLS as HLS Server
    participant V as Viewer

    H->>WS: Connect to Stream
    WS->>BE: start-stream event
    BE->>FF: Initialize FFmpeg
    H->>WS: Send Video Chunks
    WS->>BE: stream-data event
    BE->>FF: Process Chunks
    FF->>HLS: Generate Segments
    V->>HLS: Request HLS Manifest
    HLS->>V: Return Manifest
    V->>HLS: Request Segments
    HLS->>V: Return Video Segments
```

### 4.2 HLS Generation Flow

```mermaid
graph TD
    A[WebM Chunks Received] --> B[Accumulate in Buffer]
    B --> C[Write to Temp File]
    C --> D[FFmpeg Processes File]
    D --> E[Generate HLS Segments]
    E --> F[Update Manifest]
    F --> G[Upload to CDN]
    G --> H[Notify Viewers]
    H --> I[Viewers Load New Segments]
    I --> J[Continue Processing]
    J --> A
```

## 5. User Experience States

### 5.1 Broadcaster States

| State | Description | UI Elements | Actions Available |
|-------|-------------|-------------|-------------------|
| **Idle** | Initial state, no connection | Connect button, instructions | Connect to stream |
| **Connecting** | Establishing WebSocket connection | Loading spinner, status | Wait for connection |
| **Connected** | WebSocket connected, ready to stream | Media source buttons, Go Live | Select camera/screen, Go Live |
| **Streaming** | Actively broadcasting | Live indicator, Stop button | Stop stream, switch sources |
| **Error** | Connection or stream error | Error message, retry button | Retry connection, go back |

### 5.2 Viewer States

| State | Description | UI Elements | Actions Available |
|-------|-------------|-------------|-------------------|
| **Loading** | Checking stream status | Loading spinner | Wait for status |
| **Not Started** | Stream exists but not broadcasting | Waiting message, refresh | Refresh status |
| **Ready** | Stream ready, waiting for content | Ready message | Wait for content |
| **Live** | Stream is broadcasting | Video player, live indicator | Play controls, chat |
| **Error** | Stream error or unavailable | Error message, retry | Retry, refresh page |

## 6. Error Scenarios and Recovery

### 6.1 Common Error Scenarios

#### Network Errors
- **WebSocket disconnection**: Automatic reconnection with exponential backoff
- **HTTP request failures**: Retry with increasing delays
- **Stream timeout**: Show appropriate message and retry options

#### Media Errors
- **Camera access denied**: Show permission request and fallback options
- **Microphone issues**: Mute/unmute controls and error notifications
- **Screen sharing denied**: Fallback to camera or show instructions

#### Stream Errors
- **HLS manifest errors**: Reload stream and show status
- **Segment loading failures**: Retry loading with backoff
- **FFmpeg processing errors**: Restart stream or show error message

### 6.2 Recovery Strategies

#### Automatic Recovery
- WebSocket reconnection
- Stream status polling
- HLS player retry logic
- MediaRecorder restart

#### User-Initiated Recovery
- Manual refresh buttons
- Stream restart options
- Source switching
- Page reload

## 7. Performance Considerations

### 7.1 Latency Optimization
- **WebSocket**: Real-time data transmission
- **HLS**: 2-second segments for low latency
- **FFmpeg**: Veryfast preset for quick processing
- **CDN**: Global distribution for reduced latency

### 7.2 Bandwidth Management
- **Adaptive bitrate**: Multiple quality levels
- **Chunk optimization**: Efficient data transmission
- **Compression**: WebM encoding for smaller chunks
- **Caching**: CDN caching for repeated requests

### 7.3 Resource Management
- **Memory**: Efficient chunk processing
- **CPU**: Optimized FFmpeg settings
- **Storage**: Automatic cleanup of temporary files
- **Connections**: Proper WebSocket lifecycle management

## 8. Accessibility Considerations

### 8.1 Keyboard Navigation
- Tab navigation through controls
- Enter/Space for button activation
- Arrow keys for volume/seek controls
- Escape for fullscreen exit

### 8.2 Screen Reader Support
- ARIA labels for all interactive elements
- Status announcements for stream changes
- Error message announcements
- Live region updates for dynamic content

### 8.3 Visual Accessibility
- High contrast mode support
- Scalable UI elements
- Clear status indicators
- Error message visibility

## 9. Mobile Considerations

### 9.1 Touch Interface
- Large touch targets for controls
- Swipe gestures for navigation
- Touch-friendly video controls
- Responsive layout adaptation

### 9.2 Performance
- Optimized for mobile bandwidth
- Battery usage considerations
- Memory management
- Network condition handling

### 9.3 Platform Integration
- Native camera integration
- Screen sharing limitations
- Notification support
- Background processing limits
