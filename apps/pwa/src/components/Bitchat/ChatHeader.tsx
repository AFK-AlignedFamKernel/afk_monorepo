import React from 'react';

interface ChatHeaderProps {
  nickname: string;
  onNicknameChange: (name: string) => void;
  peerCount: number;
  currentChannel?: string;
  selectedPrivatePeer?: string;
  onSidebarToggle?: () => void;
  onShowAppInfo?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  nickname,
  onNicknameChange,
  peerCount,
  currentChannel,
  selectedPrivatePeer,
  onSidebarToggle,
  onShowAppInfo,
}) => {
  return (
    <div className="bitchat-header flex flex-col sm:flex-row items-start sm:items-center px-2 sm:px-4 py-2 sm:py-3 gap-2 sm:gap-0 w-full">
      <div className="bitchat-title text-green-300 font-bold text-lg sm:text-xl font-mono mr-0 sm:mr-4">bitchat*</div>
      <div className="bitchat-nickname-row flex items-center bg-gray-700 rounded px-2 mr-0 sm:mr-4 w-full sm:w-auto">
        <div className="bitchat-label text-green-300 font-mono text-base">@</div>
        <input
          className="bitchat-nickname-input bg-transparent text-green-300 font-mono text-base min-w-[60px] max-w-[120px] ml-1 p-0 border-none outline-none flex-1"
          value={nickname}
          onChange={(e) => onNicknameChange(e.target.value)}
          placeholder="nickname"
          maxLength={20}
        />
      </div>
      {selectedPrivatePeer ? (
        <div className="bitchat-channel text-orange-300 font-mono text-sm mr-0 sm:mr-4 w-full sm:w-auto">{`DM: ${selectedPrivatePeer}`}</div>
      ) : currentChannel ? (
        <div className="bitchat-channel text-orange-300 font-mono text-sm mr-0 sm:mr-4 w-full sm:w-auto">{`#${currentChannel}`}</div>
      ) : null}
      <div className="bitchat-peer-count text-green-300 font-mono text-sm ml-0 sm:ml-auto mr-0 sm:mr-2 w-full sm:w-auto">{`peers: ${peerCount}`}</div>
      {onSidebarToggle && (
        <button
          className="bitchat-icon-btn ml-0 sm:ml-1 p-1 text-green-300 hover:text-green-400 text-2xl sm:text-base self-end sm:self-auto"
          onClick={onSidebarToggle}
          aria-label="Open sidebar"
        >
          ☰
        </button>
      )}
      {onShowAppInfo && (
        <button
          className="bitchat-icon-btn ml-1 p-1 text-blue-300 hover:text-blue-400 text-xl sm:text-base"
          onClick={onShowAppInfo}
          aria-label="Show info"
        >
          ℹ️
        </button>
      )}
    </div>
  );
};

export default ChatHeader; 