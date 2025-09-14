'use client';
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth, useGetLiveEvents, useLiveActivity } from 'afk_nostr_sdk';
import styles from './styles.module.scss';
import { Icon } from '../small/icon-component';
import { useUIStore } from '@/store/uiStore';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { EventLivestreamNostr } from '@/store/livestream';


interface StudioModuleProps {
  onNavigateToStream?: (streamId: string, note?:NDKEvent) => void;
  onNavigateToStreamView?: (streamId: string, recordingUrl?: string, note?:NDKEvent) => void;
  onNavigateToRecordView?: (streamId: string, note?:NDKEvent) => void;
  onNavigateToHostStudio?: (streamId: string, note?:NDKEvent) => void;
  onViewEventFromNostr?: (streamId: string) => void;
}

export const StudioModule: React.FC<StudioModuleProps> = ({
  onNavigateToStream,
  onNavigateToStreamView,
  onNavigateToRecordView,
  onNavigateToHostStudio,
  onViewEventFromNostr,
}) => {
  const { publicKey } = useAuth();
  const {showToast, showModal} = useUIStore();
  const { data, isFetching, refetch, isPending, isLoading } = useGetLiveEvents({
    limit: 10,
  });
  console.log('data livestream events', data);
  const queryClient = useQueryClient();
  const [isModalVisible, setModalVisible] = useState(false);

  const handleNavigate = (id: string, note?:NDKEvent) => {
    onNavigateToStream?.(id, note);
  };

  const handleNavigateToStreamView = (id: string, recordingUrl?: string, note?:NDKEvent) => {
    onNavigateToStreamView?.(id, recordingUrl, note);
  };

  const handleNavigateToRecordView = (id: string, note?:NDKEvent) => {
    onNavigateToRecordView?.(id, note);
  };

  if (isPending && isFetching) {
    return (
      <div className={styles.container}>
        <div className={styles.scrollContent}>
          <div className={styles.loadingSpinner}></div>
        </div>
      </div>
    );
  }

  if (data?.pages?.flat().length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.scrollContent}>
          <h1 className={styles.headerText}>Stream Studio Events</h1>
          <RenderEmptyState
            isVisible={isModalVisible}
            handleModalOpen={() => setModalVisible(!isModalVisible)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.scrollContent}>
        {isFetching && !isPending && (
          <div className={styles.container}>
            <div className={styles.scrollContent}>
              <div className={styles.loadingSpinner}></div>
            </div>
          </div>
        )}
        
        {data?.pages?.flat().length === 0 && (
          <div className={styles.container}>
            <div className={styles.scrollContent}>
              <RenderEmptyState
                isVisible={isModalVisible}
                handleModalOpen={() => setModalVisible(!isModalVisible)}
                isEmpty={true}
              />
            </div>
          </div>
        )}

        <h1 className={styles.headerText}>Stream Studio Events</h1>
        
        <div className={styles.eventsList}>
          {data?.pages.flat().map((item: any) => (
            <RenderEventCard
              key={item.eventId}
              handleNavigateToStreamView={() => handleNavigateToStreamView(item.identifier, item.recordingUrl, item)}
              streamKey={item.identifier}
              handleNavigation={() => handleNavigate(item.identifier, item as NDKEvent)}
              pubKey={publicKey}
              recordingUrl={item.recordingUrl}
              event={item}
              onNavigateToHostStudio={() => onNavigateToHostStudio?.(item.identifier, item as NDKEvent)}
            />
          ))}
        </div>
      </div>

      <button 
        className={styles.floatingCreateButton} 
        onClick={() => {
          setModalVisible(true);
          console.log('Create button clicked');
          showModal(<CreateEventModal handleModal={() => setModalVisible(false)} />)
        }}
        aria-label="Create new event"
      >
        <Icon name="CreateIcon" size={24} />
      </button>

      {isModalVisible && (
        <CreateEventModal handleModal={() => setModalVisible(false)} />
      )}
    </div>
  );
};

