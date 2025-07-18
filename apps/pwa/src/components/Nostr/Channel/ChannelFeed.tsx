import React, { useEffect, useState } from 'react';
import { useChannels } from 'afk_nostr_sdk';
import ChannelCard from './ChannelCard';
import styles from '@/styles/components/channel.module.scss';
import ChannelDetail from './ChannelDetail';
import { Icon } from '@/components/small/icon-component';
import CryptoLoading from '@/components/small/crypto-loading';

const ChannelFeed: React.FC = () => {
  const channels = useChannels({ limit: 20 });

  const [selectedChannel, setSelectedChannel] = useState<any>(null);

  // useEffect(() => {
  //   if (selectedChannel) {
  //     window.location.href = `/nostr/channel/${selectedChannel?.id}`;
  //   }
  // }, [selectedChannel]);

  if (channels.isLoading) {
    return <div className="flex justify-center items-center h-40 text-lg">Loading channels...</div>;
  }
  if (channels.isError) {
    return <div className="flex justify-center items-center h-40 text-red-500">Error loading channels.</div>;
  }

  return (
    <div className={`w-full max-w-2xl mx-auto py-4 px-2 ${styles.channelFeed}`}> {/* Custom class for extra styling */}
      <h2 className="text-2xl font-bold mb-4">Channels</h2>

      {channels?.isLoading && (
        <div className="flex justify-center items-center h-40">
          <CryptoLoading />
        </div>
      )}

      {channels?.isError && (
        <div className="flex justify-center items-center h-40 text-red-500">Error loading channels.</div>
      )}

      {!selectedChannel && (
        <div className="flex flex-col gap-4">
          {channels.data?.pages.flat().map((event: any) => (
            <ChannelCard key={event.id} event={event} onClick={setSelectedChannel} />
          ))}
        </div>
      )}


      {selectedChannel &&
        <div className="top-0 left-0 w-full h-full z-50 flex flex-col">
          <div className="flex justify-start p-4">
            <button onClick={() => setSelectedChannel(null)} className="text-white">
              <Icon name="BackIcon" className="w-6 h-6" />
            </button>
          </div>
          <ChannelDetail channelId={selectedChannel?.id} />
        </div>
      }
    </div>
  );
};

export default ChannelFeed; 