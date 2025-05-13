'use client';

import React, { useState } from 'react';
import { useAuth, useSendPrivateMessage } from 'afk_nostr_sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';

interface FormPrivateMessageProps {
  onClose: () => void;
  onMessageSent?: () => void;
}

export const FormPrivateMessage: React.FC<FormPrivateMessageProps> = ({
  onClose,
  onMessageSent
}) => {
  const { publicKey } = useAuth();
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {mutateAsync, mutate} = useSendPrivateMessage();
  const roomIds = [publicKey, recipient];
  const {showToast} = useUIStore();
  const queryClient = useQueryClient();

  const handleSendMessage = async (message: string) => {
    if (!message) return;
    console.log('roomIds', roomIds);
    let receiverPublicKey = roomIds.find((id) => id !== publicKey);


    // TODO auto saved message
    if(roomIds[0] === roomIds[1]){ 
      receiverPublicKey = roomIds[0] ?? publicKey;
    }
    if (!receiverPublicKey && roomIds.length > 1 && roomIds[0] != roomIds[1]) {
      showToast({message: 'Invalid receiver', type: 'error'});
      return;
    }
    console.log('receiverPublicKey', receiverPublicKey);
    await mutateAsync(
      {
        content: message,
        receiverPublicKeyProps: receiverPublicKey,
      },
      {
        onSuccess: () => {
          showToast({message: 'Message sent', type: 'success'});
        //   queryClient.invalidateQueries({
        //     queryKey: ['messagesSent'],
        //   });
        },
        onError() {
          showToast({message: 'Error sending message', type: 'error'});
        },
      },
    );
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!recipient.trim()) {
        throw new Error('Recipient is required');
      }

      if (!message.trim()) {
        throw new Error('Message is required');
      }

      // Here you would implement the actual message sending logic
      // using your Nostr SDK
      setMessage('');
      setRecipient('');
      onMessageSent?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">New Message</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded"
        >
          ×
        </button>
      </div>

      <div 
    //   onSubmit={handleSubmit} 
      className="space-y-4">
        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
            Recipient (Public Key)
          </label>
          <input
            id="recipient"
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Enter recipient's public key"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={4}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            // type="submit"
            onClick={() => handleSendMessage(message)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
};
