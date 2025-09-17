# AFK Livestream Documentation

## Overview

This directory contains comprehensive documentation for the AFK livestream system, a sophisticated real-time streaming solution that combines WebSocket-based communication, FFmpeg video processing, HLS delivery, and NIP-53 Nostr event integration.

## Documentation Structure

### 📋 [Technical Architecture](./TECHNICAL_ARCHITECTURE.md)
Complete technical overview of the livestream system including:
- System architecture and component relationships
- Frontend and backend component details
- Data flow and processing pipelines
- External service integrations (Cloudinary, R2)
- Performance and security considerations
- Scalability and monitoring strategies

### 🔄 [User Flow Diagrams](./USER_FLOW_DIAGRAMS.md)
Comprehensive user experience documentation including:
- Broadcaster flow (Host Studio)
- Viewer flow and discovery
- System integration flows
- Error scenarios and recovery
- Performance considerations
- Accessibility and mobile support

### 🔌 [API Reference](./API_REFERENCE.md)
Complete API documentation covering:
- WebSocket events and protocols
- HTTP endpoints and responses
- Error codes and handling
- Rate limits and CORS configuration
- SDK examples and testing

### 🧩 [Component Reference](./COMPONENT_REFERENCE.md)
Detailed component documentation including:
- Frontend component props and methods
- Backend service functions and data structures
- Hooks and utilities
- State management patterns
- Error handling strategies

## Quick Start

### For Developers

1. **Understanding the System**: Start with [Technical Architecture](./TECHNICAL_ARCHITECTURE.md) to understand the overall system design
2. **API Integration**: Use [API Reference](./API_REFERENCE.md) for WebSocket and HTTP API integration
3. **Component Usage**: Check [Component Reference](./COMPONENT_REFERENCE.md) for frontend component implementation
4. **User Experience**: Review [User Flow Diagrams](./USER_FLOW_DIAGRAMS.md) for UX considerations

### For Users

1. **Broadcasting**: See the "Broadcaster Flow" section in [User Flow Diagrams](./USER_FLOW_DIAGRAMS.md)
2. **Viewing Streams**: See the "Viewer Flow" section in [User Flow Diagrams](./USER_FLOW_DIAGRAMS.md)
3. **Troubleshooting**: Check error scenarios in [User Flow Diagrams](./USER_FLOW_DIAGRAMS.md)

## System Features

### 🎬 **Real-time Streaming**
- WebSocket-based video transmission
- FFmpeg processing for HLS generation
- Adaptive bitrate streaming (720p, 480p, 360p)
- Low-latency streaming with 2-second segments

### 🌐 **Multi-Platform Support**
- Internal streaming via WebSocket + FFmpeg
- External streaming via Cloudinary integration
- Support for YouTube, Twitch, and other platforms
- NIP-53 Nostr event integration

### 📱 **Cross-Platform Compatibility**
- PWA support for mobile and desktop
- Responsive design for all screen sizes
- Touch-friendly controls for mobile
- Keyboard navigation support

### 🔧 **Developer-Friendly**
- Comprehensive API documentation
- TypeScript support throughout
- Extensive error handling and recovery
- Debug tools and monitoring

## Architecture Highlights

### Frontend (PWA)
- **LivestreamMain**: Main orchestrator component
- **StreamVideoPlayer**: HLS video player with controls
- **HostStudio**: Broadcasting interface
- **LivestreamWebSocketContext**: WebSocket management
- **LiveChat**: Real-time chat functionality

### Backend (Data Backend)
- **WebSocket Handler**: Real-time communication
- **Stream Handler**: Video processing and lifecycle
- **Stream Service**: FFmpeg configuration and HLS generation
- **Fastify Endpoints**: HTTP API for stream access
- **Cloudinary Service**: Professional streaming infrastructure

### External Services
- **Cloudinary**: Global CDN and transcoding
- **R2 Storage**: File storage and distribution
- **Nostr**: Decentralized event system integration

## Key Technologies

- **Frontend**: React, TypeScript, HLS.js, WebSocket
- **Backend**: Node.js, Fastify, FFmpeg, Socket.IO
- **Streaming**: HLS, WebM, WebRTC
- **Storage**: Cloudinary, R2, Local file system
- **Protocols**: WebSocket, HTTP, NIP-53

## Getting Started

### Prerequisites
- Node.js 18+
- FFmpeg installed
- Cloudinary account (optional)
- R2 storage configured (optional)

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start backend
npm run dev:backend
```

### Configuration
1. Set up environment variables
2. Configure Cloudinary credentials (optional)
3. Set up R2 storage (optional)
4. Configure WebSocket endpoints

## Common Use Cases

### 1. **Creating a Live Stream**
1. Open Host Studio
2. Select camera or screen sharing
3. Click "Go Live"
4. Stream is automatically created and broadcast

### 2. **Viewing a Stream**
1. Click on a NIP-53 event with streaming URL
2. Stream automatically loads and plays
3. Real-time updates and chat available

### 3. **Integrating with External Services**
1. Use Cloudinary for professional streaming
2. Integrate with existing video platforms
3. Support for custom streaming URLs

## Troubleshooting

### Common Issues
- **Stream not loading**: Check stream status and URL validity
- **WebSocket connection failed**: Verify backend is running
- **Video playback errors**: Check HLS support and network
- **Permission denied**: Ensure camera/microphone access

### Debug Tools
- Browser developer console for frontend debugging
- Backend logs for WebSocket and FFmpeg issues
- Network tab for API request debugging
- Stream status endpoints for health checks

## Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Add comprehensive error handling
3. Include unit tests for new features
4. Update documentation for changes
5. Follow existing code patterns

### Testing
- Use provided test files for WebSocket testing
- Test both internal and external streaming
- Verify error handling and recovery
- Test on multiple devices and browsers

## Support

### Documentation
- All documentation is in this directory
- Each file covers specific aspects of the system
- Examples and code snippets provided throughout

### Issues
- Check existing documentation first
- Use debug tools to identify issues
- Provide detailed error information
- Include system configuration details

## License

This project is part of the AFK monorepo. See the main LICENSE file for details.

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Maintainer**: AFK Development Team
