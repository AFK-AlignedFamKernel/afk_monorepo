import React from 'react';

interface MessageInputProps {
  value: string;
  onValueChange: (text: string) => void;
  onSend: () => void;
  nickname: string;
  commandSuggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onValueChange,
  onSend,
  nickname,
  commandSuggestions = [],
  onSuggestionClick,
}) => {
  return (
    <div className="bitchat-input-section flex flex-col gap-2">
      {commandSuggestions.length > 0 && (
        <div className="bitchat-suggestions-box flex gap-2 mb-1">
          {commandSuggestions.map((item) => (
            <button
              key={item}
              className="bitchat-suggestion text-green-300 font-mono text-sm bg-gray-800 rounded px-2 py-1 cursor-pointer transition-colors hover:bg-green-300 hover:text-gray-900"
              onClick={() => onSuggestionClick && onSuggestionClick(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}
      <div className="bitchat-input-row flex items-center align-center gap-2">

        <div className="lg:flex-1 lg:flex lg:flex-row items-center gap-2">

          <div className="bitchat-input-label text-green-300 font-mono text-sm">{`<@${nickname}>`}</div>
          <input
            className="bitchat-input flex-1 bg-gray-700 text-white font-mono text-sm rounded px-2 py-1 border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-300"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSend();
            }}
          />

        </div>

        <button
          className="bitchat-send-btn bg-green-300 text-gray-900 font-mono font-bold px-3 py-1 rounded text-sm uppercase transition-colors hover:bg-green-400"
          onClick={onSend}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default MessageInput; 