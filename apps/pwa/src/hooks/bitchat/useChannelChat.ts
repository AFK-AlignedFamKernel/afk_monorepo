import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SIGNAL_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'http://localhost:5050';

export function useChannelChat(nickname: string) {
  const [channels, setChannels] = useState<string[]>([]);
  const [currentChannel, setCurrentChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ channel: string, sender: string, content: string }[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SIGNAL_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('channel-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinChannel = (channel: string) => {
    socketRef.current?.emit('join-channel', { channel, nickname });
    setChannels(prev => prev.includes(channel) ? prev : [...prev, channel]);
    setCurrentChannel(channel);
  };

  const leaveChannel = (channel: string) => {
    socketRef.current?.emit('leave-channel', { channel, nickname });
    setChannels(prev => prev.filter(c => c !== channel));
    if (currentChannel === channel) setCurrentChannel(null);
  };

  const sendChannelMessage = (content: string) => {
    console.log('Sending message to channel:', content);
    if (currentChannel) {
      socketRef.current?.emit('channel-message', { channel: currentChannel, content, sender: nickname });
    }
  };

  return {
    channels,
    currentChannel,
    messages: messages.filter(m => m.channel === currentChannel),
    joinChannel,
    leaveChannel,
    sendChannelMessage,
    setCurrentChannel,
  };
}
