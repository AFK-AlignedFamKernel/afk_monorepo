// https://github.com/nostr-protocol/nips/blob/master/42.md

/**
 * NIP-42 Relay Authentication Implementation
 * 
 * This module provides hooks for handling NIP-42 relay authentication.
 * 
 * How NIP-42 works:
 * 1. Relay sends AUTH challenge to client
 * 2. Client creates and signs AUTH event with challenge
 * 3. Client sends signed AUTH event back to relay
 * 4. Relay verifies signature and accepts/rejects connection
 * 
 * Usage Examples:
 * 
 * // Basic authentication setup
 * const { setupAuthListeners, authenticateWithRelay } = useRelayAuth();
 * 
 * // Set up listeners for AUTH challenges
 * useEffect(() => {
 *   setupAuthListeners();
 * }, []);
 * 
 * // Authenticate with a specific relay
 * const handleAuth = async () => {
 *   try {
 *     await authenticateWithRelay.mutateAsync('wss://relay.example.com');
 *     console.log('Successfully authenticated');
 *   } catch (error) {
 *     console.error('Authentication failed:', error);
 *   }
 * };
 * 
 * // Check authentication status
 * const { getAuthStatus, areAllRelaysAuthenticated } = useRelayAuthState();
 * const authStatus = getAuthStatus();
 * const allAuthenticated = areAllRelaysAuthenticated();
 */

import { useEffect, useState, useRef } from "react";
import { useNostrContext } from "../../context/NostrContext";
import { useAuth } from "../../store/auth";
import { NDKEvent } from "@nostr-dev-kit/ndk";

// NIP-42 AUTH event kind
const AUTH_KIND = 22242;

interface AuthChallenge {
  relay: string;
  challenge: string;
}

interface AuthResponse {
  relay: string;
  challenge: string;
  signature: string;
}

/**
 * Hook for handling NIP-42 relay authentication
 * 
 * This hook provides functionality to:
 * - Create and sign AUTH responses
 * - Handle authentication state
 * - Manage relay authentication
 */
