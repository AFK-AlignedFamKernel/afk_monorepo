import React, { useState, useEffect } from 'react';
import { useAuth, useGetSingleEvent } from 'afk_nostr_sdk';
import { StudioModule } from './StudioModule';
import { LiveChat } from './LiveChat';
import { StreamVideoPlayer } from './StreamVideoPlayer';
import { HostStudio } from './HostStudio';
import styles from './styles.module.scss';
import { Icon } from '../small/icon-component';

interface LivestreamMainProps {
  streamId?: string;
  isStreamer?: boolean;
  className?: string;
}

export const LivestreamMain: React.FC<LivestreamMainProps> = ({
  streamId,
  isStreamer = false,
  className,
}) => {
  const { publicKey } = useAuth();
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentView, setCurrentView] = useState<'studio' | 'stream' | 'chat' | 'host-studio'>('studio');

  const { data: event } = useGetSingleEvent({
    eventId: streamId || '',
  });

  useEffect(() => {
    if (streamId) {
      setCurrentView('stream');
    }
  }, [streamId]);

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
            streamingUrl={event?.streamingUrl}
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
              streamId={streamId || ''}
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
        streamId={streamId || ''}
        isVisible={true}
        className={styles.fullScreenChat}
      />
    </div>
  );

  const renderHostStudioView = () => (
    <HostStudio
      streamId={streamId || ''}
      onGoLive={() => {
        setCurrentView('stream');
        setIsStreaming(true);
      }}
      onBack={() => setCurrentView('studio')}
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
