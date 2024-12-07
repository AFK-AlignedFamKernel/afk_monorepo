import {Feather} from '@expo/vector-icons';
import {Picker} from '@react-native-picker/picker';
import {useQueryClient} from '@tanstack/react-query';
import {useAuth, useGetLiveEvents, useLiveActivity} from 'afk_nostr_sdk';
import React, {useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import Badge from '../../components/Badge';
import {LoadingSpinner} from '../../components/Loading';
import {useSocketContext} from '../../context/SocketContext';
// import {DatePicker} from '../../components/DateComponent';
import {useNostrAuth, useStyles, useTheme} from '../../hooks';
import {useToast} from '../../hooks/modals';
import {StreamStudio} from '../../types';
import styleSheet from './event.styles';
import {useWebStream} from './stream/useWebStream';

type Event = {
  identifier: string;
  eventId: string;
  title: string;
  summary: string;
  status: string;
  startDate: Date;
  endDate: Date;
  hashtags: string[];
  participants: {
    role: 'Host' | 'Speaker' | 'Participant';
    pubkey: string;
  }[];
};

export const StudioModuleView: React.FC<StreamStudio> = ({navigation, route}) => {
  const {publicKey} = useAuth();
  const {data, isFetching, refetch, isPending} = useGetLiveEvents({
    limit: 100,
  });

  const {theme} = useTheme();
  const styles = useStyles(styleSheet);

  const [isModalVisible, setModalVisible] = useState(false);

  const handleNavigate = (id: string) => {
    navigation.navigate('WatchStream', {streamId: id});
  };

  const handleNavigateToStreamView = (id: string) => {
    navigation.navigate('ViewStreamGuest', {streamId: id});
  };

  if (isPending) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.scrollContent}>
          <Text style={styles.headerText}>Stream Studio Events</Text>
          <ActivityIndicator></ActivityIndicator>;
        </SafeAreaView>
      </View>
    );
  }

  if (data?.pages?.flat().length === 0) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.scrollContent}>
          <Text style={styles.headerText}>Stream Studio Events</Text>
          <RenderEmptyState
            isVisible={isModalVisible}
            handleModalOpen={() => setModalVisible(!isModalVisible)}
          />
          ;
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.scrollContent}>
        <Text style={styles.headerText}>Stream Studio Events</Text>
        <FlatList
          data={data?.pages.flat()}
          renderItem={({item}) => (
            <RenderEventCard
              handleNavigateToStreamView={() => handleNavigateToStreamView(item.identifier)}
              streamKey={item.identifier}
              handleNavigation={() => handleNavigate(item.identifier)}
              pubKey={publicKey}
              event={item}
            />
          )}
          keyExtractor={(item: any) => item.eventId}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />}
          // onEndReached={() => fetchNextPage()}
        />
      </SafeAreaView>

      <TouchableOpacity style={styles.floatingCreateButton} onPress={() => setModalVisible(true)}>
        <Feather name="plus" size={24} color={theme.colors.streamStudio_buttonText} />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <CreateEventModal handleModal={() => setModalVisible(false)} />
      </Modal>
    </View>
  );
};

