'use client';

import React, { useState } from 'react';
import { useAuth, useEncryptedMessage, useNostrContext } from 'afk_nostr_sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';

interface FormPrivateMessageProps {
  onClose: () => void;
  onMessageSent?: () => void;
}

export const FormPrivateMessage: React.FC<FormPrivateMessageProps> = ({
  onClose,
  onMessageSent,
}) => {
  const { publicKey, privateKey } = useAuth();
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: sendMessage } = useEncryptedMessage();
  const { showToast } = useUIStore();
  const queryClient = useQueryClient();
  const { ndk } = useNostrContext();

  const handleSendMessage = async () => {
    if (!message.trim()) {
      showToast({ message: 'Message is required', type: 'error' });
      return;
    }

    if (!recipient.trim()) {
      showToast({ message: 'Recipient is required', type: 'error' });
      return;
    }

    if (!privateKey) {
      showToast({ message: 'Please connect your wallet', type: 'error' });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await sendMessage({
        content: message,
        receiverPublicKey: recipient,
      });

      showToast({ message: 'Message sent', type: 'success' });
      setMessage('');
      setRecipient('');
      onMessageSent?.();
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      showToast({ message: 'Error sending message', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">New NIP-04 Message</h2>
        <button
          onClick={onClose}
          className="p-2 rounded hover:bg-gray-100"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="recipient" className="block text-sm font-medium mb-1">
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
          <label htmlFor="message" className="block text-sm font-medium mb-1">
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
            onClick={handleSendMessage}
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