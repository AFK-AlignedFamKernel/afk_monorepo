import {AVPlaybackStatus, Video} from 'expo-av';
import Hls from 'hls.js';
import {useEffect, useRef, useState} from 'react';
import {Platform} from 'react-native';

type PlayerRef = React.RefObject<HTMLVideoElement> | React.RefObject<Video>;

export function useHLSPlayer(playerRef: PlayerRef, src: string) {
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const videoElement = playerRef.current as HTMLVideoElement;
      if (!videoElement) return;

      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(videoElement);

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setError(new Error('Unrecoverable error'));
                break;
            }
          }
        });
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // For Safari, which has native HLS support
        videoElement.src = src;
      } else {
        setError(new Error('HLS is not supported in this browser.'));
      }
    } else {
      // Mobile implementation
      const videoRef = playerRef as React.RefObject<Video>;
      if (videoRef.current) {
        videoRef.current.loadAsync({uri: src}, {}, false);
      }
    }

    return () => {
      if (Platform.OS === 'web' && hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [src]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    setStatus(status);
  };

  return {error, status, onPlaybackStatusUpdate};
}