export const RenderEventCard = ({
  event,
  pubKey,
  handleNavigation,
  streamKey,
  handleNavigateToStreamView,
}: {
  event: Event;
  pubKey: string;
  handleNavigation: () => void;
  handleNavigateToStreamView: () => void;
  streamKey: string;
}) => {
  const isStreamer = false;
  const {socketRef, isConnected} = useSocketContext();
  const toast = useToast();
  const {theme} = useTheme();
  const styles = useStyles(styleSheet);
  const isOwner =
    event?.participants.findIndex((item) => item.pubkey === pubKey && item.role === 'Host') !== -1
      ? true
      : false;

  const {addParticipant} = useLiveActivity();
  const {handleCheckNostrAndSendConnectDialog} = useNostrAuth();

  const {joinStream} = useWebStream({
    socketRef,
    streamerUserId: pubKey,
    streamKey,
    isStreamer,
    isConnected,
  });

  const handleJoinEvent = async () => {
    await handleCheckNostrAndSendConnectDialog();

    if (!pubKey) {
      toast.showToast({title: 'Must be signed in', type: 'error'});
      return;
    }

    addParticipant.mutate(
      {
        pubkey: pubKey,
        role: 'Participant',
        identifier: event.identifier,
      },
      {
        onSuccess() {
          handleNavigateToStreamView();
          //Emit join stream socket
          joinStream();
        },
        onError(error) {
          toast.showToast({title: 'Error joining Stream', type: 'error'});
        },
      },
    );
  };

  return (
    <View key={event.eventId} style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle}>{event.title}</Text>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 4,
          }}
        >
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  event?.status === 'planned'
                    ? theme.colors.primary
                    : theme.colors.streamStudio_pendingStatus,
              },
            ]}
          >
            <Text style={styles.statusText}>{event?.status}</Text>
          </View>
          {isOwner ? <Badge value="Host" /> : ''}
        </View>
      </View>
      <Text style={styles.eventDescription}>{event.summary}</Text>
      <View style={styles.tagContainer}>
        <View style={styles.hashTagsContainer}>
          {event?.hashtags?.map((hashTag, index) => (
            <View key={index}>
              <Badge value={`#${hashTag}`} />
            </View>
          ))}
        </View>
        {/* ))} */}
      </View>

      <View
        style={{
          display: 'flex',
          gap: 4,
          flex: 1,
          flexDirection: 'row',
        }}
      >
        {isOwner ? (
          <TouchableOpacity style={styles.viewButton} onPress={handleNavigation}>
            <Text style={styles.viewButtonText}>View Event</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.viewButton} onPress={handleJoinEvent}>
            <Text style={styles.viewButtonText}>Join Event</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const RenderEmptyState = ({
  handleModalOpen,
  isVisible,
}: {
  handleModalOpen: () => void;
  isVisible: boolean;
}) => {
  const {theme} = useTheme();
  const styles = useStyles(styleSheet);
  return (
    <>
      <View style={styles.emptyStateContainer}>
        <Feather name="calendar" size={64} color={theme.colors.streamStudio_textSecondary} />
        <Text style={styles.emptyStateText}>No events available</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => handleModalOpen()}>
          <Feather name="plus" size={20} color={theme.colors.streamStudio_buttonText} />
          <Text style={styles.createButtonText}>Create Event</Text>
        </TouchableOpacity>
      </View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isVisible}
        onRequestClose={() => handleModalOpen()}
      >
        <CreateEventModal handleModal={() => handleModalOpen()} />
      </Modal>
    </>
  );
};

function CreateEventModal({handleModal}: {handleModal: () => void}) {
  const queryClient = useQueryClient();
  const {showToast} = useToast();
  const {publicKey} = useAuth();

  const {createEvent} = useLiveActivity();

  const styles = useStyles(styleSheet);
  const {theme} = useTheme();
  // const [startDate, setStartDate] = useState(new Date());
  // const [endDate, setEndDate] = useState(new Date());
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    summary: '',
    hashtags: [],
    status: 'planned',
    // startDate: new Date(),
    // endDate: new Date(),
  });
  const handleCreateEvent = () => {
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

          // startsAt: newEvent.startDate,
          // endsAt: newEvent.endDate,
        },
        {
          onSuccess() {
            showToast({title: 'Event Created Successfully', type: 'success'});
            queryClient.invalidateQueries({queryKey: ['liveEvents']});
            handleModal();
          },
          onError() {
            showToast({title: 'Error creating event', type: 'error'});
          },
        },
      );
    }
  };
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalView}>
        <Text style={styles.modalTitle}>Create New Event</Text>
        <TextInput
          style={styles.input}
          placeholder="Event Title"
          placeholderTextColor={theme.colors.inputPlaceholder}
          value={newEvent.title}
          onChangeText={(text) => setNewEvent({...newEvent, title: text})}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Event Description"
          placeholderTextColor={theme.colors.inputPlaceholder}
          value={newEvent.summary}
          onChangeText={(text) => setNewEvent({...newEvent, summary: text})}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Tags (comma-separated)"
          placeholderTextColor={theme.colors.inputPlaceholder}
          value={newEvent.hashtags?.join(', ')}
          onChangeText={(text) =>
            setNewEvent({...newEvent, hashtags: text.split(',').map((tag) => tag.trim())})
          }
        />

        <Picker
          selectedValue={newEvent.status}
          style={styles.picker}
          onValueChange={(text) => setNewEvent({...newEvent, status: text})}
        >
          {['planned', 'live', 'ended'].map((val) => (
            <Picker.Item
              key={val}
              label={val}
              value={val}
              color={theme.colors.streamStudio_inputText}
            />
          ))}
        </Picker>

        {/* <View
          style={{
            display: 'flex',
            gap: 14,
            marginTop: 4,
            marginBottom: 10,
          }}
        >
          <View>
            <Text style={styles.dateLabel}>Start Date and Time</Text>

            <DatePicker onDateChange={(date) => setEndDate(date)} initialDate={startDate} />
          </View>

          <View>
            <Text style={styles.dateLabel}>End Date and Time</Text>
            <DatePicker onDateChange={(date) => setEndDate(date)} initialDate={endDate} />
          </View>
        </View> */}
        <TouchableOpacity
          disabled={createEvent.isPending}
          style={styles.modalButton}
          onPress={handleCreateEvent}
        >
          <Text style={styles.modalButtonText}>Create Event</Text>
          {createEvent.isPending && <LoadingSpinner />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleModal}>
          <Text style={styles.modalButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
