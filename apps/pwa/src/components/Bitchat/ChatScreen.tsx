import React, { useState, useEffect, useRef } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList, ChatMessage } from './MessageList';
import { MessageInput } from './MessageInput';
import { Sidebar } from './Sidebar';
import { useBitchatWebRTC } from '@/hooks/bitchat/useBitchatWebRTC';
import { useChannelChat } from '@/hooks/bitchat/useChannelChat';
import { useToast } from '@chakra-ui/react';

export const ChatScreen: React.FC = () => {
  const [nickname, setNickname] = useState('anon');
  const [messageText, setMessageText] = useState('');
  const [commandSuggestions, setCommandSuggestions] = useState<string[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null);

  // Channel chat logic
  const {
    channels,
    currentChannel,
    messages: channelMessages,
    joinChannel,
    leaveChannel,
    sendChannelMessage,
    setCurrentChannel,
  } = useChannelChat(nickname);

  // DM chat logic (WebRTC)
  const [myId] = useState(() => Math.random().toString(36).slice(2, 10));
  const { peers: rtcPeers, messages: dmMessages, connectToPeer, sendMessage, logs } = useBitchatWebRTC(myId);
  const lastLogRef = useRef<string | null>(null);
  const toast = useToast();

  // Show toast for latest log (DM only)
  useEffect(() => {
    if (selectedPeer && logs.length > 0 && logs[logs.length - 1] !== lastLogRef.current) {
      const latest = logs[logs.length - 1];
      lastLogRef.current = latest;
      toast({
        title: 'Connection Log',
        description: latest,
        status: 'info',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    }
  }, [logs, selectedPeer, toast]);

  // Handler for sending a message
  const handleSend = () => {
    const trimmed = messageText.trim();
    if (!trimmed) return;
    if (selectedPeer) {
      // DM mode: send via WebRTC
      sendMessage(selectedPeer, trimmed);
    } else if (currentChannel) {
      // Channel mode: send via socket.io
      sendChannelMessage(trimmed);
    }
    setMessageText('');
    setCommandSuggestions([]);
  };

  // Handler for input change (update suggestions)
  const handleInputChange = (text: string) => {
    setMessageText(text);
    if (text.startsWith('/')) {
      setCommandSuggestions(['/block', '/channels', '/clear', '/hug', '/j', '/m', '/slap', '/unblock', '/w'].filter(cmd => cmd.startsWith(text)));
    } else {
      setCommandSuggestions([]);
    }
  };

  // Handler for selecting a command suggestion
  const handleSuggestionClick = (suggestion: string) => {
    setMessageText(suggestion + ' ');
    setCommandSuggestions([]);
  };

  // Sidebar handlers
  const handleSidebarToggle = () => setSidebarVisible(!sidebarVisible);
  const handleSidebarOpen = () => setSidebarVisible(true);
  const handleSidebarClose = () => setSidebarVisible(false);
  const handleChannelSelect = (channel: string) => {
    setCurrentChannel(channel);
    setSelectedPeer(null); // Switch to channel mode
    setSidebarVisible(false);
    joinChannel(channel);
  };
  const handleChannelLeave = (channel: string) => {
    leaveChannel(channel);
    if (currentChannel === channel) setCurrentChannel(null);
  };
  const handlePeerSelect = (peer: string) => {
    setSelectedPeer(peer); // Switch to DM mode
    setCurrentChannel(null);
    setSidebarVisible(false);
    connectToPeer(peer);
  };

  // Prepare messages for display
  let messagesToShow: ChatMessage[] = [];
  if (selectedPeer) {
    // DM mode
    messagesToShow = dmMessages.map((m, i) => ({ id: `dm-${i}`, sender: m.from, timestamp: Date.now(), content: m.content }));
  } else if (currentChannel) {
    // Channel mode
    messagesToShow = channelMessages.map((m, i) => ({ id: `ch-${i}`, sender: m.sender, timestamp: Date.now(), content: m.content }));
  }

  useEffect(() => {
    joinChannel('general');
    setCurrentChannel('general');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bitchat-container flex flex-col h-[80vh] w-full max-w-2xl mx-auto shadow-lg relative z-30 min-w-0 box-border overflow-hidden">
      <div className="bitchat-header flex items-center w-full min-w-0 box-border">
        <ChatHeader
          nickname={nickname}
          onNicknameChange={setNickname}
          peerCount={selectedPeer ? 1 : channels.length}
          currentChannel={currentChannel || undefined}
          selectedPrivatePeer={selectedPeer || undefined}
          onSidebarToggle={handleSidebarToggle}
        />
      </div>
      <div className="bitchat-message-list flex-1 overflow-y-auto w-full min-w-0 box-border">
        <MessageList messages={messagesToShow} currentUserNickname={nickname} />
      </div>
      {selectedPeer && (
        <div className="bitchat-dm-logs border-t bitchat-dm-logs w-full min-w-0 box-border">
          <div className="bitchat-dm-log-title">Connection Logs:</div>
          <div className="max-h-[100px] overflow-y-auto flex flex-col gap-1">
            {logs.slice(-5).map((log, i) => (
              <div key={i} className="bitchat-dm-log-entry text-xs">{log}</div>
            ))}
          </div>
        </div>
      )}
      <div className="bitchat-input-section w-full min-w-0 box-border">
        <MessageInput
          value={messageText}
          onValueChange={handleInputChange}
          onSend={handleSend}
          nickname={nickname}
          commandSuggestions={commandSuggestions}
          onSuggestionClick={handleSuggestionClick}
        />
      </div>
      {sidebarVisible && (
        <Sidebar
          visible={sidebarVisible}
          onClose={handleSidebarClose}
          channels={channels}
          currentChannel={currentChannel || undefined}
          onChannelSelect={handleChannelSelect}
          onChannelLeave={handleChannelLeave}
          peers={rtcPeers}
          onPeerSelect={handlePeerSelect}
        />
      )}
    </div>
  );
};

export default ChatScreen; 