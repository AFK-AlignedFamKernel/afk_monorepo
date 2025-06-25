import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert} from 'react-native';
import {Socket} from 'socket.io-client';

import {useToast} from '../../../hooks/modals';
import {CameraPosition, useDrawFrame} from './useframe';

interface StreamData {
  streamKey: string;
  chunk: any;
  userId: string;
}

export interface IWebStreamProps {
  socketRef: React.MutableRefObject<Socket | null>;
  streamKey: string;
  isStreamer: boolean;
  streamerUserId: string;
}

export function useStreamCanvas({
  streamKey,
  streamerUserId,
  isStreamer,
  socketRef,
}: IWebStreamProps) {
  const toast = useToast();

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number>();
  const peerConnectionRef = useRef<any>(null);

  // State
  const [dimensions, setDimensions] = useState({width: 1280, height: 720});
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [streamChunks, setStreamChunks] = useState<Blob[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>({
    x: 0,
    y: 0,
    width: 1280,
    height: 720,

    isDocked: false,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({x: 0, y: 0});

  const ASPECT_RATIO = 16 / 9;
  const DOCKED_WIDTH = 250;
  const DOCKED_HEIGHT = 150;

  const drawFrame = useDrawFrame({
    screenStream,
    cameraStream,
    canvas: canvasRef.current,
    cameraPosition,
  });

  const sendStreamData = useCallback(
    (data: StreamData) => {
      if (socketRef?.current) {
        socketRef.current.emit('stream-data', data);
      }
    },
    [socketRef],
  );

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const calculatedHeight = containerWidth / ASPECT_RATIO;
      setDimensions({
        width: containerWidth,
        height: calculatedHeight,
      });
    }
  }, []);

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

    peerConnectionRef.current.ontrack = ({streams}: any) => {
      if (!isStreamer && streams[0]) {
        setRemoteStream(streams[0]);
      }
    };

    return peerConnectionRef.current;
  }, [isStreamer, streamKey, socketRef]);

  const dockCamera = useCallback(
    (corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' = 'topRight') => {
      const positions = {
        topLeft: {x: 20, y: 20},
        topRight: {x: dimensions.width - DOCKED_WIDTH - 20, y: 20},
        bottomLeft: {x: 20, y: dimensions.height - DOCKED_HEIGHT - 20},
        bottomRight: {
          x: dimensions.width - DOCKED_WIDTH - 20,
          y: dimensions.height - DOCKED_HEIGHT - 20,
        },
      };

      setCameraPosition({
        ...positions[corner],
        width: DOCKED_WIDTH,
        height: DOCKED_HEIGHT,
        isDocked: true,
      });
    },
    [dimensions],
  );

  const undockCamera = useCallback(() => {
    setCameraPosition({
      x: 0,
      y: 0,
      width: dimensions.width,
      height: dimensions.height,
      isDocked: false,
    });
  }, [dimensions]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: {ideal: 1280},
          height: {ideal: 720},
        },
        audio: audioEnabled,
      });
      setCameraStream(stream);

      if (!screenStream) {
        undockCamera();
      } else {
        dockCamera('topRight');
      }

      return stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      Alert.alert('Camera Error', 'Unable to access camera. Please check permissions.');
      return null;
    }
  }, [audioEnabled, screenStream, dockCamera, undockCamera]);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);

      if (cameraStream) {
        undockCamera();
      }
    }
  }, [cameraStream, screenStream, undockCamera]);

  const startScreenShare = useCallback(async () => {
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
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      setScreenStream(stream);

      if (cameraStream) {
        dockCamera('topRight');
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
      Alert.alert('Screen Share Error', 'Unable to start screen sharing.');
    }
  }, [cameraStream, dockCamera, stopScreenShare]);

  const toggleAudio = () => {
    const newState = !audioEnabled;
    if (cameraStream) {
      cameraStream.getAudioTracks().forEach((track) => (track.enabled = newState));
    }
    if (screenStream) {
      screenStream.getAudioTracks().forEach((track) => (track.enabled = newState));
    }
    setAudioEnabled(newState);
  };

  const toggleVideo = () => {
    const newState = !videoEnabled;
    if (cameraStream) {
      cameraStream.getVideoTracks().forEach((track) => (track.enabled = newState));
    }
    setVideoEnabled(newState);
  };
  const toggleScreenShare = async () => {
    // if (!isStreaming || !isStreamer) return;
    try {
      if (screenStream) {
        stopScreenShare();
      } else {
        await startScreenShare();
      }
    } catch (error) {
      toast.showToast({type: 'error', title: 'Failed to toggle screen sharing.'});
    }
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!cameraPosition.isDocked) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (
        x >= cameraPosition.x &&
        x <= cameraPosition.x + cameraPosition.width &&
        y >= cameraPosition.y &&
        y <= cameraPosition.y + cameraPosition.height
      ) {
        setIsDragging(true);
        setDragOffset({
          x: x - cameraPosition.x,
          y: y - cameraPosition.y,
        });
      }
    },
    [cameraPosition],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDragging && cameraPosition.isDocked) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left - dragOffset.x;
        const y = e.clientY - rect.top - dragOffset.y;

        const maxX = dimensions.width - cameraPosition.width;
        const maxY = dimensions.height - cameraPosition.height;

        requestAnimationFrame(() => {
          setCameraPosition((prev) => ({
            ...prev,
            x: Math.max(0, Math.min(x, maxX)),
            y: Math.max(0, Math.min(y, maxY)),
          }));
        });
      }
    },
    [isDragging, dragOffset, cameraPosition, dimensions],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const stopStream = useCallback(() => {
    if (mediaRecorderRef.current && isStreaming) {
      mediaRecorderRef.current.stop();
      setIsStreaming(false);
      setStreamChunks([]);
    }

    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }

    stopScreenShare();

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    console.log('End stream');
    socketRef.current?.emit('end-stream', {
      streamKey,
      userId: streamerUserId,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming, cameraStream, stopScreenShare, socketRef, streamKey, streamerUserId]);

  const setupMediaRecorder = useCallback(
    (stream: MediaStream) => {
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
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.applyConstraints({
            width: 1280,
            height: 720,
            frameRate: 30,
          });
        }
        const recorder = new MediaRecorder(stream, options);

        recorder.ondataavailable = async (event: BlobEvent) => {
          if (event.data.size > 0 && stream?.active) {
            try {
              const buffer = await event.data.arrayBuffer();

              sendStreamData({
                chunk: buffer,
                streamKey,
                userId: streamerUserId,
              });
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
          console.log(`MediaRecorder started`);
        };

        recorder.onstop = () => {
          console.log(`MediaRecorder stopped`);
        };

        return recorder;
      } catch (error) {
        console.error('Error creating MediaRecorder:', error);
        return null;
      }
    },
    [sendStreamData, stopStream, streamKey, streamerUserId],
  );

  const startStream = async () => {
    socketRef.current?.connect();
    if (!streamerUserId) {
      toast.showToast({type: 'error', title: 'Must Sign-in to stream'});
      return;
    }

    try {
      const stream = await startCamera();
      if (!stream) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = Math.floor(dimensions.width);
      canvas.height = Math.floor(dimensions.height);

      const canvasStream = canvas.captureStream(30);

      // Important: Ensure video track exists and has correct settings
      const videoTrack = canvasStream.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        width: 1280,
        height: 720,
        frameRate: 30,
      });

      if (stream.getAudioTracks().length > 0) {
        canvasStream.addTrack(stream.getAudioTracks()[0]);
      }
      const mediaRecorder = setupMediaRecorder(canvasStream);

      if (!mediaRecorder) return;

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorderRef.current.start(1000);
      setIsStreaming(true);

      socketRef.current?.emit('start-stream', {
        streamKey,
        userId: streamerUserId,
      });
    } catch (error) {
      console.error('Error starting stream:', error);
      toast.showToast({type: 'error', title: 'Failed to start streaming'});
    }
  };

  useEffect(() => {
    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [updateDimensions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const offscreenCanvas = document.createElement('canvas');

    if (canvas) {
      offscreenCanvas.width = canvas.width;
      offscreenCanvas.height = canvas.height;
    }

    const loop = (time: number) => {
      drawFrame(time);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [screenStream, cameraStream, cameraPosition, drawFrame]);

  return {
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    DOCKED_HEIGHT,
    ASPECT_RATIO,

    startStream,
    stopStream,
    startScreenShare,
    toggleVideo,
    toggleAudio,
    setupPeerConnection,
    containerRef,
    canvasRef,
    animationFrameRef,
    streamChunks,
    cameraStream,
    screenStream,
    dimensions,
    isStreaming,
    setCameraStream,
    startCamera,
    cameraPosition,
    stopScreenShare,
    undockCamera,
    audioEnabled,
    dockCamera,
    toggleScreenShare,
    setIsStreaming,
  };
}
