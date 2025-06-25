import {useCallback, useEffect, useState} from 'react';
import {Socket} from 'socket.io-client';

interface UseWebRTCProps {
  socketRef: React.MutableRefObject<Socket | null>;
  isStreamer: boolean;
  streamKey: string;
  streamerUserId: string;
  isConnected: boolean;
}
export const useWebStream = ({
  socketRef,
  streamKey,
  streamerUserId,
  isConnected,
}: UseWebRTCProps) => {
  // State
  const [viewerCount, setViewerCount] = useState(0);
  const [playbackUrl, setPlaybackUrl] = useState<any>(null);
  const [streamingUrl, setStreamingUrl] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<any>([]);
  const [newMessage, setNewMessage] = useState('');

  const joinStream = useCallback(async () => {
    if (!streamKey || !socketRef.current) return;

    socketRef.current.emit('join-stream', {
      streamKey,
      userId: streamerUserId,
    });
  }, [streamKey, socketRef, streamerUserId]);

  // Initialize socket connection and camera permissions
  useEffect(() => {
    const socks = socketRef?.current;

    if (socks) {
      // Basic socket event handlers
      socks.on('viewer-count', (count: number) => setViewerCount(count));

      //Streaming Url
      socks.on('streaming-url', (data: any) => {
        console.log(data, 'data');
        return setStreamingUrl(data?.streamingUrl);
      });

      // Chat events
      socks.on('chat-message', ({message, sender}: {message: any; sender: any}) => {
        setMessages((prev: any) => [...prev, {id: Date.now(), text: message, sender}]);
      });
    }
  }, [socketRef]);

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
    viewerCount,
    playbackUrl,
    isChatOpen,
    messages,
    newMessage,
    isConnected,
    joinStream,
    setIsChatOpen,
    setNewMessage,
    handleSendMessage,
    streamingUrl,
  };
};
