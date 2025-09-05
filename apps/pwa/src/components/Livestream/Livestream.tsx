'use client';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useEditEvent, useGetSingleEvent } from 'afk_nostr_sdk';
import { Socket } from 'socket.io-client';
import styles from './styles.module.scss';

interface LivestreamProps {
  streamKey: string;
  isStreamer: boolean;
  streamerUserId: string;
  socketRef: React.MutableRefObject<Socket | null>;
  streamingUrl?: string;
  recordingUrl?: string;
}

export function Livestream({
  streamKey,
  isStreamer,
  streamerUserId,
  socketRef,
  streamingUrl,
  recordingUrl,
}: LivestreamProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const queryClient = useQueryClient();
  const updateEvent = useEditEvent();
  const { data: event } = useGetSingleEvent({
    eventId: streamKey,
  });

  console.log("streamKey", streamKey);
  console.log("isStreamer", isStreamer);
  console.log("streamerUserId", streamerUserId);
  console.log("socketRef", socketRef);
  console.log("streamingUrl", streamingUrl);
  console.log("recordingUrl", recordingUrl);

  useEffect(() => {
    if (!isStreamer || !videoRef.current) return;

    const setupStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    setupStream();
  }, [isStreamer]);

  const handleStartStream = async () => {
    if (!isStreamer) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      updateEvent.mutate(
        {
          eventId: streamKey,
          status: 'live',
          streamingUrl: `${process.env.NEXT_PUBLIC_CLOUDFARE_BUCKET_URL}/livestream/${streamKey}/stream.m3u8`,
          shouldMarkDelete: false,
        },
        {
          onSuccess() {
            setIsStreaming(true);
            queryClient.invalidateQueries({ queryKey: ['liveEvents'] });
          },
        }
      );
    } catch (error) {
      console.error('Error starting stream:', error);
    }
  };

  const handleStopStream = () => {
    if (!isStreamer) return;

    updateEvent.mutate(
      {
        eventId: streamKey,
        status: 'ended',
        shouldMarkDelete: false,
      },
      {
        onSuccess() {
          setIsStreaming(false);
          if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
          }
          queryClient.invalidateQueries({ queryKey: ['liveEvents'] });
        },
      }
    );
  };

  const toggleAudio = () => {
    if (!videoRef.current?.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!isStreamer) return;

    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        
        if (videoRef.current?.srcObject) {
          const currentStream = videoRef.current.srcObject as MediaStream;
          screenStream.getVideoTracks().forEach(track => {
            currentStream.addTrack(track);
          });
        }
      } else {
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getVideoTracks().forEach(track => {
            if (track.kind === 'video' && track.label.includes('screen')) {
              stream.removeTrack(track);
            }
          });
        }
      }
      setIsScreenSharing(!isScreenSharing);
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  if (!isStreamer && streamingUrl) {
    return (
      <div className={styles.container}>
        <video
          ref={videoRef}
          className={styles.video}
          controls
          playsInline
          autoPlay
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <video
        ref={videoRef}
        className={styles.video}
        autoPlay
        muted={isStreamer}
        playsInline
      />
      <canvas ref={canvasRef} className={styles.canvas} />
      
      {isStreamer && (
        <div className={styles.controls}>
          {!isStreaming ? (
            <button onClick={handleStartStream} className={styles.button}>
              Start Stream
            </button>
          ) : (
            <>
              <button onClick={handleStopStream} className={styles.button}>
                Stop Stream
              </button>
              <button onClick={toggleAudio} className={styles.button}>
                {isAudioEnabled ? 'Mute' : 'Unmute'}
              </button>
              <button onClick={toggleScreenShare} className={styles.button}>
                {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}