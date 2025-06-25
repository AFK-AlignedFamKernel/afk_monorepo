import {useCallback, useEffect, useRef} from 'react';

export interface CameraPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  isDocked: boolean;
}

interface UseDrawFrameProps {
  screenStream: MediaStream | null;
  cameraStream: MediaStream | null;
  canvas: HTMLCanvasElement | null;
  cameraPosition: CameraPosition;
  frameInterval?: number;
}

export const useDrawFrame = ({
  screenStream,
  cameraStream,
  canvas,
  cameraPosition,
  frameInterval = 1000 / 30, // 30 FPS default
}: UseDrawFrameProps) => {
  const lastFrameTimeRef = useRef(0);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);

  // Cleanup and setup video elements when streams change
  useEffect(() => {
    const setupVideo = async (
      stream: MediaStream | null,
      videoRef: React.MutableRefObject<HTMLVideoElement | null>,
    ) => {
      // Cleanup existing video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.remove();
        videoRef.current = null;
      }

      // Create and setup new video element if stream exists
      if (stream) {
        const video = document.createElement('video');
        video.playsInline = true;
        video.srcObject = stream;
        // Mute camera video to prevent echo
        if (stream === cameraStream) {
          video.muted = true;
        }
        try {
          await video.play();
          videoRef.current = video;
        } catch (error) {
          console.error('Error playing video:', error);
        }
      }
    };

    // Setup both video elements
    setupVideo(screenStream, screenVideoRef);
    setupVideo(cameraStream, cameraVideoRef);

    // Cleanup function
    return () => {
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = null;
        screenVideoRef.current.remove();
        screenVideoRef.current = null;
      }
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = null;
        cameraVideoRef.current.remove();
        cameraVideoRef.current = null;
      }
    };
  }, [screenStream, cameraStream]);

  return useCallback(
    (timestamp: number) => {
      if (!canvas) return;

      const ctx = canvas.getContext('2d', {
        alpha: false,
        desynchronized: true,
      });
      if (!ctx) return;

      // Check frame timing
      if (timestamp - lastFrameTimeRef.current < frameInterval) {
        return;
      }
      lastFrameTimeRef.current = timestamp;

      // Clear canvas with black background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw screen share if available
      if (screenStream && screenVideoRef.current && !screenVideoRef.current.paused) {
        ctx.drawImage(screenVideoRef.current, 0, 0, canvas.width, canvas.height);

        // Draw camera overlay if both streams are active
        if (cameraStream && cameraVideoRef.current && !cameraVideoRef.current.paused) {
          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillRect(
            cameraPosition.x,
            cameraPosition.y,
            cameraPosition.width,
            cameraPosition.height,
          );

          ctx.drawImage(
            cameraVideoRef.current,
            cameraPosition.x,
            cameraPosition.y,
            cameraPosition.width,
            cameraPosition.height,
          );
          ctx.restore();
        }
      } else if (cameraStream && cameraVideoRef.current && !cameraVideoRef.current.paused) {
        // Draw only camera if no screen share
        ctx.drawImage(
          cameraVideoRef.current,
          cameraPosition.x,
          cameraPosition.y,
          cameraPosition.width,
          cameraPosition.height,
        );
      }
    },
    [screenStream, cameraStream, canvas, cameraPosition, frameInterval],
  );
};
