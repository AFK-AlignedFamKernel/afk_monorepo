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
const extractStreamingUrlFromEvent = (event: any, streamId?: string): string | null => {
  if (!event) return null;
  
  console.log('🔍 Extracting streaming URL from event:', {
    eventKeys: Object.keys(event || {}),
    hasTags: !!event?.tags,
    hasContent: !!event?.content,
    streamingUrlField: event?.streamingUrl,
    streamId
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
  
  // If no streaming URL found in event but we have a streamId, construct one
  if (streamId) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";
    const constructedUrl = `${backendUrl}/livestream/${streamId}/stream.m3u8`;
    console.log('🔧 Constructing streaming URL from stream ID:', constructedUrl);
    return constructedUrl;
  }
  
  console.log('❌ No streaming URL found in event and no stream ID provided');
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
      initialStreamId,
      eventId: currentStreamId || '',
      eventLoading,
      eventError,
      hasEvent: !!event,
      eventData: event,
      isWebSocketStreaming,
      isConnected,
      // Check if this matches the actual stream file
      actualStreamFileExists: currentStreamId === 'c71e86b68f9acf510d4d9bc982c76ca8',
      actualStreamFile: 'c71e86b68f9acf510d4d9bc982c76ca8'
    });
  }, [currentStreamId, initialStreamId, eventLoading, eventError, event, isWebSocketStreaming, isConnected]);

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
      extractedStreamingUrl: extractStreamingUrlFromEvent(event, currentStreamId),
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

    // Priority 2: If we have a stream ID and it's active (even without video content), construct URL
    if (currentStreamId && (streamStatus === 'available' || streamStatus === 'loading')) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";
      const computedUrl = `${backendUrl}/livestream/${currentStreamId}/stream.m3u8`;
      console.log('✅ Computed streaming URL from stream status:', computedUrl);
      return computedUrl;
    }

    // Priority 3: Extract from NIP-53 event (with stream ID fallback)
    if (event) {
      const eventStreamingUrl = extractStreamingUrlFromEvent(event, currentStreamId);
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

  // Debug: Log stream status changes
  useEffect(() => {
    console.log('🔄 Stream status changed:', {
      streamStatus,
      currentStreamId,
      streamingUrl,
      willShowLive: streamStatus === 'available'
    });
  }, [streamStatus, currentStreamId, streamingUrl]);

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

    console.log('🔄 Stream ID changed, checking status for:', currentStreamId);

    const checkStreamStatus = async () => {
      try {
        setStreamStatus('loading');
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";
        const statusUrl = `${backendUrl}/livestream/${currentStreamId}/status`;
        
        console.log('🔍 Checking stream status for:', {
          currentStreamId,
          statusUrl,
          actualStreamFile: 'c71e86b68f9acf510d4d9bc982c76ca8',
          matches: currentStreamId === 'c71e86b68f9acf510d4d9bc982c76ca8'
        });
        
        const response = await fetch(statusUrl);
        
        if (response.ok) {
          const statusData = await response.json();
          console.log('📊 Stream status response:', statusData);
          setStreamStatusData(statusData);
          
          // Check if stream is available for viewing
          // A stream is available if it's active and has a manifest, even without video content
          // This allows viewers to connect to streams that are waiting for broadcasters
          if (statusData.overall?.isActive && statusData.overall?.hasManifest) {
            setStreamStatus('available');
            console.log('✅ Stream is available for viewing (active with manifest):', {
              hasVideoContent: statusData.overall?.hasVideoContent,
              isActive: statusData.overall?.isActive,
              hasManifest: statusData.overall?.hasManifest,
              hasStreamDir: statusData.overall?.hasStreamDir
            });
          } else if (statusData.overall?.hasVideoContent) {
            // Stream has actual video content (broadcaster is live)
            setStreamStatus('available');
            console.log('✅ Stream has video content and is live:', {
              hasVideoContent: statusData.overall?.hasVideoContent,
              isActive: statusData.overall?.isActive,
              hasManifest: statusData.overall?.hasManifest,
              hasStreamDir: statusData.overall?.hasStreamDir
            });
          } else {
            setStreamStatus('not_started');
            console.log('⏳ Stream not started yet:', {
              hasVideoContent: statusData.overall?.hasVideoContent,
              isActive: statusData.overall?.isActive,
              hasManifest: statusData.overall?.hasManifest,
              hasStreamDir: statusData.overall?.hasStreamDir
            });
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

    // Check immediately
    checkStreamStatus();

    // Set up periodic status checking for streams that aren't started yet
    let statusInterval: NodeJS.Timeout | null = null;
    if (currentStreamId) {
      statusInterval = setInterval(() => {
        // Only check if we're not already in a loading state
        if (streamStatus !== 'loading') {
          console.log('🔄 Periodic status check for:', currentStreamId);
          checkStreamStatus();
        }
      }, 5000); // Check every 5 seconds for faster response
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
    
    // For viewers, we need to connect to the existing stream, not start a new one
    // The stream should already be running if it's marked as "LIVE"
    console.log('🎯 Viewer navigating to stream view - connecting to existing stream');
    
    // Check if this is a live stream that should be accessible
    if (id) {
      // Trigger a status check to see if the stream is actually live
      console.log('🔍 Checking if stream is live and accessible:', id);
      
      // Set loading state while we check
      setStreamStatus('loading');
      
      // The useEffect will automatically check the stream status
      // and update the streamingUrl when the status changes
    }
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

  // Manual refresh function for viewers
  const handleRefreshStreamStatus = async () => {
    if (!currentStreamId) return;
    
    console.log('🔄 Manual refresh requested for stream:', currentStreamId);
    setStreamStatus('loading');
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";
      const response = await fetch(`${backendUrl}/livestream/${currentStreamId}/status`);
      
      if (response.ok) {
        const statusData = await response.json();
        setStreamStatusData(statusData);
        
        console.log('📊 Manual refresh - Stream status response:', statusData);
        
        if (statusData.overall?.hasVideoContent || statusData.overall?.isActive) {
          setStreamStatus('available');
          console.log('✅ Manual refresh - Stream is available for viewing');
        } else {
          setStreamStatus('not_started');
          console.log('⏳ Manual refresh - Stream not started yet');
        }
      } else {
        setStreamStatus('error');
        console.log('❌ Manual refresh - Stream status check failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Manual refresh - Error checking stream status:', error);
      setStreamStatus('error');
    }
  };

  // Temporary test function to check the actual stream ID
  const handleTestActualStream = async () => {
    const actualStreamId = 'c71e86b68f9acf510d4d9bc982c76ca8';
    console.log('🧪 Testing with actual stream ID:', actualStreamId);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";
      const response = await fetch(`${backendUrl}/livestream/${actualStreamId}/status`);
      
      if (response.ok) {
        const statusData = await response.json();
        console.log('🧪 Actual stream status response:', statusData);
        
        // Check if this stream is actually available
        if (statusData.overall?.hasVideoContent || statusData.overall?.isActive) {
          console.log('✅ Actual stream IS available!');
          // Update the current stream ID to the correct one
          setCurrentStreamId(actualStreamId);
          setStreamStatus('available');
        } else {
          console.log('⏳ Actual stream not available either');
        }
      } else {
        console.log('❌ Actual stream status check failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Error checking actual stream status:', error);
    }
  };

  // Function to check the actual HLS manifest content
  const handleCheckManifestContent = async () => {
    if (!currentStreamId) return;
    
    console.log('📋 Checking HLS manifest content for:', currentStreamId);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";
      const manifestUrl = `${backendUrl}/livestream/${currentStreamId}/stream.m3u8`;
      
      console.log('🔗 Fetching manifest from:', manifestUrl);
      
      const response = await fetch(manifestUrl);
      if (response.ok) {
        const manifestContent = await response.text();
        console.log('📋 HLS Manifest Content:', manifestContent);
        
        // Analyze the manifest
        const hasEndList = manifestContent.includes('#EXT-X-ENDLIST');
        const hasSegments = manifestContent.includes('.ts');
        const lineCount = manifestContent.split('\n').length;
        
        console.log('📊 Manifest Analysis:', {
          hasEndList,
          hasSegments,
          lineCount,
          isEmpty: lineCount <= 5, // Basic HLS manifest has ~5 lines
          isReady: !hasEndList && hasSegments
        });
        
        if (hasEndList) {
          console.log('❌ Manifest has ENDLIST - stream is finished/empty');
        }
        if (!hasSegments) {
          console.log('❌ Manifest has no video segments (.ts files)');
        }
        if (!hasEndList && hasSegments) {
          console.log('✅ Manifest is ready for playback!');
        }
      } else {
        console.log('❌ Failed to fetch manifest:', response.status);
      }
    } catch (error) {
      console.error('❌ Error checking manifest content:', error);
    }
  };

  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  // Enhanced function to handle VIEW EVENT from Nostr
  const handleViewEventFromNostr = async (streamId: string) => {
    console.log('🎬 VIEW EVENT clicked from Nostr for stream:', streamId);
    
    try {
      // Set the stream ID and view
      setCurrentStreamId(streamId);
      setCurrentView('stream');
      
      // Initialize the stream for viewing
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";
      
      // First, check if stream exists and initialize it if needed
      const statusResponse = await fetch(`${backendUrl}/livestream/${streamId}/status`);
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('📊 Stream status for VIEW EVENT:', statusData);
        
        if (statusData.overall?.isActive) {
          setStreamStatus('available');
          console.log('✅ Stream is active and ready for viewing');
          
          // If stream has video content, it's live
          if (statusData.overall?.hasVideoContent) {
            console.log('🎬 Stream is LIVE with video content!');
            showToast({ message: 'Live stream loaded successfully!', type: 'success' });
          } else {
            console.log('⏳ Stream is active but waiting for host to go live');
            showToast({ message: 'Stream is ready - waiting for host to start broadcasting', type: 'info' });
          }
        } else {
          setStreamStatus('not_started');
          console.log('⏳ Stream not started yet');
          showToast({ message: 'Stream not started yet', type: 'warning' });
        }
      } else {
        // Stream doesn't exist, try to initialize it
        console.log('🔄 Stream not found, attempting to initialize...');
        setStreamStatus('loading');
        
        try {
          const manifestResponse = await fetch(`${backendUrl}/livestream/${streamId}/stream.m3u8`);
          if (manifestResponse.ok) {
            console.log('✅ Stream initialized successfully');
            setStreamStatus('available');
            showToast({ message: 'Stream initialized and ready for viewing', type: 'success' });
          } else {
            console.log('❌ Failed to initialize stream');
            setStreamStatus('error');
            showToast({ message: 'Failed to initialize stream', type: 'error' });
          }
        } catch (initError) {
          console.error('❌ Error initializing stream:', initError);
          setStreamStatus('error');
          showToast({ message: 'Failed to initialize stream', type: 'error' });
        }
      }
      
    } catch (error) {
      console.error('❌ Error handling VIEW EVENT:', error);
      setStreamStatus('error');
      showToast({ message: 'Failed to load stream', type: 'error' });
    }
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
        onViewEventFromNostr={handleViewEventFromNostr}
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
            {(isStreaming || streamStatus === 'available') ? (
              <span className={styles.liveStatus}>
                <span className={styles.liveDot}></span>
                LIVE
              </span>
            ) : (
              <span className={styles.offlineStatus}>OFFLINE</span>
            )}
          </div>
          {/* Temporary test buttons for debugging */}
          <button
            onClick={handleTestActualStream}
            style={{
              marginLeft: '10px',
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            title="Test with actual stream ID (c71e86b68f9acf510d4d9bc982c76ca8)"
          >
            🧪 Test Actual Stream
          </button>
          <button
            onClick={handleCheckManifestContent}
            style={{
              marginLeft: '10px',
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            title="Check HLS manifest content"
          >
            📋 Check Manifest
          </button>
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
              onRefreshStatus={handleRefreshStreamStatus}
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