const RenderEventCard: React.FC<{
  event: EventLivestreamNostr;
  pubKey: string;
  handleNavigation: () => void;
  handleNavigateToStreamView: () => void;
  streamKey: string;
  recordingUrl?: string;
  onNavigateToHostStudio?: (streamId: string, note?:NDKEvent) => void;
  onViewEventFromNostr?: (streamId: string, note?:EventLivestreamNostr | NDKEvent) => void;
}> = ({ event, pubKey, handleNavigation, handleNavigateToStreamView, streamKey, recordingUrl, onNavigateToHostStudio, onViewEventFromNostr }) => {
  const isStreamer = false;
  const isOwner = event?.participants.findIndex(
    (item) => item.pubkey === pubKey && item.role === 'Host'
  ) !== -1;

  const { addParticipant } = useLiveActivity();

  const handleStartStudio = () => {
    if (onNavigateToHostStudio) {
      onNavigateToHostStudio(event.identifier, event);
    }
  };

  const handleJoinEvent = async () => {
    if (!pubKey) {
      // Show toast or error message
      return;
    }

    // First join as participant
    addParticipant.mutate(
      {
        pubkey: pubKey,
        role: 'Participant',
        identifier: event.identifier,
      },
      {
        onSuccess() {
          // Then use the enhanced VIEW EVENT handler
          if (onViewEventFromNostr) {
            onViewEventFromNostr(event.identifier, event);
          } else {
            // Fallback to old behavior
            handleNavigateToStreamView();
          }
        },
        onError(error) {
          // Show error toast
          console.error('Error joining Stream:', error);
        },
      },
    );
  };

  return (
    <div key={event.eventId} className={styles.eventCard}>
      <div className={styles.eventHeader}>
        <h3 className={styles.eventTitle}>{event.title}</h3>

        <div className={styles.statusContainer}>
          <span
            className={`${styles.statusBadge} ${
              event?.status === 'planned'
                ? styles.statusPlanned
                : event?.status === 'live'
                ? styles.statusLive
                : styles.statusEnded
            }`}
          >
            {event?.status}
          </span>
          {isOwner && <span className={styles.hostBadge}>Host</span>}
        </div>
      </div>
      
      <p className={styles.eventDescription}>{event.summary}</p>
      
      <div className={styles.tagContainer}>
        <div className={styles.hashTagsContainer}>
          {event?.hashtags?.map((hashTag, index) => (
            <span key={index} className={styles.hashTag}>
              #{hashTag}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.actionButtons}>
        {isOwner ? (
          <div className={styles.hostActionButtons}>
            <button className={styles.viewButton} onClick={handleNavigation}>
              View Event
            </button>
            <button className={`${styles.viewButton} ${styles.startStudioButton}`} onClick={handleStartStudio}>
              🎬 Start Studio
            </button>
          </div>
        ) : (
          <button className={styles.viewButton} onClick={handleJoinEvent}>
            Join Event
          </button>
        )}
      </div>
    </div>
  );
};

const RenderEmptyState: React.FC<{
  handleModalOpen: () => void;
  isVisible: boolean;
  isEmpty?: boolean;
}> = ({ handleModalOpen, isVisible, isEmpty }) => {
  const {showModal} = useUIStore();
  return (
    <div className={styles.emptyStateContainer}>
      {/* <Icon name="calendar" size={64} className={styles.emptyStateIcon} /> */}
      {isEmpty && <p className={styles.emptyStateText}>No events available</p>}
      <button className={styles.createButton} onClick={() => {
        handleModalOpen();
        showModal(<CreateEventModal handleModal={() => handleModalOpen()} />)
      }}>
        <Icon name="CreateIcon" size={20} />
        <span>Create Event</span>
      </button>
    </div>
  );
};

export const CreateEventModal: React.FC<{ handleModal: () => void }> = ({ handleModal }) => {
  const queryClient = useQueryClient();
  const { publicKey } = useAuth();
  const { createEvent } = useLiveActivity();

  const [newEvent, setNewEvent] = useState<Partial<EventLivestreamNostr>>({
    title: '',
    summary: '',
    hashtags: [],
    status: 'planned',
  });

  const handleCreateEvent = async () => {
    if (newEvent.title && newEvent.status && newEvent.summary) {
      createEvent.mutate(
        {
          title: newEvent?.title,
          identifier: publicKey,
          status: newEvent?.status as any,
          summary: newEvent?.summary,
          participants: [
            {
              pubkey: publicKey,
              role: 'Host',
              relay: '',
            },
          ],
          currentParticipants: 1,
          hashtags: newEvent.hashtags || [],
          totalParticipants: 1,
        },
        {
          onSuccess() {
            // Show success toast
            queryClient.invalidateQueries({ queryKey: ['liveEvents'] });
            handleModal();
          },
          onError() {
            // Show error toast
            console.error('Error creating event');
          },
        },
      );
    }
  };

  return (
    <div 
    // className={styles.modalOverlay} 
    onClick={handleModal}
    >
      <div className={styles.modalView} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Create New Event</h2>
        
        <input
          className={styles.input}
          type="text"
          placeholder="Event Title"
          value={newEvent.title}
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
        />
        
        <textarea
          className={`${styles.input} ${styles.textArea}`}
          placeholder="Event Description"
          value={newEvent.summary}
          onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
          rows={4}
        />
        
        <input
          className={styles.input}
          type="text"
          placeholder="Tags (comma-separated)"
          value={newEvent.hashtags?.join(', ')}
          onChange={(e) =>
            setNewEvent({ 
              ...newEvent, 
              hashtags: e.target.value.split(',').map((tag) => tag.trim()) 
            })
          }
        />

        <select
          className={styles.picker}
          value={newEvent.status}
          onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value })}
        >
          {['planned', 'live', 'ended'].map((val) => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>

        <div className={styles.modalButtons}>
          <button
            disabled={createEvent.isPending}
            className={styles.modalButton}
            onClick={handleCreateEvent}
          >
            {createEvent.isPending ? 'Creating...' : 'Create Event'}
          </button>
          <button className={`${styles.modalButton} ${styles.cancelButton}`} onClick={handleModal}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
