import React, { useState, useEffect } from 'react';
import { useAuth, useGetSingleEvent } from 'afk_nostr_sdk';
import { CreateEventModal, StudioModule } from './StudioModule';
import { LiveChat } from './LiveChat';
import { StreamVideoPlayer } from './StreamVideoPlayer';
import { HostStudio } from './HostStudio';
import { useLivestreamWebSocket } from '@/contexts/LivestreamWebSocketContext';
import styles from './styles.module.scss';
import { Icon } from '../small/icon-component';
import { useUIStore } from '@/store/uiStore';

// Helper function to extract streaming URL from NIP-53 events
const extractStreamingUrlFromEvent = (event: any): string | null => {
  if (!event) return null;
  
  console.log('🔍 Extracting streaming URL from event:', {
    eventKeys: Object.keys(event || {}),
    hasTags: !!event?.tags,
    hasContent: !!event?.content,
    streamingUrlField: event?.streamingUrl
  });
  
  // First check the streamingUrl field (if it exists)
  if (event.streamingUrl) {
    console.log('✅ Found streaming URL in streamingUrl field:', event.streamingUrl);
    return event.streamingUrl;
  }
  
  // Check NIP-53 streaming tag
  if (event.tags) {
    console.log('🏷️ Checking event tags:', event.tags);
    
    const streamingTag = event.tags.find((tag: any) => tag[0] === 'streaming');
    if (streamingTag) {
      console.log('✅ Found NIP-53 streaming tag:', streamingTag);
      return streamingTag[1];
    }
    
    // Fallback to other common streaming tags
    const fallbackTags = ['streaming_url', 'stream_url', 'url', 'rtmp', 'hls'];
    for (const tagName of fallbackTags) {
      const tag = event.tags.find((tag: any) => tag[0] === tagName);
      if (tag) {
        console.log(`🔄 Found streaming URL in fallback tag ${tagName}:`, tag);
        return tag[1];
      }
    }
    
    console.log('⚠️ No streaming tags found in event');
  }
  
  // Check content as last resort
  if (event.content) {
    try {
      const content = JSON.parse(event.content);
      const contentUrl = content.streamingUrl || content.stream_url || content.url || content.streaming;
      if (contentUrl) {
        console.log('📄 Found streaming URL in event content:', contentUrl);
        return contentUrl;
      }
    } catch (e) {
      console.log('⚠️ Event content is not JSON:', event.content);
    }
  }
  
  console.log('❌ No streaming URL found in event');
  return null;
};

interface LivestreamMainProps {
  streamId?: string;
  isStreamer?: boolean;
  className?: string;
}

