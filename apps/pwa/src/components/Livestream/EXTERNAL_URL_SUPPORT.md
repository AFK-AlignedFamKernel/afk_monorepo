# External Streaming URL Support

This document explains how the livestream system now supports external streaming URLs in addition to internal HLS streams.

## Overview

The `StreamVideoPlayer` component has been enhanced to automatically detect and handle different types of streaming URLs:

1. **Internal HLS streams** - Our own livestream URLs (e.g., `/livestream/streamId/stream.m3u8`)
2. **External HLS streams** - Any `.m3u8` manifest URL from other sources
3. **External platform URLs** - YouTube, Twitch, Vimeo, etc.

## URL Detection Logic

The system uses a `detectUrlType()` function to categorize URLs:

```typescript
const detectUrlType = (url: string): 'internal-hls' | 'external-hls' | 'external-other' => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";
  
  // Check if it's our internal HLS stream
  if (url.includes(`${backendUrl}/livestream/`) && url.endsWith('.m3u8')) {
    return 'internal-hls';
  }
  
  // Check if it's an external HLS stream
  if (url.endsWith('.m3u8') || url.includes('m3u8')) {
    return 'external-hls';
  }
  
  // Check for other external streaming platforms
  if (url.includes('youtube.com') || url.includes('youtu.be') || 
      url.includes('twitch.tv') || url.includes('vimeo.com') ||
      url.includes('facebook.com') || url.includes('instagram.com') ||
      url.includes('tiktok.com') || url.includes('dailymotion.com')) {
    return 'external-other';
  }
  
  // Default to external-other for unknown URLs
  return 'external-other';
};
```

## URL Priority in LivestreamMain

The streaming URL is computed with the following **strict priority**:

1. **NIP-53 event data** - **HIGHEST PRIORITY** - Always checked first, handles both internal and external URLs
2. **WebSocket streaming context** - Only if no event URL found (internal streams only)
3. **Stream status** - Only if no event URL found (internal streams only)
4. **Fallback to null** - Show appropriate UI

**Important**: NIP-53 event streaming URLs always take priority over any other source, including WebSocket context and internal stream construction.

## Handling Differences

### Internal HLS Streams
- Full status checking and WebSocket integration
- Wait for broadcaster to start streaming
- Show loading states and status overlays
- Monitor stream health and viewer count

### External HLS Streams
- **Direct video loading** with HLS support
- **Skip status checking** (assume available)
- **No WebSocket integration** (no event pushing)
- **No status overlays**
- **Immediate playback attempt**

### External Platform URLs
- **Direct video loading** (browser-dependent support)
- **Skip status checking** (assume available)
- **No WebSocket integration** (no event pushing)
- **No status overlays**
- **Handle autoplay restrictions gracefully**

## Key Behavioral Changes

### External URLs (NIP-53 Event Priority)
- **No WebSocket joining** - External URLs don't join stream rooms
- **No event pushing** - External URLs don't push events to backend
- **No status monitoring** - External URLs skip all status checking
- **Direct rendering** - External URLs render directly in video player
- **No cleanup** - External URLs don't trigger stream leave events

### Internal URLs (Fallback Only)
- **Full WebSocket integration** - Internal URLs join stream rooms
- **Event pushing** - Internal URLs push events to backend
- **Status monitoring** - Internal URLs have full status checking
- **Status overlays** - Internal URLs show loading/waiting states
- **Cleanup** - Internal URLs properly clean up on unmount

## Usage Examples

### Using External URLs in Events

When creating or updating events, you can now include external streaming URLs:

```typescript
// In event tags
const event = {
  tags: [
    ['streaming', 'https://example.com/stream.m3u8'],
    ['status', 'live']
  ]
};

// Or in event content
const event = {
  content: JSON.stringify({
    streamingUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  })
};
```

### Direct Usage in StreamVideoPlayer

```typescript
<StreamVideoPlayer
  streamingUrl="https://example.com/stream.m3u8"
  isStreamer={false}
  streamId="external-stream"
/>
```

## Error Handling

The system provides different error messages based on URL type:

- **Internal streams**: "Stream is waiting for broadcaster to connect..."
- **External HLS**: "External HLS stream format error"
- **External platforms**: "External stream format not supported by browser"

## Browser Compatibility

- **HLS streams**: Supported in modern browsers with HLS.js or native HLS support
- **External platforms**: Depends on browser's ability to play the specific URL format
- **Autoplay**: May require user interaction for external URLs due to browser policies

## Testing

Use the `ExternalUrlExample` component to test different URL types:

```typescript
import { ExternalUrlExample } from './components/Livestream';

// In your component
<ExternalUrlExample />
```

## Implementation Details

### StreamVideoPlayer Changes
- Added `detectUrlType()` function
- Enhanced video loading logic for different URL types
- Improved error handling with URL-specific messages
- Skip status overlays for external URLs

### LivestreamMain Changes
- Reordered URL priority to check NIP-53 events first
- Skip status checking for external URLs
- Added `isExternalUrl()` helper function

### Backend Compatibility
- No changes required to backend
- External URLs bypass all backend status checking
- Internal URLs continue to work as before

## Future Enhancements

1. **Embed support**: Add iframe embedding for platforms that don't support direct video URLs
2. **URL validation**: Add validation for external URLs before attempting to load
3. **Platform-specific handling**: Add special handling for different platforms
4. **Caching**: Add caching for external URL metadata
5. **Analytics**: Track external URL usage and performance
