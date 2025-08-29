import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from 'afk_nostr_sdk';
import { Icon } from '../small/icon-component';
import styles from './styles.module.scss';

interface ChatMessage {
  id: string;
  pubkey: string;
  content: string;
  timestamp: Date;
  username?: string;
}

interface LiveChatProps {
  streamId: string;
  isVisible?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const LiveChat: React.FC<LiveChatProps> = ({
  streamId,
  isVisible = true,
  onToggle,
  className,
}) => {
  const { publicKey } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Mock messages for demonstration - replace with actual WebSocket/API integration
  useEffect(() => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        pubkey: 'mock-pubkey-1',
        content: 'Welcome to the stream!',
        timestamp: new Date(Date.now() - 60000),
        username: 'Streamer',
      },
      {
        id: '2',
        pubkey: 'mock-pubkey-2',
        content: 'Great content so far!',
        timestamp: new Date(Date.now() - 30000),
        username: 'Viewer1',
      },
    ];
    setMessages(mockMessages);
    setIsConnected(true);
  }, [streamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !publicKey) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      pubkey: publicKey,
      content: newMessage.trim(),
      timestamp: new Date(),
      username: 'You',
    };

    // Add message to local state immediately for optimistic UI
    setMessages(prev => [...prev, message]);
    setNewMessage('');

    try {
      // Here you would send the message to your backend/WebSocket
      // await sendChatMessage(streamId, message);
      console.log('Sending message:', message);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove the message from local state if it failed to send
      setMessages(prev => prev.filter(m => m.id !== message.id));
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (pubkey: string) => pubkey === publicKey;

  if (!isVisible) {
    return (
      <button 
        className={styles.chatToggle} 
        onClick={onToggle}
        aria-label="Toggle chat"
      >
        <Icon name="MessageIcon" size={24} />
      </button>
    );
  }

  return (
    <div className={`${styles.chatContainer} ${className || ''}`}>
      <div className={styles.chatHeader}>
        <h3 className={styles.chatTitle}>Live Chat</h3>
        <div className={styles.chatActions}>
          <span className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {onToggle && (
            <button 
              className={styles.closeButton}
              onClick={onToggle}
              aria-label="Close chat"
            >
                X
              {/* <Icon name="XIcon" size={20} /> */}
            </button>
          )}
        </div>
      </div>

      <div className={styles.messagesContainer} ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className={styles.emptyChat}>
            <Icon name="MessageIcon" size={48} className={styles.emptyChatIcon} />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.messageItem} ${isOwnMessage(message.pubkey) ? styles.ownMessage : ''}`}
            >
              <div className={styles.messageHeader}>
                <span className={styles.username}>
                  {isOwnMessage(message.pubkey) ? 'You' : message.username || 'Anonymous'}
                </span>
                <span className={styles.timestamp}>
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
              <div className={styles.messageContent}>
                {message.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className={styles.messageInputContainer}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className={styles.messageInput}
            disabled={!isConnected}
            maxLength={500}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!newMessage.trim() || !isConnected}
            aria-label="Send message"
          >
            <Icon name="SendIcon" size={18} />
            {/* <Feather name="send" size={18} /> */}
          </button>
        </div>
        <div className={styles.inputFooter}>
          <span className={styles.characterCount}>
            {newMessage.length}/500
          </span>
        </div>
      </form>
    </div>
  );
};
