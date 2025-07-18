import React, { useState } from 'react';
import { useNote, useMessagesChannels, useSendMessageChannel, useProfile } from 'afk_nostr_sdk';
import ChannelCard from './ChannelCard';
import styles from '@/styles/components/channel.module.scss';
import { useUIStore } from '@/store/uiStore';
import { NDKKind } from '@nostr-dev-kit/ndk';
import ChannelMessage from './ChannelMessage';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useQueryClient } from '@tanstack/react-query';

const ChannelDetail: React.FC<{ channelId: string }> = ({ channelId }) => {
  const { data: channel, isLoading, isError } = useNote({ noteId: channelId ?? '', kinds: [NDKKind.ChannelMetadata, NDKKind.ChannelCreation] });
  const messages = useMessagesChannels({ noteId: channelId ?? '', limit: 100 });
  const sendMessage = useSendMessageChannel();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { showModal, showToast } = useUIStore();
  const { data: channelProfile } = useProfile({ publicKey: channel?.pubkey })
  const [file, setFile] = useState<File | null>(null);
  // console.log('messages', messages);
  // console.log('channelProfile', channelProfile)
  // console.log('channelId', channelId);
  // console.log('channel', channel);
  const queryClient = useQueryClient();

  const fileUpload = useFileUpload();
  const handleSend = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (!message.trim()) return;
      if (!channelId) return;

      setSending(true);

      let imageUrl: string | undefined;
      if (file) {
        const result = await fileUpload.mutateAsync(file);
        console.log('result image upload', result);
        if (result && typeof result === 'object' && 'data' in result && result.data && typeof result.data === 'object' && 'url' in result.data) {
          imageUrl = (result.data as { url?: string }).url ?? undefined;
        }
      }
      console.log('imageUrl', imageUrl);
      const event = await sendMessage.mutateAsync({
        content: message,
        tags: [
          ['e', channelId],
          ['p', channel?.pubkey ?? ''],
          imageUrl ? ['image', imageUrl] : []
        ]
      },
        {
          onSuccess: () => {
            // queryClient.invalidateQueries({ queryKey: ['messagesChannels'] });
            messages.refetch();

          }
        }
      );
      console.log('event', event);
      if (event) {
        setMessage('');
        setSending(false);
        showToast({
          message: 'Message sent',
          description: 'Your message has been sent',
          type: 'success',
        });
        messages.refetch();
      }
    } catch (error) {
      showToast({
        message: 'Error sending message',
        description: 'Please try again',
        type: 'error',
      });
    }
    finally {
      setSending(false);
    }

  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-40 text-lg">Loading channel...</div>;
  }
  // if (isError || !channel) {
  //   return <div className="flex justify-center items-center h-40 text-red-500">Channel not found.</div>;
  // }

  // console.log('messages', messages?.data?.pages.flat());
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

        <label className="flex items-center cursor-pointer">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-500 hover:text-green-500 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828L18 9.828M7 7h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>


        <button
          type="submit"
          className="rounded bg-green-500 hover:bg-green-600 text-white px-4 py-2 font-semibold disabled:opacity-50"
          disabled={sending || !message.trim()}
        >
          Send
        </button>
      </form>


      <div className="flex flex-col gap-2 my-4">


        {file && (
          <div className="flex items-center gap-2">
            <img src={URL.createObjectURL(file)} alt="Uploaded Image" width={150} height={150}
              className="rounded-lg"
            />
          </div>
        )}

        {file && (
          <button onClick={() => setFile(null)}>Remove Image</button>
        )}
      </div>

    </div>
  );
};

export default ChannelDetail; 