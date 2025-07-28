import React from 'react';
import { useNip4Subscription, useRelayAuthInit } from 'afk_nostr_sdk';
import { useAuth } from 'afk_nostr_sdk';
import { useUIStore } from '@/store/uiStore';

export const Nip4SubscriptionExample: React.FC = () => {
  const { publicKey, privateKey } = useAuth();
  const { isAuthenticated, isInitializing, hasError, errorMessage, initializeAuth } = useRelayAuthInit();
  const { showToast } = useUIStore();

  const {
    messages,
    isLoading,
    error,
    isSubscribed,
    authenticatedRelays,
    refreshMessages,
    cleanupSubscription,
  } = useNip4Subscription({
    enabled: isAuthenticated && !!publicKey && !!privateKey,
    onNewMessage: (event) => {
      console.log('New NIP-4 message received:', event.id);
      showToast({
        message: 'New message received',
        type: 'success',
      });
    },
    onError: (error) => {
      console.error('NIP-4 subscription error:', error);
      showToast({
        message: 'Error receiving messages',
        description: error.message,
        type: 'error',
      });
    },
  });

  if (isInitializing) {
    return (
      <div className="p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p>Initializing relay authentication...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-4">
        <h3 className="text-red-600 font-semibold">Authentication Failed</h3>
        <p className="text-gray-600">{errorMessage}</p>
        <button
          onClick={() => initializeAuth()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry Authentication
        </button>
      </div>
    );
  }

  if (!isAuthenticated && publicKey && privateKey) {
    return (
      <div className="p-4">
        <h3 className="font-semibold">Authentication Required</h3>
        <p className="text-gray-600">Please authenticate with relays to access messages</p>
        <button
          onClick={() => initializeAuth()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Initialize Authentication
        </button>
      </div>
    );
  }

  if (!publicKey) {
    return (
      <div className="p-4">
        <h3 className="font-semibold">Connect your Nostr account</h3>
        <p className="text-gray-600">You need to connect your Nostr account first</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">NIP-4 Subscription Status</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>Subscription: {isSubscribed ? 'Active' : 'Inactive'}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-green-500'}`} />
            <span>Loading: {isLoading ? 'Yes' : 'No'}</span>
          </div>
          
          <div>
            <span>Authenticated Relays: {authenticatedRelays.length}</span>
            {authenticatedRelays.length > 0 && (
              <ul className="ml-4 text-xs text-gray-600">
                {authenticatedRelays.map((relay, index) => (
                  <li key={index}>• {relay.url}</li>
                ))}
              </ul>
            )}
          </div>
          
          <div>
            <span>Messages: {messages.length}</span>
          </div>
        </div>
        
        <div className="mt-4 space-x-2">
          <button
            onClick={refreshMessages}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Refresh Messages
          </button>
          
          <button
            onClick={cleanupSubscription}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Stop Subscription
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <h4 className="text-red-800 font-semibold">Error</h4>
          <p className="text-red-600 text-sm">{error.message}</p>
        </div>
      )}

      {messages.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Recent Messages</h3>
          <div className="space-y-2">
            {messages.slice(0, 5).map((message, index) => (
              <div key={message.id || index} className="text-sm border-b pb-2">
                <div className="font-medium">Message {index + 1}</div>
                <div className="text-gray-600">ID: {message.id}</div>
                <div className="text-gray-600">From: {message.pubkey?.slice(0, 8)}...</div>
                <div className="text-gray-600">Created: {message.created_at ? new Date(message.created_at * 1000).toLocaleString() : 'Unknown'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 