import { useState, useRef, useCallback, useEffect } from 'react';

interface MediaStreamState {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  screenSharing: boolean;
  isStreaming: boolean;
}

interface MediaStreamHook {
  stream: MediaStream | null;
  screenStream: MediaStream | null;
  state: MediaStreamState;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  toggleMicrophone: () => void;
  startScreenSharing: () => Promise<void>;
  stopScreenSharing: () => void;
  getCombinedStream: () => MediaStream | null;
  cleanup: () => void;
}

export const useMediaStream = (): MediaStreamHook => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [state, setState] = useState<MediaStreamState>({
    cameraEnabled: false,
    microphoneEnabled: false,
    screenSharing: false,
    isStreaming: false,
  });

  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      console.log('🎬 Starting camera in hook...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('🎬 Camera stream obtained, setting state...');
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setState(prev => ({
        ...prev,
        cameraEnabled: true,
        microphoneEnabled: true,
        isStreaming: true
      }));

      console.log('Camera stream started, stream tracks:', mediaStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
      console.log('🎬 Camera state updated, stream ref:', streamRef.current);
    } catch (error) {
      console.error('Failed to start camera:', error);
      throw error;
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
    setState(prev => ({
      ...prev,
      cameraEnabled: false,
      microphoneEnabled: false,
      isStreaming: false
    }));
    console.log('Camera stream stopped');
  }, []);

  // Toggle microphone
  const toggleMicrophone = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setState(prev => ({
        ...prev,
        microphoneEnabled: !prev.microphoneEnabled
      }));
    }
  }, []);

  // Start screen sharing
  const startScreenSharing = useCallback(async () => {
    try {
      console.log('🖥️ Starting screen sharing in hook...');
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: false
      });

      console.log('🖥️ Screen stream obtained, setting state...');
      screenStreamRef.current = mediaStream;
      setScreenStream(mediaStream);
      setState(prev => ({
        ...prev,
        screenSharing: true
      }));

      // Handle screen share stop - use a local function to avoid circular dependency
      const handleScreenShareEnd = () => {
        console.log('🖥️ Screen share ended by user or system');
        if (screenStreamRef.current === mediaStream) {
          screenStreamRef.current = null;
          setScreenStream(null);
          setState(prev => ({
            ...prev,
            screenSharing: false
          }));
          console.log('Screen sharing stopped by system');
        }
      };

      mediaStream.getVideoTracks()[0].onended = handleScreenShareEnd;

      console.log('Screen sharing started, stream tracks:', mediaStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
      console.log('🖥️ Screen state updated, screen stream ref:', screenStreamRef.current);
    } catch (error) {
      console.error('Failed to start screen sharing:', error);
      throw error;
    }
  }, []);

  // Stop screen sharing
  const stopScreenSharing = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
    }
    setState(prev => ({
      ...prev,
      screenSharing: false
    }));
    console.log('Screen sharing stopped manually');
  }, []);


  // Get combined stream (screen sharing takes priority over camera)
  const getCombinedStream = useCallback(() => {
    if (screenStreamRef.current) {
      return screenStreamRef.current;
    }
    return streamRef.current;
  }, []);

  // Cleanup all streams
  const cleanup = useCallback(() => {
    stopCamera();
    stopScreenSharing();
  }, [stopCamera, stopScreenSharing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    stream,
    screenStream,
    state,
    startCamera,
    stopCamera,
    toggleMicrophone,
    startScreenSharing,
    stopScreenSharing,
    getCombinedStream,
    cleanup
  };
};
