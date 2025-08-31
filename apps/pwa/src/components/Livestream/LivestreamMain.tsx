'use client';
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
  
  // Check if stream is actually available and handle initialization
  const [streamStatus, setStreamStatus] = useState<'loading' | 'available' | 'not_started' | 'error'>('loading');
  const [streamStatusData, setStreamStatusData] = useState<any>(null);

  const { showModal, showToast } = useUIStore();
  const { data: event, isLoading: eventLoading, isError: eventError } = useGetSingleEvent({
    eventId: currentStreamId || '',
  });

  const { isStreaming: isWebSocketStreaming, streamKey , isConnected } = useLivestreamWebSocket();

  // Debug: Log the event query state
  useEffect(() => {
    console.log('🔍 Event query state:', {
      currentStreamId,
      eventId: currentStreamId || '',
      eventLoading,
      eventError,
      hasEvent: !!event,
      eventData: event,
      isWebSocketStreaming,
      isConnected,
    });
  }, [currentStreamId, eventLoading, eventError, event, isWebSocketStreaming, isConnected]);

  // Get WebSocket context for streaming info

  // Debug: Log the event data to see what we have
  useEffect(() => {
    console.log('🔍 Event data in LivestreamMain:', {
      event,
      isConnected,

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

  // Compute streaming URL - prioritize WebSocket context, then stream status, then event data
  const streamingUrl = React.useMemo(() => {
    console.log('🔗 Computing streaming URL with:', {
      isWebSocketStreaming,
      streamKey,
      currentStreamId,
      streamStatus,
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

    // Priority 2: Check if stream is available via status check
    if (currentStreamId && streamStatus === 'available') {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";
      const computedUrl = `${backendUrl}/livestream/${currentStreamId}/stream.m3u8`;
      console.log('✅ Computed streaming URL from stream status:', computedUrl);
      return computedUrl;
    }

    // Priority 3: Extract from NIP-53 event
    if (event) {
      const eventStreamingUrl = extractStreamingUrlFromEvent(event);
      if (eventStreamingUrl) {
        console.log('✅ Found streaming URL in event:', eventStreamingUrl);
        return eventStreamingUrl;
      }
    }

    // Priority 4: If stream is not started yet, return null to show appropriate UI
    if (currentStreamId && streamStatus === 'not_started') {
      console.log('⏳ Stream not started yet, will show waiting UI');
      return null;
    }

    // Priority 5: If event is still loading but we have a stream ID, show loading state
    if (currentStreamId && eventLoading) {
      console.log('⏳ Event is still loading, will show loading state');
      return null;
    }

    console.log('⚠️ No streaming URL found in event or WebSocket context');
    return null;
  }, [isWebSocketStreaming, streamKey, streamStatus, event, currentStreamId, eventLoading, eventError]);

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

  // // Debug: Log currentStreamId changes
  // useEffect(() => {
  //   console.log('🔄 currentStreamId changed:', {
  //     currentStreamId,
  //     previousStreamId: initialStreamId,
  //     willTriggerEventQuery: !!currentStreamId
  //   });
  // }, [currentStreamId, initialStreamId]);

  // Check stream status when streamId changes
  useEffect(() => {
    if (!currentStreamId) {
      setStreamStatus('loading');
      return;
    }

    const checkStreamStatus = async () => {
      try {
        setStreamStatus('loading');
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";
        const response = await fetch(`${backendUrl}/livestream/${currentStreamId}/status`);
        
        if (response.ok) {
          const statusData = await response.json();
          setStreamStatusData(statusData);
          
          if (statusData.overall?.isActive || statusData.overall?.hasManifest) {
            setStreamStatus('available');
            console.log('✅ Stream is available:', statusData);
          } else {
            setStreamStatus('not_started');
            console.log('⏳ Stream not started yet:', statusData);
          }
        } else {
          setStreamStatus('error');
          console.log('❌ Stream status check failed:', response.status);
        }
      } catch (error) {
        console.error('❌ Error checking stream status:', error);
        setStreamStatus('error');
      }
    };

    checkStreamStatus();

    // Set up periodic status checking for streams that aren't started yet
    let statusInterval: NodeJS.Timeout | null = null;
    if (currentStreamId) {
      statusInterval = setInterval(() => {
        // Only check if we're not already in a loading state
        if (streamStatus !== 'loading') {
          checkStreamStatus();
        }
      }, 10000); // Check every 10 seconds
    }

    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [currentStreamId, streamStatus]);

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
    // console.log('✅ Navigation state updated:', { currentStreamId: id, view: 'stream' });
    
    // Start the stream on the backend if it's not already running
    startStreamOnBackend(id);
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

  // Function to start stream on Cloudinary via backend
  const startStreamOnBackend = async (streamId: string) => {
    try {
      console.log('🚀 Starting Cloudinary stream via backend:', streamId);
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";
      
      // First check if stream is already running
      const statusResponse = await fetch(`${backendUrl}/livestream/${streamId}/status`);
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        console.log('📊 Cloudinary stream status check:', status);
        
        if (status.status === 'active' || status.cloudinaryStatus === 'active') {
          console.log('✅ Cloudinary stream is already active');
          return;
        }
      }
      
      // Start the stream in Cloudinary
      const response = await fetch(`${backendUrl}/livestream/${streamId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamId,
          action: 'start',
          timestamp: Date.now(),
          title: `Live Stream ${streamId}`,
          description: 'Live stream from Nostr event'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Cloudinary stream started:', result);
        showToast({ message: 'Cloudinary stream started successfully', type: 'success' });
        
        // Update the streaming URL to use Cloudinary
        if (result.playbackUrl) {
          console.log('🎯 Cloudinary playback URL:', result.playbackUrl);
        }
      } else {
        const error = await response.text();
        console.log('⚠️ Failed to start Cloudinary stream:', error);
        showToast({ message: `Failed to start Cloudinary stream: ${error}`, type: 'error' });
      }
    } catch (error) {
      console.error('❌ Failed to start Cloudinary stream:', error);
      showToast({ message: 'Failed to start Cloudinary stream', type: 'error' });
    }
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
              streamId={currentStreamId}
              streamStatus={streamStatus}
              onRefreshStatus={() => {
                // Trigger a manual status check
                if (currentStreamId) {
                  setStreamStatus('loading');
                  // The useEffect will automatically check the status again
                }
              }}
              onStreamError={(error) => {
                console.log('🚨 Stream error in StreamVideoPlayer:', error);
                if (error.includes('Stream not found') || error.includes('not started')) {
                  showToast({ message: 'Stream not started. Attempting to start...', type: 'warning' });
                  // Retry starting the stream
                  if (currentStreamId) {
                    setTimeout(() => startStreamOnBackend(currentStreamId), 1000);
                  }
                }
              }}
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
