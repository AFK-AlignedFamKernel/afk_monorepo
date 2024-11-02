import {useAuth} from 'afk_nostr_sdk';
import {Camera} from 'expo-camera';
import {useCallback, useEffect, useState} from 'react';
import {Platform} from 'react-native';
import {Socket} from 'socket.io-client';

import {useStyles} from '../../hooks';
import stylesheet from './styles';
import {useWebTRC} from './useWebTrc';

interface UseWebRTCProps {
  socketRef: React.MutableRefObject<Socket | null>;
  isStreamer: boolean;
}
export const useStream = ({socketRef, isStreamer}: UseWebRTCProps) => {
  const {publicKey} = useAuth();
  const streamKey = publicKey;
  const styles = useStyles(stylesheet);

  // State
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<any>([]);
  const [newMessage, setNewMessage] = useState('');

  // Use the custom WebRTC hook
  const {
    remoteStream,
    isScreenSharing,
    isStreaming,
    isVideoEnabled,
    isAudioEnabled,
    cameraStream,
    screenStream,
    startStream,
    stopStream,
    toggleScreenShare,
    toggleVideo,
    toggleAudio,
    setupPeerConnection,
  } = useWebTRC({socketRef, streamKey, isStreamer});

  const joinStream = useCallback(async () => {
    if (!streamKey || !socketRef.current) return;

    socketRef.current.emit('join-stream', {
      streamKey,
      userId: socketRef?.current.id,
    });

    setupPeerConnection();
  }, [streamKey, socketRef, setupPeerConnection]);

  useEffect(() => {
    console.log(playbackUrl);
  }, [playbackUrl]);

  // Initialize socket connection and camera permissions
  useEffect(() => {
    // Request camera permissions
    const requestPermissions = async () => {
      if (Platform.OS !== 'web') {
        const {status} = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      } else {
        setHasPermission(true);
      }
    };

    requestPermissions();

    if (socketRef.current) {
      // Basic socket event handlers
      socketRef.current.on('connect', () => setIsConnected(true));
      socketRef.current.on('disconnect', () => setIsConnected(false));
      socketRef.current.on('viewer-count', (count: number) => setViewerCount(count));
      socketRef.current.on('playback-url', (url: string) => setPlaybackUrl(url));

      // WebRTC-related socket events
      socketRef.current.on(
        'ice-candidate',
        ({candidate, senderId}: {candidate: any; senderId: any}) => {
          // Prevent loopback by checking sender ID
          if (senderId !== socketRef.current?.id) {
            const peerConnection = setupPeerConnection();
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          }
        },
      );

      // Handle incoming offers (for viewers)
      socketRef.current.on('offer', async ({offer, senderId}: {offer: any; senderId: any}) => {
        if (!isStreamer && senderId !== socketRef.current?.id) {
          const peerConnection = setupPeerConnection();
          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          socketRef.current?.emit('answer', {
            answer,
            recipientId: senderId,
            streamKey,
          });
        }
      });

      // Handle incoming answers (for streamers)
      socketRef.current.on('answer', async ({answer, senderId}: {answer: any; senderId: any}) => {
        if (isStreamer && senderId !== socketRef.current?.id) {
          const peerConnection = setupPeerConnection();
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      // Chat events
      socketRef.current.on('chat-message', ({message, sender}: {message: any; sender: any}) => {
        setMessages((prev: any) => [...prev, {id: Date.now(), text: message, sender}]);
      });
    }

    // Cleanup function
    return () => {
      stopStream();
      //NB: This disconnect the socket when i uncomment
      //   if (socketRef.current) {
      //     socketRef.current.disconnect();
      //     console.log('Disconnected socket');
      //   }
    };
  }, [setupPeerConnection]);

  const handleSendMessage = useCallback(() => {
    if (newMessage.trim() && socketRef.current) {
      const messageData = {
        text: newMessage,
        streamKey,
        sender: publicKey,
        timestamp: Date.now(),
      };

      socketRef?.current.emit('chat-message', messageData);
      setMessages((prev: any) => [...prev, {...messageData, id: Date.now()}]);
      setNewMessage('');
    }
  }, [newMessage, streamKey, publicKey, socketRef]);

  return {
    publicKey,
    streamKey,
    styles,
    hasPermission,
    isConnected,
    viewerCount,
    playbackUrl,
    isChatOpen,
    messages,
    newMessage,
    remoteStream,
    isScreenSharing,
    isStreaming,
    isVideoEnabled,
    isAudioEnabled,
    cameraStream,
    screenStream,
    startStream,
    stopStream,
    toggleScreenShare,
    toggleVideo,
    toggleAudio,
    setupPeerConnection,
    joinStream,
    setIsChatOpen,
    setNewMessage,
    handleSendMessage,
  };
};
