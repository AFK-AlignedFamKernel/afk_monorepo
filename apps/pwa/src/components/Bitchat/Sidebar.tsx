import React from 'react';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  channels: string[];
  currentChannel?: string;
  onChannelSelect: (channel: string) => void;
  onChannelLeave: (channel: string) => void;
  peers: string[];
  onPeerSelect: (peer: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  visible,
  onClose,
  channels,
  currentChannel,
  onChannelSelect,
  onChannelLeave,
  peers,
  onPeerSelect,
}) => {
  if (!visible) return null;

  return (
    <>
      {/* Overlay for mobile, closes sidebar on click */}
      <div
        className="block sm:hidden fixed inset-0 bg-black bg-opacity-40 z-[999]"
        onClick={onClose}
      />
      <div
        className="bitchat-sidebar absolute sm:top-0 sm:right-0 sm:w-80 sm:max-w-[90vw] sm:h-full sm:rounded-none sm:p-6 top-0 left-0 w-full h-full max-w-full p-4 bg-black bg-opacity-95 z-[1000] flex flex-col"
        style={{ borderRadius: 0 }}
      >
        {/* Close button for mobile */}
        <button
          className="block sm:hidden absolute top-2 right-2 text-2xl text-green-300 hover:text-green-400 z-[1001]"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          ×
        </button>
        <div className="bitchat-sidebar-section-title text-green-300 font-mono font-bold text-lg mb-2 mt-6 sm:mt-0">Channels</div>
        <div className="flex flex-col gap-2 mb-4">
          {channels.map((item) => (
            <div key={item} className="bitchat-sidebar-channel-row flex items-center gap-2 mb-2">
              <button
                className={`bitchat-sidebar-channel-btn flex-1 bg-transparent text-white border-none font-mono text-base cursor-pointer text-left hover:text-green-300 ${
                  item === currentChannel ? 'bitchat-sidebar-channel-active text-orange-300 font-bold' : ''
                }`}
                onClick={() => onChannelSelect(item)}
              >
                {item}
              </button>
              <button
                className="bitchat-sidebar-leave-btn text-red-400 text-sm font-mono bg-transparent border-none cursor-pointer hover:underline"
                onClick={() => onChannelLeave(item)}
              >
                leave
              </button>
            </div>
          ))}
        </div>
        <div className="bitchat-sidebar-divider h-px bg-gray-600 my-4" />
        <div className="bitchat-sidebar-section-title text-green-300 font-mono font-bold text-lg mb-2">Peers</div>
        <div className="flex flex-col gap-2">
          {peers.map((item) => (
            <button
              key={item}
              className="bitchat-sidebar-peer-btn bg-transparent text-green-300 border-none font-mono text-base cursor-pointer text-left py-2 hover:text-orange-300"
              onClick={() => onPeerSelect(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar; 