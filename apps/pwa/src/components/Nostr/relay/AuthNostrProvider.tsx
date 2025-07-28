import { useUIStore } from '@/store/uiStore';
import { AFK_RELAYS, checkIsConnected, RELAY_AFK_PRODUCTION, useAuth, useNostrContext, useRelayAuth, useRelayAuthState } from 'afk_nostr_sdk';
import { useEffect } from 'react';

const AuthNostrProviderComponent = () => {
  const {publicKey, privateKey} = useAuth();
  const { ndk, isNdkConnected, setIsNdkConnected } = useNostrContext();
  const { setupAuthListeners, authenticateWithRelay, isAuthenticating } = useRelayAuth();
  const { getAuthStatus, areAllRelaysAuthenticated } = useRelayAuthState();
  const {showToast} = useUIStore();

  // Set up auth listeners once when component mounts
  useEffect(() => {
    setupAuthListeners();
  }, []);

  // Handle connection and authentication
  useEffect(() => {
    const handleConnectionAndAuth = async () => {
      if (!isNdkConnected) {
        await checkIsConnected(ndk);
      }
      
      if (publicKey && privateKey && isNdkConnected) {
        await handleMultiAuth(AFK_RELAYS);
      }
    };

    handleConnectionAndAuth();
  }, [ndk, publicKey, privateKey, isNdkConnected]);

  const handleAuth = async () => {
    await authenticateWithRelay(RELAY_AFK_PRODUCTION);
  };

  const handleMultiAuth = async (relayUrls: string[]) => {
    console.log('handleMultiAuth', relayUrls);
    try {
      await checkIsConnected(ndk);
      const origin = window && window.location?.origin ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL;
      console.log('Authenticating with relays:', relayUrls);
      await Promise.all(relayUrls.map(url => authenticateWithRelay(url)));
      
      setIsNdkConnected(true);
      console.log('Successfully authenticated with all relays');
      // showToast({
      //   message: 'Authenticated with all relays!',
      //   description: 'You can now use the app',
      //   type: 'success',
      // });
    } catch (error) {
      console.error('Failed to authenticate with one or more relays:', error);
    }
  };

  return (
    <>
   
    </>
  );
};

export default AuthNostrProviderComponent;