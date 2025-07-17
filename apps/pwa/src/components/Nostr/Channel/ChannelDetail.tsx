import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useNote, useMessagesChannels, useSendMessageChannel } from 'afk_nostr_sdk';
import ChannelCard from './ChannelCard';
import styles from '@/styles/components/channel.module.scss';
import { useUIStore } from '@/store/uiStore';

const ChannelDetail: React.FC<{ channelId: string }> = ({ channelId }) => {
  const { data: channel, isLoading, isError } = useNote({ noteId: channelId ?? '' });
  const messages = useMessagesChannels({ noteId: channelId ?? '' });
  const sendMessage = useSendMessageChannel();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const {showModal, showToast} = useUIStore();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if(!channelId) return;
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
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-40 text-lg">Loading channel...</div>;
  }
  if (isError || !channel) {
    return <div className="flex justify-center items-center h-40 text-red-500">Channel not found.</div>;
  }

  return (
    <div className={`w-full max-w-2xl mx-auto py-4 px-2 ${styles.channelDetail}`}> {/* Custom class for extra styling */}
      <ChannelCard event={channel} />
      <h3 className="text-xl font-semibold mb-2 mt-6">Messages</h3>
      <div className="flex flex-col gap-2 mb-4 max-h-96 overflow-y-auto">
        {messages.data?.pages.flat().length === 0 && (
          <div className="text-gray-400">No messages yet.</div>
        )}
        {messages.data?.pages.flat().map((msg: any) => (
          <div key={msg.id} className="rounded bg-gray-100 dark:bg-gray-800 p-3 text-sm">
            {msg.content}
          </div>
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