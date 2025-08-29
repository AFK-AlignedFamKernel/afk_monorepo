# Livestream Components

This directory contains React TypeScript components for building a comprehensive livestream application, converted from the mobile app's Studio module. The components are designed to work with your backend and Nostr integration.

## Components Overview

### 1. HostStudio
A comprehensive streaming studio for event hosts and administrators. Provides professional-grade controls for camera, microphone, screen sharing, recording, and live streaming.

**Features:**
- Camera and microphone controls
- Screen sharing capabilities
- Local recording with timer
- Device selection (camera/microphone)
- Quality settings (resolution, bitrate)
- Go live functionality
- Real-time status indicators
- Professional studio interface

**Usage:**
```tsx
import { HostStudio } from './components/Livestream';

function HostPage() {
  const handleGoLive = () => {
    console.log('Stream went live!');
  };

  const handleBack = () => {
    // Navigate back to studio
  };

  return (
    <HostStudio
      streamId="event-123"
      onGoLive={handleGoLive}
      onBack={handleBack}
    />
  );
}
```

### 2. LivestreamMain
The main component that orchestrates the entire livestream experience. It manages different views (studio, stream, chat) and provides navigation between them.

**Features:**
- Studio view for managing events
- Stream view with video player and chat
- Chat-only view
- Responsive design for mobile and desktop

**Usage:**
```tsx
import { LivestreamMain } from './components/Livestream';

function App() {
  return (
    <LivestreamMain
      streamId="optional-stream-id"
      isStreamer={false}
    />
  );
}
```

### Host Studio Integration

For hosts to access their streaming studio, use the `onNavigateToHostStudio` prop in StudioModule:

```tsx
import { StudioModule } from './components/Livestream';

function StudioPage() {
  const handleNavigateToHostStudio = (eventId: string) => {
    // Navigate to host studio for this event
    navigate(`/host-studio/${eventId}`);
  };

  return (
    <StudioModule
      onNavigateToHostStudio={handleNavigateToHostStudio}
      // ... other props
    />
  );
}
```

This will show hosts a "🎬 Start Studio" button in addition to their regular "View Event" button.

### Complete Host Workflow

1. **Host creates an event** using StudioModule
2. **Host clicks "🎬 Start Studio"** on their event card
3. **HostStudio loads** with professional streaming controls
4. **Host configures settings**: camera, microphone, resolution, bitrate
5. **Host starts recording or goes live** using the control buttons
6. **Host manages stream** with real-time feedback and controls
7. **Host ends stream** when finished

### 3. StudioModule
Manages the studio interface where users can create, view, and manage livestream events.

**Features:**
- Event creation modal
- Event listing with status badges
- Host/participant management
- Event navigation

**Usage:**
```tsx
import { StudioModule } from './components/Livestream';

function StudioPage() {
  const handleNavigateToStream = (id: string) => {
    // Navigate to stream
  };

  return (
    <StudioModule
      onNavigateToStream={handleNavigateToStream}
      onNavigateToStreamView={handleNavigateToStreamView}
      onNavigateToRecordView={handleNavigateToRecordView}
    />
  );
}
```

### 4. StreamVideoPlayer
A comprehensive video player component for livestreams and recordings.

**Features:**
- Live stream support
- Recording playback
- Custom video controls
- Fullscreen support
- Volume control
- Progress bar (for recordings)
- Stream start/stop controls (for streamers)

**Usage:**
```tsx
import { StreamVideoPlayer } from './components/Livestream';

function StreamPage() {
  return (
    <StreamVideoPlayer
      streamingUrl="rtmp://stream-url"
      recordingUrl="https://recording-url.mp4"
      isStreamer={true}
      onStreamStart={() => console.log('Stream started')}
      onStreamStop={() => console.log('Stream stopped')}
    />
  );
}
```

### 5. LiveChat
Real-time chat functionality for livestreams.