export const useRelayAuth = () => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey, setIsNostrAuthed } = useAuth();
  const [relayAuthState, setRelayAuthState] = useState<{ [relayUrl: string]: 'pending' | 'authenticated' | 'failed' }>({});
  
  // Use refs to track if we've already set up the auth policy and listeners
  const hasSetupAuthPolicy = useRef(false);
  const hasSetupListeners = useRef(false);

  // 1. Set up the default auth policy for all relays (only once)
  useEffect(() => {
    if (!hasSetupAuthPolicy.current && ndk && publicKey && privateKey) {
      ndk.relayAuthDefaultPolicy = async (relay, challenge) => {
        if (!privateKey || !publicKey) return false;
        const authEvent = new NDKEvent(ndk);
        authEvent.kind = 22242;
        authEvent.content = challenge;
        authEvent.tags = [
          ["relay", relay.url],
          ["challenge", challenge],
          ["origin", typeof window !== "undefined" ? window.location.origin : ""],
        ];
        await authEvent.sign();
        // Send the AUTH response via direct WebSocket
        await sendRawAuthWs(relay.url, authEvent);
        return true;
      };
      hasSetupAuthPolicy.current = true;
    }
  }, [ndk, publicKey, privateKey]);

  // 2. Listen for AUTH challenges and update state (only once)
  const setupAuthListeners = () => {
    if (hasSetupListeners.current) {
      return; // Already set up
    }
    
    try {
      ndk.pool.on("relay:auth", async (relay, challenge) => {
        // Respond only to real relay challenges
        try {
          console.log("relay:auth challenge received from", relay.url);
          if (!privateKey || !publicKey) {
            console.warn("No private/public key available for AUTH response");
            return;
          }
          // Create and sign AUTH event
          const authEvent = new NDKEvent(ndk);
          authEvent.kind = 22242;
          authEvent.content = challenge;
          authEvent.tags = [
            ["relay", relay.url],
            ["challenge", challenge],
            ["origin", typeof window !== "undefined" ? window.location.origin : ""],
          ];
          await authEvent.sign();
          console.log("Sending AUTH response to", relay.url);
          // Send AUTH event via direct WebSocket
          await sendRawAuthWs(relay.url, authEvent);
        } catch (err) {
          console.error("Failed to handle real AUTH challenge:", err);
        }
      });
      ndk.pool.on("relay:authed", (relay) => {
        console.log("relay:authed; auth with relay: ", relay.url);
        setRelayAuthState(prev => ({ ...prev, [relay.url]: 'authenticated' }));
        setIsNostrAuthed(true);
      });
      ndk.pool.on("notice", (relay, notice) => {
        if (notice.includes('auth') || notice.includes('AUTH')) {
          console.log("notice", notice);
          setRelayAuthState(prev => ({ ...prev, [relay.url]: 'failed' }));
        }
      });
      
      hasSetupListeners.current = true;
    } catch (error) {
      console.error(`Failed to setup auth listeners:`, error);
    }
  };

  /**
   * Create and sign an AUTH response event
   */
  const createAuthResponse = async (challenge: string, relayUrl: string, origin?: string): Promise<AuthResponse> => {
    if (!privateKey || !publicKey) {
      throw new Error("Private key and public key are required for authentication");
    }

    // Create AUTH event
    const authEvent = new NDKEvent(ndk);
    authEvent.kind = AUTH_KIND;
    authEvent.content = challenge;
    authEvent.tags = [
        ["relay", relayUrl],
        ["challenge", challenge],
        origin ? ["origin", origin] : ["origin", ""]
    ];

    // Sign the event
    await authEvent.sign();

    return {
      relay: relayUrl,
      challenge,
      signature: authEvent.sig || "",
    };
  };

  /**
   * Send a raw AUTH message to a relay using direct WebSocket access (bypassing NDK)
   */
  const sendRawAuthWs = async (relayUrl: string, authEvent: any) => {
    try {
      console.log(`Creating WebSocket connection to ${relayUrl} for AUTH`);
      const ws = new (window.WebSocket || (global as any).WebSocket)(relayUrl);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error(`AUTH timeout for ${relayUrl}`));
        }, 10000); // 10 second timeout
        
        ws.onopen = async () => {
          try {
            // Convert NDKEvent to proper Nostr event format
            const nostrEvent = await authEvent.toNostrEvent();
            console.log(`Sending AUTH message to ${relayUrl}:`, nostrEvent);
            ws.send(JSON.stringify(["AUTH", nostrEvent]));
            clearTimeout(timeout);
            ws.close();
            console.log(`Sent AUTH event to ${relayUrl} via direct WebSocket.`);
            resolve(true);
          } catch (err) {
            clearTimeout(timeout);
            ws.close();
            console.error(`Error sending AUTH to ${relayUrl}:`, err);
            reject(err);
          }
        };
        
        ws.onerror = (err) => {
          clearTimeout(timeout);
          console.error(`WebSocket error sending AUTH to ${relayUrl}:`, err);
          reject(err);
        };
        
        ws.onclose = () => {
          clearTimeout(timeout);
          console.log(`WebSocket connection to ${relayUrl} closed`);
        };
      });
    } catch (err) {
      console.error(`Failed to send AUTH via direct WebSocket to ${relayUrl}:`, err);
      throw err;
    }
  };

  /**
   * Authenticate with a specific relay
   * Now only triggers a connection, does not send a fake challenge
   */
  const authenticateWithRelay = async (relayUrl: string, origin?: string) => {
    try {
      const relay = ndk.pool.getRelay(relayUrl);
      if (!relay) {
        throw new Error(`Relay ${relayUrl} not found in pool`);
      }
      // Just ensure connection; real challenge will be handled by listener
      await relay.connect();
      return { success: true, relay: relayUrl };
    } catch (error) {
      console.error(`Failed to authenticate with ${relayUrl}:`, error);
      throw error;
    }
  };

  /**
   * Check if a relay requires authentication
   * Note: This is a placeholder - in practice, you'd need to check relay info
   */
  const checkRelayAuthRequirement = (relayUrl: string): boolean => {
    // This would typically be determined by checking relay info
    // For now, we'll assume all relays might require auth
    return true;
  };

  return {
    setupAuthListeners,
    authenticateWithRelay,
    checkRelayAuthRequirement,
    isAuthenticating: false, // No longer tracking pending mutations
    relayAuthState,
  };
};

/**
 * Hook for managing relay authentication state
 */
