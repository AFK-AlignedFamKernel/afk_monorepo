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
  const { data: event } = useGetSingleEvent({
    eventId: currentStreamId || '',
  });

  // Get WebSocket context for streaming info
  const { isStreaming: isWebSocketStreaming, streamKey } = useLivestreamWebSocket();

  // Debug: Log the event data to see what we have
  useEffect(() => {
    console.log('Event data in LivestreamMain:', {
      event,
      eventId: currentStreamId,
      isWebSocketStreaming,
      streamKey
    });
  }, [event, currentStreamId, isWebSocketStreaming, streamKey]);

  // Compute streaming URL - prioritize WebSocket context over event data
  const streamingUrl = React.useMemo(() => {
    console.log('Computing streaming URL with:', {
      isWebSocketStreaming,
      streamKey,
      eventStreamingUrl: event?.streamingUrl,
      eventContent: event?.content,
      eventTags: event?.tags
    });

    if (isWebSocketStreaming && streamKey) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";
      const computedUrl = `${backendUrl}/livestream/${streamKey}/stream.m3u8`;
      console.log('Computed streaming URL from WebSocket context:', computedUrl);
      return computedUrl;
    }

    // Try to get streaming URL from event data
    let eventStreamingUrl = event?.streamingUrl;
    
    // If not in streamingUrl field, check content and tags
    if (!eventStreamingUrl && event?.content) {
      try {
        const content = JSON.parse(event.content);
        eventStreamingUrl = content.streamingUrl || content.stream_url || content.url;
        console.log('Extracted streaming URL from event content:', eventStreamingUrl);
      } catch (e) {
        console.log('Event content is not JSON:', event.content);
      }
    }

    // Check tags for streaming URL
    if (!eventStreamingUrl && event?.tags) {
      const streamingTag = event.tags.find(tag => 
        tag[0] === 'streaming_url' || tag[0] === 'stream_url' || tag[0] === 'url'
      );
      if (streamingTag) {
        eventStreamingUrl = streamingTag[1];
        console.log('Extracted streaming URL from event tags:', eventStreamingUrl);
      }
    }

    console.log('Final streaming URL:', eventStreamingUrl);
    return eventStreamingUrl;
  }, [isWebSocketStreaming, streamKey, event]);

  // Update streaming state when WebSocket streaming changes
  useEffect(() => {
    setIsStreaming(isWebSocketStreaming);
  }, [isWebSocketStreaming]);

  //   useEffect(() => {
  //     if (currentStreamId) {
  //     //   setCurrentView('stream');
  //     }
  //   }, [currentStreamId]);

  const handleNavigateToStream = (id: string) => {
    setCurrentView('stream');
    // You would typically navigate to the stream view here
    console.log('Navigating to stream:', id);
  };

  const handleNavigateToStreamView = (id: string, recordingUrl?: string) => {
    setCurrentView('stream');
    // You would typically navigate to the stream view here
    console.log('Navigating to stream view:', id, recordingUrl);
  };

  const handleNavigateToRecordView = (id: string) => {
    setCurrentView('stream');
    // You would typically navigate to the recorded stream view here
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
          {/* <Icon name="ArrowLeftIcon" size={24} /> */}
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
          <StreamVideoPlayer
            streamingUrl={streamingUrl}
            recordingUrl={event?.recordingUrl}
            isStreamer={isStreamer}
            onStreamStart={handleStreamStart}
            onStreamStop={handleStreamStop}
            className={styles.mainVideoPlayer}
          />
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
