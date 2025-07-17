import React, { useState } from 'react';
import { useNote, useMessagesChannels, useSendMessageChannel, useProfile } from 'afk_nostr_sdk';
import ChannelCard from './ChannelCard';
import styles from '@/styles/components/channel.module.scss';
import { useUIStore } from '@/store/uiStore';
import Image from 'next/image';
import { formatTimestamp } from '@/types/nostr';
import { NDKKind } from '@nostr-dev-kit/ndk';
import ChannelMessage from './ChannelMessage';

const ChannelDetail: React.FC<{ channelId: string }> = ({ channelId }) => {
  const { data: channel, isLoading, isError } = useNote({ noteId: channelId ?? '', kinds: [NDKKind.ChannelMetadata, NDKKind.ChannelCreation] });
  const messages = useMessagesChannels({ noteId: channelId ?? '' });
  const sendMessage = useSendMessageChannel();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { showModal, showToast } = useUIStore();
  const {data: channelProfile} = useProfile({publicKey: channel?.pubkey})

  console.log('channelProfile', channelProfile)
  // console.log('channelId', channelId);
  // console.log('channel', channel);

  const handleSend = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (!message.trim()) return;
      if (!channelId) return;
      setSending(true);
      await sendMessage.mutateAsync({ content: message, tags: [['e', channelId]] });
      setMessage('');
      setSending(false);
      messages.refetch();
      showToast({
        message: 'Message sent',
        description: 'Your message has been sent',
        type: 'success',
      });
    } catch (error) {
      showToast({
        message: 'Error sending message',
        description: 'Please try again',
        type: 'error',
      });
    }

  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-40 text-lg">Loading channel...</div>;
  }
  // if (isError || !channel) {
  //   return <div className="flex justify-center items-center h-40 text-red-500">Channel not found.</div>;
  // }

  console.log('messages', messages?.data?.pages.flat());
  return (
    <div className={`w-full max-w-2xl mx-auto py-4 px-2 ${styles.channelDetail}`}> {/* Custom class for extra styling */}

      {channel && (
        <>
          <ChannelCard event={channel} 
            profileProps={channelProfile}
            isViewButton={false}
          />
        </>
      )}

      <h3 className="text-xl font-semibold mb-2 mt-6">Messages</h3>

      <div className="flex flex-col  max-h-96 overflow-y-auto overflow-x-hidden rounded-lg p-2">
        {messages?.data?.pages.flat().length === 0 && (
          <div className="text-gray-400">No messages yet.</div>
        )}
        {messages?.data?.pages.flat().map((msg: any, index: number) => (
            <ChannelMessage key={index} event={msg} 
            profileProps={channelProfile}
            />
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 mt-2">
        <input
          className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          className="rounded bg-green-500 hover:bg-green-600 text-white px-4 py-2 font-semibold disabled:opacity-50"
          disabled={sending || !message.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChannelDetail; 