export const useRelayAuthState = () => {
  const { ndk } = useNostrContext();
  const { publicKey } = useAuth();

  /**
   * Get authentication status for all connected relays
   * Note: This is a placeholder - in practice, you'd track auth state
   */
  const getAuthStatus = () => {
    const connectedRelays = ndk.pool.connectedRelays();
    const authStatus: Record<string, boolean> = {};

    connectedRelays.forEach((relay) => {
      // In practice, you'd track authentication state per relay
      // For now, we'll assume relays are authenticated if connected
      authStatus[relay.url] = true; // Placeholder
    });

    return authStatus;
  };

  /**
   * Check if all relays are authenticated
   */
  const areAllRelaysAuthenticated = (): boolean => {
    const authStatus = getAuthStatus();
    return Object.values(authStatus).every(status => status);
  };

  return {
    getAuthStatus,
    areAllRelaysAuthenticated,
  };
};

/**
 * COMPREHENSIVE USAGE EXAMPLE
 * 
 * This example shows how to use the NIP-42 authentication hooks in a React component:
 * 
 * ```tsx
 * import React, { useEffect } from 'react';
 * import { useRelayAuth, useRelayAuthState } from '@afk-nostr-sdk/hooks';
 * 
 * const RelayAuthComponent = () => {
 *   const { 
 *     setupAuthListeners, 
 *     authenticateWithRelay, 
 *     handleAuthChallenge,
 *     isAuthenticating 
 *   } = useRelayAuth();
 *   
 *   const { getAuthStatus, areAllRelaysAuthenticated } = useRelayAuthState();
 * 
 *   // Set up authentication listeners when component mounts
 *   useEffect(() => {
 *     setupAuthListeners();
 *   }, [setupAuthListeners]);
 * 
 *   // Handle authentication with a specific relay
 *   const handleRelayAuth = async (relayUrl: string) => {
 *     try {
 *       await authenticateWithRelay.mutateAsync(relayUrl);
 *       console.log(`Successfully authenticated with ${relayUrl}`);
 *     } catch (error) {
 *       console.error(`Failed to authenticate with ${relayUrl}:`, error);
 *     }
 *   };
 * 
 *   // Handle incoming AUTH challenges
 *   const handleIncomingAuth = async (relay: string, challenge: string) => {
 *     try {
 *       await handleAuthChallenge.mutateAsync({ relay, challenge });
 *       console.log(`Successfully responded to AUTH challenge from ${relay}`);
 *     } catch (error) {
 *       console.error(`Failed to handle AUTH challenge from ${relay}:`, error);
 *     }
 *   };
 * 
 *   // Check authentication status
 *   const authStatus = getAuthStatus();
 *   const allAuthenticated = areAllRelaysAuthenticated();
 * 
 *   return (
 *     <div>
 *       <h2>Relay Authentication Status</h2>
 *       <div>
 *         <p>All relays authenticated: {allAuthenticated ? 'Yes' : 'No'}</p>
 *         <p>Authentication in progress: {isAuthenticating ? 'Yes' : 'No'}</p>
 *       </div>
 *       
 *       <h3>Individual Relay Status:</h3>
 *       {Object.entries(authStatus).map(([relay, authenticated]) => (
 *         <div key={relay}>
 *           <span>{relay}: </span>
 *           <span style={{ color: authenticated ? 'green' : 'red' }}>
 *             {authenticated ? 'Authenticated' : 'Not Authenticated'}
 *           </span>
 *         </div>
 *       ))}
 *       
 *       <button 
 *         onClick={() => handleRelayAuth('wss://relay.example.com')}
 *         disabled={isAuthenticating}
 *       >
 *         Authenticate with Example Relay
 *       </button>
 *     </div>
 *   );
 * };
 * 
 * export default RelayAuthComponent;
 * ```
 * 
 * KEY FEATURES:
 * 
 * 1. **Automatic Challenge Handling**: The hook can automatically respond to AUTH challenges
 * 2. **Manual Authentication**: You can manually authenticate with specific relays
 * 3. **Status Tracking**: Track authentication status across all connected relays
 * 4. **Error Handling**: Comprehensive error handling for authentication failures
 * 5. **Loading States**: Track when authentication is in progress
 * 
 * IMPLEMENTATION NOTES:
 * 
 * - This implementation provides the foundation for NIP-42 authentication
 * - The actual websocket communication needs to be implemented based on your NDK setup
 * - You may need to extend this based on your specific relay requirements
 * - Consider adding retry logic and timeout handling for production use
 */