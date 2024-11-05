import {useCallback, useRef, useState} from 'react';
import {Alert, Platform} from 'react-native';
import {Socket} from 'socket.io-client';

import {useToast} from '../../hooks/modals';

// Platform-specific imports remain the same
let RTCPeerConnection;
let mediaDevices;
let RTCSessionDescription;
let RTCIceCandidate;

if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const WebRTC = require('react-native-webrtc');
  RTCPeerConnection = WebRTC.RTCPeerConnection;
  mediaDevices = WebRTC.mediaDevices;
  RTCSessionDescription = WebRTC.RTCSessionDescription;
  RTCIceCandidate = WebRTC.RTCIceCandidate;
} else {
  RTCPeerConnection = window.RTCPeerConnection;
  mediaDevices = navigator.mediaDevices;
  RTCSessionDescription = window.RTCSessionDescription;
  RTCIceCandidate = window.RTCIceCandidate;
}

interface UseWebRTCProps {
  socketRef: React.MutableRefObject<Socket | null>;
  streamKey: string;
  isStreamer: boolean;
  streamerUserId: string;
}

interface StreamData {
  streamKey: string;
  chunk: Uint8Array;
  source: 'camera' | 'screen';
  isCamera: boolean;
  timestamp: number;
  isLastChunk: boolean;
  sequence: number;
  mimeType: string;
  userId: string;
}

