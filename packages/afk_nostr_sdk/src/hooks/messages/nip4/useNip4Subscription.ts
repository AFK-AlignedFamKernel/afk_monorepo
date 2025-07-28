import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import NDK, { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useNostrContext } from '../../../context/NostrContext';
import { useAuth } from '../../../store';
import { useRelayAuthState } from '../../connect/auth';
import { checkIsConnected } from '../../connect';

interface Nip4SubscriptionOptions {
  enabled?: boolean;
  onNewMessage?: (event: NDKEvent) => void;
  onError?: (error: Error) => void;
}

interface AuthenticatedRelay {
  url: string;
  isAuthenticated: boolean;
}

export const useNip4Subscription = (options: Nip4SubscriptionOptions = {}) => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();
  const { getAuthStatus } = useRelayAuthState();
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [authenticatedRelays, setAuthenticatedRelays] = useState<AuthenticatedRelay[]>([]);
  const [messages, setMessages] = useState<NDKEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const subscriptionRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Memoize auth status to prevent unnecessary re-renders
  const authStatus = useMemo(() => getAuthStatus(), [getAuthStatus]);

  // Get authenticated relays - memoized to prevent recreation
  const getAuthenticatedRelays = useCallback(() => {
    const connectedRelays = ndk.pool.connectedRelays();
    
    return connectedRelays
      .filter(relay => authStatus[relay.url])
      .map(relay => ({
        url: relay.url,
        isAuthenticated: authStatus[relay.url]
      }));
  }, [ndk.pool, authStatus]);

  // Fetch messages from authenticated relays only
  const fetchMessagesFromAuthenticatedRelays = useCallback(async () => {
    if (!publicKey || !privateKey) {
      console.log('No keys available for fetching messages');
      return [];
    }

    const connectedRelays = ndk.pool.connectedRelays();
    const authRelays = connectedRelays
      .filter(relay => authStatus[relay.url])
      .map(relay => ({
        url: relay.url,
        isAuthenticated: authStatus[relay.url]
      }));

    if (authRelays.length === 0) {
      console.log('No authenticated relays available');
      return [];
    }

    console.log('Fetching messages from authenticated relays:', authRelays.map(r => r.url));

    try {
      setIsLoading(true);
      setError(null);

      // Create filters for sent and received messages
      const sentFilter = {
        kinds: [NDKKind.EncryptedDirectMessage],
        authors: [publicKey],
        limit: 50,
      };
      console.log("sentFilter", sentFilter);

      console.log("publicKey", publicKey);

      const receivedFilter = {
        kinds: [NDKKind.EncryptedDirectMessage],
        '#p': [publicKey],
        limit: 50,
      };

      console.log("sentFilter", sentFilter);

      // Fetch from authenticated relays only
      const [sentEvents, receivedEvents] = await Promise.all([
        ndk.fetchEvents(sentFilter),
        ndk.fetchEvents(receivedFilter),
      ]);

      const allEvents = [...Array.from(sentEvents), ...Array.from(receivedEvents)];
      
      console.log("allEvents", allEvents);
      // Sort by creation time (newest first)
      allEvents.sort((a, b) => b.created_at - a.created_at);

      console.log(`Fetched ${allEvents.length} NIP-4 messages from authenticated relays`);
      return allEvents;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch messages');
      console.error('Error fetching NIP-4 messages:', error);
      setError(error);
      options.onError?.(error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [ndk, publicKey, privateKey, authStatus, options]);

  // Set up subscription to authenticated relays
  const setupSubscription = useCallback(async () => {
    if (!publicKey || !privateKey || isSubscribedRef.current) {
      return;
    }

    const connectedRelays = ndk.pool.connectedRelays();
    const authRelays = connectedRelays
      .filter(relay => authStatus[relay.url])
      .map(relay => ({
        url: relay.url,
        isAuthenticated: authStatus[relay.url]
      }));

    if (authRelays.length === 0) {
      console.log('No authenticated relays available for subscription');
      return;
    }

    try {
      console.log('Setting up NIP-4 subscription on authenticated relays:', authRelays.map(r => r.url));

      // Create subscription filters
      const filters = [
        {
          kinds: [NDKKind.EncryptedDirectMessage],
          authors: [publicKey],
        },
        {
          kinds: [NDKKind.EncryptedDirectMessage],
          '#p': [publicKey],
        }
      ];

      // Create subscription
      const subscription = ndk.subscribe(filters, {
        closeOnEose: false, // Keep subscription open for real-time updates
      });

      subscription.on('event', (event: NDKEvent) => {
        console.log('Received NIP-4 event via subscription:', event.id);
        
        // Add new message to state
        setMessages(prev => {
          // Check if event already exists
          const exists = prev.some(e => e.id === event.id);
          if (!exists) {
            const newMessages = [event, ...prev];
            // Sort by creation time (newest first)
            newMessages.sort((a, b) => b.created_at - a.created_at);
            return newMessages;
          }
          return prev;
        });

        // Call callback if provided
        options.onNewMessage?.(event);
      });

      subscription.on('eose', () => {
        console.log('NIP-4 subscription EOSE received');
      });

      subscription.on('close', () => {
        console.log('NIP-4 subscription closed');
      });

      subscriptionRef.current = subscription;
      isSubscribedRef.current = true;
      setIsSubscribed(true);

      console.log('NIP-4 subscription set up successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to set up subscription');
      console.error('Error setting up NIP-4 subscription:', error);
      setError(error);
      options.onError?.(error);
    }
  }, [ndk, publicKey, privateKey, authStatus, options]);

  // Clean up subscription
  const cleanupSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.stop();
        console.log('NIP-4 subscription stopped');
      } catch (err) {
        console.error('Error stopping NIP-4 subscription:', err);
      }
      subscriptionRef.current = null;
    }
    isSubscribedRef.current = false;
    setIsSubscribed(false);
  }, []);

  // Manual initialization function - call this directly instead of useEffect
  const initialize = useCallback(async () => {
    if (!options.enabled || !publicKey || !privateKey || hasInitializedRef.current) {
      return;
    }

    try {
      hasInitializedRef.current = true;
      await checkIsConnected(ndk);
      
      // Update authenticated relays directly
      const connectedRelays = ndk.pool.connectedRelays();
      const authRelays = connectedRelays
        .filter(relay => authStatus[relay.url])
        .map(relay => ({
          url: relay.url,
          isAuthenticated: authStatus[relay.url]
        }));
      setAuthenticatedRelays(authRelays);

      if (authRelays.length > 0) {
        // Fetch initial messages directly without using the callback
        try {
          setIsLoading(true);
          setError(null);

          // Create filters for sent and received messages
          const sentFilter = {
            kinds: [NDKKind.EncryptedDirectMessage],
            authors: [publicKey],
            limit: 50,
          };
          console.log("sentFilter", sentFilter);

          console.log("publicKey", publicKey);

          const receivedFilter = {
            kinds: [NDKKind.EncryptedDirectMessage],
            '#p': [publicKey],
            limit: 50,
          };

          console.log("sentFilter", sentFilter);

          // Fetch from authenticated relays only
          const [sentEvents, receivedEvents] = await Promise.all([
            ndk.fetchEvents(sentFilter),
            ndk.fetchEvents(receivedFilter),
          ]);

          const allEvents = [...Array.from(sentEvents), ...Array.from(receivedEvents)];
          
          console.log("allEvents", allEvents);
          // Sort by creation time (newest first)
          allEvents.sort((a, b) => b.created_at - a.created_at);

          console.log(`Fetched ${allEvents.length} NIP-4 messages from authenticated relays`);
          setMessages(allEvents);
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to fetch messages');
          console.error('Error fetching NIP-4 messages:', error);
          setError(error);
          options.onError?.(error);
        } finally {
          setIsLoading(false);
        }

        // Set up subscription directly without using the callback
        if (!publicKey || !privateKey || isSubscribedRef.current) {
          return;
        }

        try {
          console.log('Setting up NIP-4 subscription on authenticated relays:', authRelays.map(r => r.url));

          // Create subscription filters
          const filters = [
            {
              kinds: [NDKKind.EncryptedDirectMessage],
              authors: [publicKey],
            },
            {
              kinds: [NDKKind.EncryptedDirectMessage],
              '#p': [publicKey],
            }
          ];

          // Create subscription
          const subscription = ndk.subscribe(filters, {
            closeOnEose: false, // Keep subscription open for real-time updates
          });

          subscription.on('event', (event: NDKEvent) => {
            console.log('Received NIP-4 event via subscription:', event.id);
            
            // Add new message to state
            setMessages(prev => {
              // Check if event already exists
              const exists = prev.some(e => e.id === event.id);
              if (!exists) {
                const newMessages = [event, ...prev];
                // Sort by creation time (newest first)
                newMessages.sort((a, b) => b.created_at - a.created_at);
                return newMessages;
              }
              return prev;
            });

            // Call callback if provided
            options.onNewMessage?.(event);
          });

          subscription.on('eose', () => {
            console.log('NIP-4 subscription EOSE received');
          });

          subscription.on('close', () => {
            console.log('NIP-4 subscription closed');
          });

          subscriptionRef.current = subscription;
          isSubscribedRef.current = true;
          setIsSubscribed(true);

          console.log('NIP-4 subscription set up successfully');
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to set up subscription');
          console.error('Error setting up NIP-4 subscription:', error);
          setError(error);
          options.onError?.(error);
        }
      } else {
        console.log('No authenticated relays available');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize NIP-4 subscription');
      console.error('Error initializing NIP-4 subscription:', error);
      setError(error);
      options.onError?.(error);
      hasInitializedRef.current = false; // Reset on error so we can retry
    }
  }, [options.enabled, publicKey, privateKey, ndk, authStatus, options]);

  // Refresh messages manually
  const refreshMessages = useCallback(async () => {
    const newMessages = await fetchMessagesFromAuthenticatedRelays();
    setMessages(newMessages);
  }, [fetchMessagesFromAuthenticatedRelays]);

  // Reset initialization state
  const reset = useCallback(() => {
    hasInitializedRef.current = false;
    cleanupSubscription();
  }, [cleanupSubscription]);

  return {
    messages,
    isLoading,
    error,
    isSubscribed,
    authenticatedRelays,
    refreshMessages,
    cleanupSubscription,
    initialize, // Manual initialization function
    reset, // Reset function to allow re-initialization
  };
}; 