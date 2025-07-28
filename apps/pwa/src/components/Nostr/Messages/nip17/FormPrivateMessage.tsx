'use client';

import React, { useState } from 'react';
import { useAuth, useEncryptedMessage, useNostrContext, useSendPrivateMessage } from 'afk_nostr_sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';
import { generateRandomBytesLength } from 'afk_nostr_sdk';
import { aes256cbcEncrypt } from 'afk_nostr_sdk';
import { encodeBase64 } from 'afk_nostr_sdk';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { x25519 } from '@noble/curves/ed25519';
import { hexToBytes } from '@noble/hashes/utils';

interface FormPrivateMessageProps {
  onClose: () => void;
  onMessageSent?: () => void;
  type: "NIP4" | "NIP17";
  setType?: (type: "NIP4" | "NIP17") => void;
}

export const FormPrivateMessage: React.FC<FormPrivateMessageProps> = ({
  onClose,
  onMessageSent,
  type,
  setType
}) => {
  const { publicKey, privateKey } = useAuth();
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, mutate } = useSendPrivateMessage();
  const { mutateAsync: sendMessage } = useEncryptedMessage();
  const roomIds = [publicKey, recipient];
  const { showToast } = useUIStore();
  const queryClient = useQueryClient();
  const { ndk } = useNostrContext();
  const [subject, setSubject] = useState('');

  const [activeTab, setActiveTab] = useState<"NIP4" | "NIP17">('NIP4');
  const [relayUrl, setRelayUrl] = useState('');

  const handleSendNip4 = async () => {
    try {

      if (!message) return;
      console.log('roomIds', roomIds);
      let receiverPublicKey = roomIds.find((id) => id !== publicKey);

      if (!receiverPublicKey) {
        showToast({ message: 'Invalid receiver', type: 'error' });
        return;
      }

      if (!privateKey) {
        showToast({ message: 'Please connect your wallet', type: 'error' });
        return;
      }

      // 1. Convert keys to Uint8Array
      const privateKeyBytes = hexToBytes(privateKey); // 32 bytes
      const receiverPublicKeyBytes = hexToBytes(receiverPublicKey); // 32 bytes

      // 2. Derive shared key using X25519
      const sharedKey = x25519.scalarMult(privateKeyBytes, receiverPublicKeyBytes); // 32 bytes

      // 3. Use sharedKey directly for AES-256-CBC
      const iv = generateRandomBytesLength(16);
      const ciphertext = await aes256cbcEncrypt(message, sharedKey, iv);

      // 4. Format as NIP-4 requires
      const ciphertextB64 = encodeBase64(ciphertext);
      const ivB64 = encodeBase64(iv);
      const encryptedContent = `${ciphertextB64}?iv=${ivB64}`;

      // 5. Create and send event
      const eventDirectMessage = new NDKEvent(ndk);
      eventDirectMessage.kind = NDKKind.EncryptedDirectMessage;
      eventDirectMessage.created_at = Math.floor(Date.now() / 1000);
      eventDirectMessage.content = encryptedContent;
      eventDirectMessage.tags = [
        ["p", receiverPublicKey, relayUrl],
        ...(subject ? [["subject", subject]] : []),
      ];
      await eventDirectMessage.publish();
      return eventDirectMessage;
    } catch (error) {
      console.log('error', error);
      showToast({ message: 'Error sending message', type: 'error' });
    }

  }
  const handleSubmitMessage = async (message: string) => {
    if (type == "NIP4") {
      await handleSendNip4();
    } else if (type == "NIP17") {
      await mutateAsync(
        {
          content: message,
          receiverPublicKeyProps: recipient,
        },
      );
    }
  }


  const handleActiveType = (type: "NIP4" | "NIP17") => {
    if (type == "NIP4") {
      setActiveTab("NIP4");
      setType?.("NIP4");
    } else if (type == "NIP17") {
      setActiveTab("NIP17");
      setType?.("NIP17");
    }
  }

  const handleSendMessage = async (message: string) => {
    if (!message) return;
    console.log('roomIds', roomIds);
    let receiverPublicKey = roomIds.find((id) => id !== publicKey);


    // TODO auto saved message
    if (roomIds[0] === roomIds[1]) {
      receiverPublicKey = roomIds[0] ?? publicKey;
    }
    if (!receiverPublicKey && roomIds.length > 1 && roomIds[0] != roomIds[1]) {
      showToast({ message: 'Invalid receiver', type: 'error' });
      return;
    }

    if (!receiverPublicKey) {
      showToast({ message: 'Invalid receiver', type: 'error' });
      return;
    }

    console.log('receiverPublicKey', receiverPublicKey);


    if (type == "NIP4") {

      const event = await sendMessage({
        content: message,
        receiverPublicKey: receiverPublicKey,
      })

      console.log('event', event);
      if (!event) {
        const eventTry = await handleSubmitMessage(message);
        console.log('eventTry', eventTry);
        // showToast({ message: 'Error sending message', type: 'error' });
        return;
      }

      showToast({ message: 'Message sent', type: 'success' });
      onMessageSent?.();
    } else if (type == "NIP17") {
      await mutateAsync(
        {
          content: message,
          receiverPublicKeyProps: receiverPublicKey,
        },
        {
          onSuccess: () => {
            showToast({ message: 'Message sent', type: 'success' });
            //   queryClient.invalidateQueries({
            //     queryKey: ['messagesSent'],
            //   });
          },
          onError() {
            showToast({ message: 'Error sending message', type: 'error' });
          },
        },
      );
    }

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
    <div className="p-4 card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">New Message</h2>
        <button
          onClick={onClose}
          className="p-2 rounded"
        >
          ×
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <button className={`flex-1 py-2 px-4 ${activeTab === 'NIP4' ? 'border-b-2 border-blue-500' : ''}`} onClick={() => handleActiveType("NIP4")}>
          NIP4
        </button>
        <button className={`flex-1 py-2 px-4 ${activeTab === 'NIP17' ? 'border-b-2 border-blue-500' : ''}`} onClick={() => handleActiveType("NIP17")}>
          NIP17
        </button>
      </div>

      <div
        //   onSubmit={handleSubmit} 
        className="space-y-4">
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
            // className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
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
