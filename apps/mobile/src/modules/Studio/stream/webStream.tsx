import {Feather, MaterialIcons} from '@expo/vector-icons';
import {useQueryClient} from '@tanstack/react-query';
import {useEditEvent, useGetSingleEvent} from 'afk_nostr_sdk';
import {useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {Socket} from 'socket.io-client';

import {CLOUDFARE_BUCKET_URL} from '../../../constants/env';
import {useStyles} from '../../../hooks';
import {useToast} from '../../../hooks/modals';
import stylesheet from './styles';
import {useStreamCanvas} from './useCanvas';
import {useWebStream} from './useWebStream';

interface PreStreamProps {
  streamKey: string;
  startStream: () => void;
  navigateToStream: () => void;
  socketRef: React.MutableRefObject<Socket | null>;
  streamingUrl?: string;
}

export interface IWebStreamProps {
  socketRef: React.MutableRefObject<Socket | null>;
  streamKey: string;
  isStreamer: boolean;
  streamerUserId: string;
  toggleChat: () => void;
  navigateToPreStream?: () => void;
  streamingUrl?: string;
}

export function WebStreamCompositionComponent({
  toggleChat,
  streamKey,
  streamerUserId,
  socketRef,
}: IWebStreamProps) {
  const [showStream, setShowStream] = useState(false);

  const isStreamer = true;

  const {streamingUrl} = useWebStream({
    isStreamer,
    socketRef,
    streamerUserId,
    streamKey,
    isConnected: socketRef?.current?.connected as any,
  });
  const {startStream} = useStreamCanvas({
    isStreamer,
    socketRef,
    streamerUserId,
    streamKey,
  });

  if (!showStream) {
    return (
      <PreStreamComponent
        socketRef={socketRef}
        navigateToStream={() => setShowStream(true)}
        startStream={startStream}
        streamKey={streamKey}
        streamingUrl={streamingUrl}
      />
    );
  }

  return (
    <WebStreamComponent
      navigateToPreStream={() => setShowStream(false)}
      toggleChat={toggleChat}
      streamerUserId={streamerUserId}
      isStreamer={isStreamer}
      socketRef={socketRef}
      streamKey={streamKey}
      streamingUrl={streamingUrl}
    />
  );
}

export function PreStreamComponent({streamKey, navigateToStream}: PreStreamProps) {
  const queryClient = useQueryClient();
  const styles = useStyles(stylesheet);
  const toast = useToast();
  const updateEvent = useEditEvent();
  const {data: event} = useGetSingleEvent({
    eventId: streamKey,
  });

  const handleStartStream = () => {
    updateEvent.mutate(
      {
        eventId: streamKey,
        status: 'live',
        streamingUrl: `${CLOUDFARE_BUCKET_URL}/livestream/${streamKey}/stream.m3u8`,
        shouldMarkDelete: false,
      },
      {
        onSuccess() {
          toast.showToast({
            title: 'Stream started successfully',
            type: 'success',
          });
          queryClient.invalidateQueries({queryKey: ['liveEvents']});
          navigateToStream();
        },
        onError() {
          toast.showToast({
            title: 'Error starting stream',
            type: 'error',
          });
        },
      },
    );
  };

  return (
    <View style={styles.stream_container}>
      <View style={styles.canvas_container}>
        <Text style={styles.buttonText}>Stream Status: {event?.status}</Text>

        {event?.status === 'ended' ? (
          <Pressable
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => navigateToStream()}
          >
            <Text style={styles.buttonText}>Proceed to Stream</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.button, styles.buttonPrimary]} onPress={handleStartStream}>
            <Text style={styles.buttonText}>Proceed to Stream</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function WebStreamComponent({
  toggleChat,
  streamKey,
  streamerUserId,
  socketRef,
  navigateToPreStream,
}: IWebStreamProps) {
  const toast = useToast();
  const {data: event} = useGetSingleEvent({
    eventId: streamKey,
  });

  const isStreamer = true;
  const styles = useStyles(stylesheet);
  const queryClient = useQueryClient();
  const updateEvent = useEditEvent();
  const {
    stopStream,
    toggleAudio,
    startStream,
    dockCamera,
    undockCamera,
    audioEnabled,
    canvasRef,
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    cameraPosition,
    cameraStream,
    isStreaming,
    dimensions,
    screenStream,
    toggleScreenShare,
    setCameraStream,
    startCamera,
  } = useStreamCanvas({
    isStreamer,
    socketRef,
    streamerUserId,
    streamKey,
  });

  const handleStopStream = () => {
    updateEvent.mutate(
      {
        eventId: streamKey,
        status: 'ended',
        shouldMarkDelete: false,
        streamingUrl: `${CLOUDFARE_BUCKET_URL}/livestream/${streamKey}/stream.m3u8`,
      },
      {
        onSuccess() {
          toast.showToast({
            title: 'Stream ended successfully',
            type: 'success',
          });
          stopStream();
          navigateToPreStream?.();
          queryClient.invalidateQueries({queryKey: ['liveEvents']});
        },
      },
    );
  };

  return (
    <View style={styles.stream_container}>
      {isStreaming && (
        <View style={styles.overlay}>
          <View style={styles.liveIndicator}>
            <Text style={styles.liveText}>
              {socketRef.current?.connected
                ? 'LIVE'
                : 'NOT CONNECTED CHECK YOUR NETWORK CONNECTION'}
            </Text>
          </View>
          <View style={styles.viewerContainer}>
            <Text style={styles.viewerCount}> viewers</Text>
          </View>
        </View>
      )}
      <View style={styles.canvas_container}>
        <View ref={containerRef} style={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            style={styles.canvas}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </View>
      </View>
      <View style={styles.controls}>
        {event?.status === 'ended' ? (
          <Pressable style={[styles.button, styles.buttonPrimary]}>
            <Text style={styles.buttonText}>Stream Ended</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.button, isStreaming ? styles.buttonDestructive : styles.buttonPrimary]}
            onPress={!isStreaming ? startStream : handleStopStream}
          >
            <Text style={styles.buttonText}>
              {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
            </Text>
          </Pressable>
        )}

        <Pressable
          style={styles.iconButton}
          onPress={cameraStream ? () => setCameraStream(null) : startCamera}
        >
          <MaterialIcons
            style={styles.actionButtonText}
            name={cameraStream ? 'videocam' : 'videocam-off'}
            size={24}
          />
        </Pressable>

        <Pressable style={styles.iconButton} onPress={toggleScreenShare}>
          <MaterialIcons
            name={!screenStream ? 'screen-share' : 'stop-screen-share'}
            size={20}
            style={styles.actionButtonText}
          />
        </Pressable>

        {cameraStream && screenStream && (
          <Pressable
            style={styles.iconButton}
            onPress={() => (cameraPosition.isDocked ? undockCamera() : dockCamera('topRight'))}
          >
            <MaterialIcons
              name={cameraPosition.isDocked ? 'undo' : 'dock'}
              size={20}
              style={styles.actionButtonText}
            />
          </Pressable>
        )}

        <Pressable style={styles.iconButton} onPress={toggleAudio}>
          <MaterialIcons
            name={audioEnabled ? 'mic' : 'mic-off'}
            size={24}
            style={styles.actionButtonText}
          />
        </Pressable>

        <Pressable style={styles.iconButton} onPress={() => toggleChat()}>
          <Feather name="message-square" size={20} style={styles.actionButtonText} />
        </Pressable>
      </View>
    </View>
  );
}
