import { useCallback, useEffect, useState, useRef } from 'react';
import { useNostrContext } from '../../context/NostrContext';
import { useAuth } from '../../store/auth';
import { useRelayAuth, useRelayAuthState } from './auth';
import { checkIsConnected } from './index';
import { AFK_RELAYS } from '../../utils/relay';

export interface RelayAuthStatus {
  isInitializing: boolean;
  isAuthenticated: boolean;
  hasError: boolean;
  errorMessage?: string;
  authenticatedRelays: string[];
  failedRelays: string[];
}

export const useRelayAuthInit = () => {
  const { ndk, isNdkConnected } = useNostrContext();
  const { publicKey, privateKey, isNostrAuthed, setIsNostrAuthed } = useAuth();
  const { setupAuthListeners, authenticateWithRelay } = useRelayAuth();
  const { getAuthStatus, areAllRelaysAuthenticated } = useRelayAuthState();
  
  const [authStatus, setAuthStatus] = useState<RelayAuthStatus>({
    isInitializing: false,
    isAuthenticated: false,
    hasError: false,
    authenticatedRelays: [],
    failedRelays: [],
  });
  
  // Prevent multiple simultaneous authentication attempts
  const isAuthenticating = useRef(false);
  const lastAuthAttempt = useRef<number>(0);

  // Initialize authentication with all relays
  const initializeAuth = useCallback(async (relayUrls?: string[]) => {
    if (!publicKey || !privateKey) {
      setAuthStatus(prev => ({
        ...prev,
        hasError: true,
        errorMessage: 'No public/private key available',
      }));
      return false;
    }

    // Prevent multiple simultaneous authentication attempts
    if (isAuthenticating.current) {
      console.log('Authentication already in progress, skipping');
      return false;
    }

    // Prevent too frequent authentication attempts (cooldown of 5 seconds)
    const now = Date.now();
    if (now - lastAuthAttempt.current < 5000) {
      console.log('Authentication attempted too recently, skipping');
      return false;
    }

    lastAuthAttempt.current = now;
    isAuthenticating.current = true;
    setAuthStatus(prev => ({
      ...prev,
      isInitializing: true,
      hasError: false,
      errorMessage: undefined,
    }));

    try {
      // 1. Set up auth listeners
      setupAuthListeners();

      // 2. Ensure NDK is connected
      await checkIsConnected(ndk);

      // 3. Authenticate with relays
      const relaysToAuth = relayUrls || AFK_RELAYS;
      const authPromises = relaysToAuth.map(async (relayUrl) => {
        try {
          await authenticateWithRelay(relayUrl);
          return { relayUrl, success: true };
        } catch (error) {
          console.error(`Failed to authenticate with ${relayUrl}:`, error);
          return { relayUrl, success: false, error };
        }
      });

      const results = await Promise.allSettled(authPromises);
      
      const authenticatedRelays: string[] = [];
      const failedRelays: string[] = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            authenticatedRelays.push(result.value.relayUrl);
          } else {
            failedRelays.push(result.value.relayUrl);
          }
        } else {
          failedRelays.push('unknown');
        }
      });

      const isAuthenticated = authenticatedRelays.length > 0;
      
      if (isAuthenticated) {
        setIsNostrAuthed(true);
      }

      setAuthStatus({
        isInitializing: false,
        isAuthenticated,
        hasError: failedRelays.length > 0,
        errorMessage: failedRelays.length > 0 ? `Failed to authenticate with ${failedRelays.length} relay(s)` : undefined,
        authenticatedRelays,
        failedRelays,
      });

      isAuthenticating.current = false;
      return isAuthenticated;
    } catch (error) {
      console.error('Failed to initialize authentication:', error);
      setAuthStatus(prev => ({
        ...prev,
        isInitializing: false,
        hasError: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }));
      isAuthenticating.current = false;
      return false;
    }
  }, [ndk, publicKey, privateKey, setupAuthListeners, authenticateWithRelay, setIsNostrAuthed]);

  // Check current authentication status
  const checkAuthStatus = useCallback(async () => {
    if (!publicKey || !privateKey) {
      return false;
    }

    try {
      await checkIsConnected(ndk);
      const authStatus = getAuthStatus();
      const isAuthenticated = areAllRelaysAuthenticated();
      
      setAuthStatus(prev => ({
        ...prev,
        isAuthenticated,
        authenticatedRelays: Object.keys(authStatus).filter(key => authStatus[key]),
        failedRelays: Object.keys(authStatus).filter(key => !authStatus[key]),
      }));

      return isAuthenticated;
    } catch (error) {
      console.error('Failed to check auth status:', error);
      return false;
    }
  }, [ndk, publicKey, privateKey, getAuthStatus, areAllRelaysAuthenticated]);

  // Auto-initialize when keys are available
  useEffect(() => {
    const now = Date.now();
    if (publicKey && privateKey && isNdkConnected && !authStatus.isAuthenticated && !authStatus.isInitializing && !isAuthenticating.current && (now - lastAuthAttempt.current > 5000)) {
      initializeAuth();
    }
  }, [publicKey, privateKey, isNdkConnected, authStatus.isAuthenticated, authStatus.isInitializing, initializeAuth]);

  // Check auth status periodically
  useEffect(() => {
    if (publicKey && privateKey) {
      const interval = setInterval(() => {
        checkAuthStatus();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [publicKey, privateKey, checkAuthStatus]);

  // Reset authentication state when keys change
  useEffect(() => {
    if (!publicKey || !privateKey) {
      setAuthStatus({
        isInitializing: false,
        isAuthenticated: false,
        hasError: false,
        authenticatedRelays: [],
        failedRelays: [],
      });
      isAuthenticating.current = false;
    }
  }, [publicKey, privateKey]);

  return {
    authStatus,
    initializeAuth,
    checkAuthStatus,
    isAuthenticated: authStatus.isAuthenticated,
    isInitializing: authStatus.isInitializing,
    hasError: authStatus.hasError,
    errorMessage: authStatus.errorMessage,
    authenticatedRelays: authStatus.authenticatedRelays,
    failedRelays: authStatus.failedRelays,
  };
}; 