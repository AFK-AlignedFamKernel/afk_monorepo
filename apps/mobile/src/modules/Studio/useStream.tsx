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
  streamKey: string;
  streamerUserId: string;
}
export const useStream = ({socketRef, isStreamer, streamKey, streamerUserId}: UseWebRTCProps) => {
  const styles = useStyles(stylesheet);

  // State
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [playbackUrl, setPlaybackUrl] = useState<any>(null);
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
  } = useWebTRC({socketRef, streamKey, isStreamer, streamerUserId});

  const joinStream = useCallback(async () => {
    if (!streamKey || !socketRef.current) return;

    socketRef.current.emit('join-stream', {
      streamKey,
      userId: streamerUserId,
    });

    setupPeerConnection();
  }, [streamKey, socketRef, streamerUserId, setupPeerConnection]);

  // Initialize socket connection and camera permissions
  useEffect(() => {
    const socks = socketRef?.current;
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

    if (socks) {
      // Basic socket event handlers
      socks.on('viewer-count', (count: number) => setViewerCount(count));

      //Camera playback
      socks.on('playback-url', (data: any) => setPlaybackUrl(data?.url));
      //Screen playback

      // WebRTC-related socket events
      socks.on('ice-candidate', ({candidate, senderId}: {candidate: any; senderId: any}) => {
        // Prevent loopback by checking sender ID
        if (senderId !== streamerUserId) {
          const peerConnection = setupPeerConnection();
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      // Handle incoming offers (for viewers)
      socks.on('offer', async ({offer, senderId}: {offer: any; senderId: any}) => {
        if (!isStreamer && senderId !== streamerUserId) {
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
      socks.on('answer', async ({answer, senderId}: {answer: any; senderId: any}) => {
        if (isStreamer && senderId !== streamerUserId) {
          const peerConnection = setupPeerConnection();
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      // Chat events
      socks.on('chat-message', ({message, sender}: {message: any; sender: any}) => {
        setMessages((prev: any) => [...prev, {id: Date.now(), text: message, sender}]);
      });
    }

    // Cleanup function
    return () => {
      stopStream();
      if (socks) {
        socks.disconnect();
      }
    };
  }, [setupPeerConnection]);

  const handleSendMessage = useCallback(() => {
    if (newMessage.trim() && socketRef.current) {
      const messageData = {
        text: newMessage,
        streamKey,
        sender: streamerUserId,
        timestamp: Date.now(),
      };

      socketRef?.current.emit('chat-message', messageData);
      setMessages((prev: any) => [...prev, {...messageData, id: Date.now()}]);
      setNewMessage('');
    }
  }, [newMessage, socketRef, streamKey, streamerUserId]);

  return {
    streamKey,
    styles,
    hasPermission,
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