**Features:**
- Real-time messaging
- User identification
- Timestamp display
- Connection status
- Responsive design
- Character count
- Message input validation

**Usage:**
```tsx
import { LiveChat } from './components/Livestream';

function ChatComponent() {
  return (
    <LiveChat
      streamId="stream-123"
      isVisible={true}
      onToggle={() => setChatVisible(!chatVisible)}
    />
  );
}
```

## Styling

The components use CSS modules with CSS custom properties for theming. The styling system supports:

- Light and dark mode through CSS variables
- Responsive design for mobile and desktop
- Consistent design language
- Accessibility features

### CSS Variables

The components use these CSS custom properties for theming:

```css
:root {
  --background-color: #0f0f0f;
  --surface-color: #1f2937;
  --text-color: #ffffff;
  --text-secondary-color: #9ca3af;
  --primary-color: #3b82f6;
  --primary-hover-color: #2563eb;
  --success-color: #16a34a;
  --error-color: #dc2626;
  --border-color: #374151;
  --input-background: #111827;
  --message-background: #374151;
}
```

## Integration with Your Backend

### Nostr Integration
The components are designed to work with your existing Nostr SDK (`afk_nostr_sdk`). They use:

- `useAuth()` for user authentication
- `useGetLiveEvents()` for fetching events
- `useLiveActivity()` for event management
- `useGetSingleEvent()` for individual event data

### WebSocket Integration
For real-time features like chat, you'll need to integrate with your WebSocket backend. The components are prepared for this integration.

## Responsive Design

The components are fully responsive and include:

- Mobile-first design approach
- Breakpoints at 768px and 480px
- Adaptive layouts for different screen sizes
- Touch-friendly controls

## Browser Support

The components use modern web APIs:

- MediaDevices API for camera/microphone access
- Fullscreen API for video player
- WebRTC for screen sharing (when implemented)
- Modern CSS features with fallbacks

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install lucide-react
   ```

2. **Import Components**
   ```tsx
   import {
     HostStudio,
     LivestreamMain,
     StudioModule,
     LiveChat,
     StreamVideoPlayer
   } from './components/Livestream';
   ```

3. **Set Up CSS Variables**
   Add the CSS variables to your global styles for theming.

4. **Use Components**
    - Start with `LivestreamMain` for a complete experience
    - Use `HostStudio` for professional streaming capabilities
    - Use individual components as needed for specific functionality

## Customization

### Theming
Override CSS variables to match your design system:

```css
:root {
  --primary-color: #your-brand-color;
  --background-color: #your-background;
  /* ... other variables */
}
```

### Component Props
Most components accept `className` props for additional styling:

```tsx
<LiveChat className="custom-chat-styles" />
```

### Event Handlers
Components provide callback props for integration:

```tsx
<StudioModule
  onNavigateToStream={(id) => router.push(`/stream/${id}`)}
/>
```

## Future Enhancements

- Screen sharing functionality
- Recording capabilities
- Advanced chat features (reactions, moderation)
- Analytics integration
- Multi-stream support
- Picture-in-picture mode

## Troubleshooting

### Common Issues

1. **Video not playing**: Check browser permissions for camera/microphone
2. **Screen sharing not working**: Ensure HTTPS is enabled (required by browsers)
3. **Recording not saving**: Check browser storage permissions and available disk space
4. **Go live failing**: Verify stream ID and backend connectivity
5. **Device selection not working**: Check browser compatibility with MediaDevices API
6. **Chat not working**: Ensure WebSocket connection is established
7. **Styling issues**: Verify CSS variables are properly set

### Debug Mode
Enable console logging for debugging:

```tsx
// Add to your component
useEffect(() => {
  console.log('Component mounted with props:', props);
}, [props]);
```

## Contributing

When modifying these components:

1. Maintain the existing API structure
2. Follow the established styling patterns
3. Ensure responsive design compatibility
4. Test with different screen sizes
5. Update this README for new features