export const LivestreamMain: React.FC<LivestreamMainProps> = ({
  streamId: initialStreamId,
  isStreamer = false,
  className,
}) => {
  const { publicKey } = useAuth();
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentView, setCurrentView] = useState<'studio' | 'stream' | 'chat' | 'host-studio'>('studio');
  const [currentStreamId, setCurrentStreamId] = useState<string>(initialStreamId || '');

  const { showModal } = useUIStore();
  const { data: event, isLoading: eventLoading, isError: eventError } = useGetSingleEvent({
    eventId: currentStreamId || '',
  });

  // Debug: Log the event query state
  useEffect(() => {
    console.log('🔍 Event query state:', {
      currentStreamId,
      eventId: currentStreamId || '',
      eventLoading,
      eventError,
      hasEvent: !!event,
      eventData: event
    });
  }, [currentStreamId, eventLoading, eventError, event]);

  // Get WebSocket context for streaming info
  const { isStreaming: isWebSocketStreaming, streamKey } = useLivestreamWebSocket();

  // Debug: Log the event data to see what we have
  useEffect(() => {
    console.log('🔍 Event data in LivestreamMain:', {
      event,
      eventId: currentStreamId,
      eventLoading,
      eventError,
      isWebSocketStreaming,
      streamKey,
      eventKeys: event ? Object.keys(event) : 'NO_EVENT',
      eventContent: event?.content,
      eventTags: event?.tags,
      // NIP-53 specific debugging
      nip53StreamingTag: event?.tags?.find((tag: any) => tag[0] === 'streaming'),
      nip53Status: event?.tags?.find((tag: any) => tag[0] === 'status'),
      nip53Kind: (event as any)?.kind,
      extractedStreamingUrl: extractStreamingUrlFromEvent(event),
      // Raw event data for debugging
      rawEvent: event,
      // Event structure debugging
      eventIdentifier: event?.identifier,
      eventEventId: event?.eventId,
      eventStatus: event?.status
    });
  }, [event, currentStreamId, eventLoading, eventError, isWebSocketStreaming, streamKey]);

  // Compute streaming URL - prioritize WebSocket context over event data
  const streamingUrl = React.useMemo(() => {
    console.log('🔗 Computing streaming URL with:', {
      isWebSocketStreaming,
      streamKey,
      currentStreamId,
      event,
      eventLoading: eventLoading,
      eventError: eventError,
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050"
    });

    // Priority 1: WebSocket streaming context
    if (isWebSocketStreaming && streamKey) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";
      const computedUrl = `${backendUrl}/livestream/${streamKey}/stream.m3u8`;
      console.log('✅ Computed streaming URL from WebSocket context:', computedUrl);
      return computedUrl;
    }

    // Priority 2: Extract from NIP-53 event
    if (event) {
      const eventStreamingUrl = extractStreamingUrlFromEvent(event);
      if (eventStreamingUrl) {
        console.log('✅ Found streaming URL in event:', eventStreamingUrl);
        return eventStreamingUrl;
      }
    }

    // Priority 3: If we have a stream ID but no event data, construct a fallback URL
    if (currentStreamId && !eventLoading && !eventError) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";
      const fallbackUrl = `${backendUrl}/livestream/${currentStreamId}/stream.m3u8`;
      console.log('🔄 Using fallback streaming URL:', fallbackUrl);
      return fallbackUrl;
    }

    // Priority 4: If event is still loading but we have a stream ID, show loading state
    if (currentStreamId && eventLoading) {
      console.log('⏳ Event is still loading, will show loading state');
      return null;
    }

    console.log('⚠️ No streaming URL found in event or WebSocket context');
    return null;
  }, [isWebSocketStreaming, streamKey, event, currentStreamId, eventLoading, eventError]);

  // Update streaming state when WebSocket streaming changes
  useEffect(() => {
    setIsStreaming(isWebSocketStreaming);
  }, [isWebSocketStreaming]);

  // Debug: Log streaming URL changes
  useEffect(() => {
    console.log('🎯 Streaming URL changed:', {
      streamingUrl,
      currentStreamId,
      eventLoading,
      eventError,
      hasEvent: !!event
    });
  }, [streamingUrl, currentStreamId, eventLoading, eventError, event]);

  // Debug: Log currentStreamId changes
  useEffect(() => {
    console.log('🔄 currentStreamId changed:', {
      currentStreamId,
      previousStreamId: initialStreamId,
      willTriggerEventQuery: !!currentStreamId
    });
  }, [currentStreamId, initialStreamId]);

  //   useEffect(() => {
  //     if (currentStreamId) {
  //     //   setCurrentView('stream');
  //     }
  //   }, [currentStreamId]);

  const handleNavigateToStream = (id: string) => {
    setCurrentStreamId(id);
    setCurrentView('stream');
    console.log('Navigating to stream:', id);
  };

  const handleNavigateToStreamView = (id: string, recordingUrl?: string) => {
    console.log('🚀 handleNavigateToStreamView called with:', { id, recordingUrl });
    setCurrentStreamId(id);
    setCurrentView('stream');
    console.log('✅ Navigation state updated:', { currentStreamId: id, view: 'stream' });
  };

  const handleNavigateToRecordView = (id: string) => {
    setCurrentStreamId(id);
    setCurrentView('stream');
    console.log('Navigating to record view:', id);
  };

  const handleNavigateToHostStudio = (id: string) => {
    setCurrentStreamId(id);
    setCurrentView('host-studio');
    console.log('Navigating to host studio:', id);
  };

  const handleStreamStart = () => {
    setIsStreaming(true);
    // Add your stream start logic here
    console.log('Starting stream...');
  };

  const handleStreamStop = () => {
    setIsStreaming(false);
    // Add your stream stop logic here
    console.log('Stopping stream...');
  };

  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  const renderStudioView = () => (
    <div className={styles.studioView}>
      <button className={styles.createButton} onClick={() => {
        // handleModalOpen();
        showModal(<CreateEventModal handleModal={() => {
          console.log('handleModal')
         }} />)
      }}>
        <Icon name="CreateIcon" size={20} />
        <span>Create Event</span>
      </button>
      <StudioModule
        onNavigateToStream={handleNavigateToStream}
        onNavigateToStreamView={handleNavigateToStreamView}
        onNavigateToRecordView={handleNavigateToRecordView}
        onNavigateToHostStudio={handleNavigateToHostStudio}
      />
    </div>
  );

  const renderStreamView = () => (
    <div className={styles.streamView}>
      <div className={styles.streamHeader}>
        <button
          className={styles.backButton}
          onClick={() => setCurrentView('studio')}
          aria-label="Back to studio"
        >
          <Icon name="BackIcon" size={24} />
        </button>
        <div className={styles.streamInfo}>
          <h2 className={styles.streamTitle}>
            {event?.title || 'Live Stream'}
          </h2>
          <div className={styles.streamStatus}>
            {isStreaming ? (
              <span className={styles.liveStatus}>
                <span className={styles.liveDot}></span>
                LIVE
              </span>
            ) : (
              <span className={styles.offlineStatus}>OFFLINE</span>
            )}
          </div>
        </div>
        <button
          className={styles.chatToggleButton}
          onClick={toggleChat}
          aria-label="Toggle chat"
        >
          <Icon name="MessageIcon" size={24} />
        </button>
      </div>

      <div className={styles.streamContent}>
        <div className={styles.videoSection}>
          {eventLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading event data...</p>
            </div>
          ) : eventError ? (
            <div className={styles.errorContainer}>
              <p>Failed to load event data</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : (
            <StreamVideoPlayer
              streamingUrl={streamingUrl || undefined}
              recordingUrl={event?.recordingUrl}
              isStreamer={isStreamer}
              onStreamStart={handleStreamStart}
              onStreamStop={handleStreamStop}
              className={styles.mainVideoPlayer}
            />
          )}
        </div>

        {isChatVisible && (
          <div className={styles.chatSection}>
            <LiveChat
              streamId={currentStreamId || ''}
              isVisible={true}
              onToggle={toggleChat}
              className={styles.sideChat}
            />
          </div>
        )}
      </div>

      {/* Floating chat toggle for mobile */}
      {!isChatVisible && (
        <button
          className={styles.floatingChatToggle}
          onClick={toggleChat}
          aria-label="Show chat"
        >
          <Icon name="MessageIcon" size={24} />
        </button>
      )}
    </div>
  );

  const renderChatView = () => (
    <div className={styles.chatView}>
      <div className={styles.chatViewHeader}>
        <button
          className={styles.backButton}
          onClick={() => setCurrentView('studio')}
          aria-label="Back to studio"
        >
          {/* <Icon name="ArrowLeftIcon" size={24} /> */}
        </button>
        <h2 className={styles.chatViewTitle}>Live Chat</h2>
      </div>
      <LiveChat
        streamId={currentStreamId || ''}
        isVisible={true}
        className={styles.fullScreenChat}
      />
    </div>
  );

  const renderHostStudioView = () => (
    <HostStudio
      streamId={currentStreamId || ''}
      onGoLive={() => {
        // setCurrentView('stream');
        setIsStreaming(true);
      }}
      onBack={() => {
        // setCurrentView('studio');
        // setCurrentStreamId('');
      }}
    />
  );

  const renderContent = () => {
    switch (currentView) {
      case 'studio':
        return renderStudioView();
      case 'host-studio':
        return renderHostStudioView();
      case 'stream':
        return renderStreamView();
      case 'chat':
        return renderChatView();
      default:
        return renderStudioView();
    }
  };

  return (
    <div className={`${styles.livestreamMain} ${className || ''}`}>
      {renderContent()}
    </div>
  );
};
