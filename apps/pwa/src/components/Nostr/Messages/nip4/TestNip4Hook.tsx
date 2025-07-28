'use client';

import React, { useState } from 'react';
import { useEncryptedMessage } from 'afk_nostr_sdk';
import { useAuth } from 'afk_nostr_sdk';
import { useUIStore } from '@/store/uiStore';

export const TestNip4Hook: React.FC = () => {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  
  const { mutateAsync: sendEncryptedMessage } = useEncryptedMessage();
  const { publicKey, privateKey } = useAuth();
  const { showToast } = useUIStore();

  const handleTestSend = async () => {
    if (!message.trim() || !recipient.trim()) {
      showToast({ message: 'Please fill in both recipient and message', type: 'error' });
      return;
    }

    if (!privateKey || !publicKey) {
      showToast({ message: 'Please connect your wallet first', type: 'error' });
      return;
    }

    setIsLoading(true);
    setTestResult('Testing...');

    try {
      console.log('Testing NIP-04 message sending...');
      console.log('Recipient:', recipient);
      console.log('Message:', message);
      console.log('Public Key:', publicKey);
      console.log('Private Key exists:', !!privateKey);

      const result = await sendEncryptedMessage({
        content: message,
        receiverPublicKey: recipient,
      });

      console.log('NIP-04 message sent successfully:', result);
      setTestResult('✅ NIP-04 message sent successfully!\n\nEvent Details:\n' + 
        `ID: ${result.id}\n` +
        `Kind: ${result.kind}\n` +
        `Created: ${new Date(result.created_at * 1000).toISOString()}\n` +
        `Content: ${result.content.substring(0, 100)}...\n` +
        `Tags: ${JSON.stringify(result.tags, null, 2)}`
      );
      showToast({ message: 'NIP-04 message sent successfully!', type: 'success' });
      
      // Clear form
      setMessage('');
      setRecipient('');
    } catch (error) {
      console.error('Error sending NIP-04 message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResult(`❌ Error: ${errorMessage}\n\nThis might be due to:\n` +
        `• Relay connection issues\n` +
        `• Authentication problems\n` +
        `• Invalid recipient public key\n` +
        `• Network connectivity issues\n\n` +
        `Please check the console for more details.`
      );
      showToast({ message: 'Failed to send NIP-04 message', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Test NIP-04 Message Sending</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Recipient Public Key:
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Enter recipient's public key"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Test Message:
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter test message"
            rows={3}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleTestSend}
            disabled={isLoading || !message.trim() || !recipient.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Test Send NIP-04 Message'}
          </button>
        </div>

        {testResult && (
          <div className="mt-4 p-3 bg-white border rounded">
            <h4 className="font-medium mb-2">Test Result:</h4>
            <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-medium mb-2">Current State:</h4>
          <div className="text-sm space-y-1">
            <div>Public Key: {publicKey ? `${publicKey.slice(0, 8)}...${publicKey.slice(-8)}` : 'Not connected'}</div>
            <div>Private Key: {privateKey ? 'Available' : 'Not available'}</div>
            <div>Recipient: {recipient ? `${recipient.slice(0, 8)}...${recipient.slice(-8)}` : 'Not set'}</div>
            <div>Message Length: {message.length} characters</div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-medium mb-2">Note:</h4>
          <div className="text-sm">
            <p>• NIP-04 messages are encrypted using X25519 + AES-256-CBC</p>
            <p>• Messages are published to standard Nostr relays (not the AFK algorithmic relay)</p>
            <p>• Both sender and recipient need their private keys to decrypt messages</p>
            <p>• Test with a valid Nostr public key (64 character hex string)</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 