export const useWebTRC = ({socketRef, streamKey, isStreamer, streamerUserId}: UseWebRTCProps) => {
  const toast = useToast();
  const [remoteStream, setRemoteStream] = useState<MediaStream | any>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const peerConnectionRef = useRef<any>(null);
  const cameraStream = useRef<MediaStream | null>(null);
  const screenStream = useRef<MediaStream | null>(null);
  const cameraRecorderRef = useRef<MediaRecorder | null>(null);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);

  const isValidChunk = (chunk: Uint8Array): boolean => {
    // Check if chunk is not empty
    if (!chunk || chunk.length === 0) return false;

    // Check if chunk size is within reasonable limits (e.g., 16MB)
    const maxChunkSize = 16 * 1024 * 1024; // 16MB
    if (chunk.length > maxChunkSize) {
      console.warn('Chunk size exceeds maximum allowed size');
      return false;
    }

    return true;
  };
  // Separate buffers for camera and screen streams
  const cameraChunkBuffer = useRef<{
    chunks: Uint8Array[];
    timestamp: number;
  }>({
    chunks: [],
    timestamp: Date.now(),
  });

  const screenChunkBuffer = useRef<{
    chunks: Uint8Array[];
    timestamp: number;
  }>({
    chunks: [],
    timestamp: Date.now(),
  });
  const setupPeerConnection = useCallback(() => {
    const configuration = {
      iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
    };

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    peerConnectionRef.current = new RTCPeerConnection(configuration);

    peerConnectionRef.current.onicecandidate = ({candidate}: any) => {
      if (candidate && socketRef.current?.connected) {
        socketRef.current.emit('ice-candidate', {
          candidate,
          recipientId: isStreamer ? 'viewers' : streamKey,
          senderId: socketRef.current.id,
        });
      }
    };

    peerConnectionRef.current.ontrack = ({track, streams}: any) => {
      if (!isStreamer && streams[0]) {
        setRemoteStream(streams[0]);
      }
    };

    return peerConnectionRef.current;
  }, [isStreamer, streamKey, socketRef]);

  const sendStreamData = useCallback(
    (streamData: StreamData) => {
      if (!socketRef.current?.connected) {
        console.warn('Socket not connected');
        return false;
      }

      const stream = streamData.isCamera ? cameraStream.current : screenStream.current;
      if (!stream?.active) {
        console.warn(
          `Attempted to send ${
            streamData.isCamera ? 'camera' : 'screen'
          } chunks with inactive stream`,
        );
        return false;
      }

      if (!isValidChunk(streamData.chunk)) {
        console.warn('Invalid chunk detected, skipping');
        return false;
      }

      try {
        socketRef.current.emit('stream-data', streamData);
        return true;
      } catch (error) {
        console.error('Error sending stream data:', error);
        return false;
      }
    },
    [socketRef],
  );

  const stopStream = useCallback(() => {
    // Stop camera stream
    if (cameraRecorderRef.current?.state !== 'inactive') {
      cameraRecorderRef.current?.stop();
    }
    if (cameraStream.current) {
      cameraStream.current.getTracks().forEach((track) => track.stop());
    }

    // Stop screen share if active
    stopScreenShare();

    // Clear all buffers
    cameraChunkBuffer.current.chunks = [];
    screenChunkBuffer.current.chunks = [];

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    setIsStreaming(false);
    cameraStream.current = null;
    socketRef.current?.emit('end-stream', {
      streamKey,
      userId: streamerUserId,
      isCamera: true,
      source: 'camera',
    });
  }, []);

  const sendChunks = useCallback(() => {
    // Send camera chunks if camera stream is active
    if (cameraStream.current?.active && cameraChunkBuffer.current.chunks.length > 0) {
      const {chunks: cameraChunks, timestamp: cameraTimestamp} = cameraChunkBuffer.current;
      cameraChunks.forEach((chunk, index) => {
        sendStreamData({
          chunk,
          isCamera: true,
          isLastChunk: index === cameraChunks.length - 1,
          mimeType: 'video/webm;codecs=vp8,opus',
          sequence: index,
          streamKey,
          timestamp: cameraTimestamp,
          userId: streamerUserId,
          source: 'camera',
        });
      });
      cameraChunkBuffer.current = {
        chunks: [],
        timestamp: Date.now(),
      };
    }

    // Send screen chunks if screen stream is active
    if (screenStream.current?.active && screenChunkBuffer.current.chunks.length > 0) {
      const {chunks: screenChunks, timestamp: screenTimestamp} = screenChunkBuffer.current;
      screenChunks.forEach((chunk, index) => {
        sendStreamData({
          chunk,
          isCamera: false,
          isLastChunk: index === screenChunks.length - 1,
          mimeType: 'video/webm;codecs=vp8,opus',
          sequence: index,
          streamKey,
          timestamp: screenTimestamp,
          userId: streamerUserId,
          source: 'screen',
        });
      });
      screenChunkBuffer.current = {
        chunks: [],
        timestamp: Date.now(),
      };
    }
  }, [sendStreamData, streamKey, streamerUserId]);

  const setupMediaRecorder = useCallback(
    (stream: MediaStream, isCamera: boolean) => {
      if (!stream.active) {
        console.error('Attempted to setup MediaRecorder with inactive stream');
        return null;
      }

      const options = {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000, // Reduced for better stability
        audioBitsPerSecond: 128000,
      };

      try {
        const recorder = new MediaRecorder(stream, options);

        recorder.ondataavailable = async (event: BlobEvent) => {
          if (event.data.size > 0 && stream?.active) {
            try {
              const buffer = await event.data.arrayBuffer();

              const targetBuffer = isCamera ? cameraChunkBuffer : screenChunkBuffer;
              targetBuffer.current.chunks.push(buffer as any);

              sendChunks();
            } catch (error) {
              console.error('Error processing recorder data:', error);
            }
          }
        };

        recorder.onerror = (error) => {
          console.error('MediaRecorder error:', error);
          Alert.alert('Recording Error', 'An error occurred while recording.');
          stopStream();
        };

        // Add state change handler for debugging
        recorder.onstart = () => {
          console.log(`${isCamera ? 'Camera' : 'Screen'} MediaRecorder started`);
        };

        recorder.onstop = () => {
          console.log(`${isCamera ? 'Camera' : 'Screen'} MediaRecorder stopped`);
        };

        return recorder;
      } catch (error) {
        console.error('Error creating MediaRecorder:', error);
        return null;
      }
    },
    [sendChunks, stopStream],
  );
  const startCameraStream = async () => {
    try {
      if (cameraStream.current) {
        cameraStream.current?.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: 'user',
          width: {ideal: 1280},
          height: {ideal: 720},
        },
      });

      cameraStream.current = stream;
      return stream;
    } catch (error) {
      Alert.alert('Camera Error', 'Unable to access camera. Please check permissions.');
      return null;
    }
  };

  const startScreenShare = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Not Supported', 'Screen sharing is only available on web platform');
      return null;
    }

    try {
      const displayMediaOptions = {
        video: {
          displaySurface: 'monitor',
          cursor: 'always',
        },
        audio: {
          suppressLocalAudioPlayback: false,
          echoCancellation: true,
          noiseSuppression: true,
        },
        preferCurrentTab: false,
        selfBrowserSurface: 'exclude',
        systemAudio: 'include',
        surfaceSwitching: 'include',
        monitorTypeSurfaces: 'include',
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions as any);

      // Add track ended listener
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      screenStream.current = stream;
      setIsScreenSharing(true);
      return stream;
    } catch (error) {
      Alert.alert('Screen Share Error', 'Unable to start screen sharing.');
      return null;
    }
  };

  const stopScreenShare = () => {
    if (screenRecorderRef.current?.state !== 'inactive') {
      screenRecorderRef.current?.stop();
    }

    if (screenStream.current) {
      screenStream.current.getTracks().forEach((track) => track.stop());
    }

    screenChunkBuffer.current.chunks = [];
    screenStream.current = null;
    setIsScreenSharing(false);
  };

  const startStream = async () => {
    if (!streamKey) {
      toast.showToast({type: 'error', title: 'Must Sign-in to stream'});
      return;
    }
    if (!isStreamer) return;

    try {
      // Start camera stream
      const newCameraStream = await startCameraStream();

      if (!newCameraStream) return;

      const cameraRecorder = setupMediaRecorder(newCameraStream, true);
      if (!cameraRecorder) return;

      cameraRecorderRef.current = cameraRecorder;

      cameraRecorderRef.current.start(1000);

      socketRef.current?.emit('start-stream', {
        streamKey,
        userId: streamerUserId,
        source: 'camera',
      });

      setIsStreaming(true);
    } catch (error) {
      console.error('Stream start error:', error);
      toast.showToast({type: 'error', title: 'Failed to start streaming.'});
    }
  };

  const toggleScreenShare = async () => {
    if (!isStreaming || !isStreamer) return;

    try {
      if (isScreenSharing) {
        stopScreenShare();
        socketRef.current?.emit('end-stream', {
          streamKey,
          userId: streamerUserId,
          source: 'screen',
        });
      } else {
        const newScreenStream = await startScreenShare();
        if (!newScreenStream) return;

        const screenRecorder = setupMediaRecorder(newScreenStream, false);
        if (!screenRecorder) return;

        screenRecorderRef.current = screenRecorder;
        screenRecorderRef.current.start(1000);

        socketRef.current?.emit('start-stream', {
          streamKey,
          userId: streamerUserId,
          source: 'screen',
        });
      }

      setIsScreenSharing(!isScreenSharing);
    } catch (error) {
      console.error('Screen share toggle error:', error);
      toast.showToast({type: 'error', title: 'Failed to toggle screen sharing.'});
    }
  };

  const toggleVideo = () => {
    if (cameraStream.current) {
      const newState = !isVideoEnabled;
      cameraStream.current.getVideoTracks().forEach((track) => {
        track.enabled = newState;
      });
      setIsVideoEnabled(newState);
    }
  };

  const toggleAudio = () => {
    if (cameraStream) {
      const newState = !isAudioEnabled;
      cameraStream?.current?.getAudioTracks().forEach((track) => {
        track.enabled = newState;
      });
      setIsAudioEnabled(newState);
    }
  };

  return {
    cameraStream: cameraStream.current,
    screenStream: screenStream.current,
    remoteStream,
    isScreenSharing,
    isStreaming,
    isVideoEnabled,
    isAudioEnabled,
    startStream,
    stopStream,
    toggleScreenShare,
    toggleVideo,
    toggleAudio,
    setupPeerConnection,
  };
};
