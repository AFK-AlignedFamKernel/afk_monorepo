import React, { useState } from 'react';
import { HostStudio, StudioModule, LivestreamMain } from './index';

/**
 * Example implementation showing how to use the HostStudio component
 * in a real application with proper navigation and state management
 */
export const HostStudioExample: React.FC = () => {
  const [currentView, setCurrentView] = useState<'studio' | 'host-studio' | 'stream' | 'chat'>('studio');
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  // Handle navigation to host studio (for hosts only)
  const handleNavigateToHostStudio = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentView('host-studio');
  };

  // Handle navigation from studio to stream view
  const handleNavigateToStream = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentView('stream');
  };

  // Handle going live from host studio
  const handleGoLive = () => {
    console.log('Stream went live for event:', selectedEventId);
    setCurrentView('stream');
    // Here you would typically navigate to the live stream view
  };

  // Handle back navigation
  const handleBack = () => {
    setCurrentView('studio');
    setSelectedEventId('');
  };

  // Render current view
  switch (currentView) {
    case 'studio':
      return (
        <div style={{ height: '100vh', overflow: 'hidden' }}>
          <StudioModule
            onNavigateToStream={handleNavigateToStream}
            onNavigateToStreamView={handleNavigateToStream}
            onNavigateToRecordView={handleNavigateToStream}
            onNavigateToHostStudio={handleNavigateToHostStudio}
          />
        </div>
      );

    case 'host-studio':
      return (
        <div style={{ height: '100vh', overflow: 'hidden' }}>
          <HostStudio
            streamId={selectedEventId}
            onGoLive={handleGoLive}
            onBack={handleBack}
          />
        </div>
      );

    case 'stream':
      return (
        <LivestreamMain
          streamId={selectedEventId}
          isStreamer={true}
        />
      );

    default:
      return null;
  }
};

/**
 * Alternative: Using HostStudio as a standalone component
 */
export const StandaloneHostStudio: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [isStreaming, setIsStreaming] = useState(false);

  const handleGoLive = () => {
    setIsStreaming(true);
    // Implement your live streaming logic here
    console.log('Starting live stream for event:', eventId);
  };

  const handleBack = () => {
    // Navigate back or close the studio
    console.log('Going back from host studio');
  };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <HostStudio
        streamId={eventId}
        onGoLive={handleGoLive}
        onBack={handleBack}
      />
    </div>
  );
};

/**
 * Example of integrating with routing (e.g., Next.js or React Router)
 */
export const HostStudioPage: React.FC = () => {
  // In a real app, you'd get this from the URL params
  const eventId = 'example-event-123';

  return (
    <HostStudio
      streamId={eventId}
      onGoLive={() => {
        // Navigate to live stream page
        console.log('Navigate to live stream');
      }}
      onBack={() => {
        // Navigate back to studio/dashboard
        console.log('Navigate back to studio');
      }}
    />
  );
};

/**
 * Example showing how to customize the HostStudio with additional props
 */
export const CustomizedHostStudio: React.FC = () => {
  return (
    <HostStudio
      streamId="custom-event-456"
      onGoLive={() => {
        // Custom go-live logic
        console.log('Custom go-live handler');
      }}
      onBack={() => {
        // Custom back handler
        console.log('Custom back handler');
      }}
      className="custom-host-studio"
    />
  );
};
