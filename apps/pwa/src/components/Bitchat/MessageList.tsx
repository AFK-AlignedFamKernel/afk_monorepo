import React, { useRef, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  sender: string;
  timestamp: number;
  content: string;
}

interface MessageListProps {
  messages: ChatMessage[];
  currentUserNickname: string;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, currentUserNickname }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="bitchat-message-list flex flex-col gap-2 px-2 py-4">
      {messages.map((item) => (
        <div key={item.id} className="bitchat-message-row flex items-end gap-2">
          <div className="bitchat-message-timestamp text-xs text-gray-400 font-mono">
            [{new Date(item.timestamp).toLocaleTimeString()}]
          </div>
          <div className={`bitchat-message-sender font-bold font-mono text-sm ${
            item.sender === currentUserNickname ? 'bitchat-message-sender-self text-orange-300' : 'text-green-300'
          }`}>
            {`<@${item.sender}>`}
          </div>
          <div className="bitchat-message-content text-sm font-mono text-white flex-shrink">
            {item.content}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList; 