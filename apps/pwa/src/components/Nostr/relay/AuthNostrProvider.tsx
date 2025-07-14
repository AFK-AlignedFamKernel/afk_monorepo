import { useUIStore } from '@/store/uiStore';
import { AFK_RELAYS, RELAY_AFK_PRODUCTION, useAuth, useNostrContext, useRelayAuth, useRelayAuthState } from 'afk_nostr_sdk';
import { useEffect } from 'react';

const AuthNostrProviderComponent = () => {
  const {publicKey, privateKey} = useAuth();
  const { ndk } = useNostrContext();
  const { setupAuthListeners, authenticateWithRelay, isAuthenticating } = useRelayAuth();
  const { getAuthStatus, areAllRelaysAuthenticated } = useRelayAuthState();

  const {showToast} = useUIStore();
  useEffect(() => {

    if (publicKey && privateKey) {
      setupAuthListeners();
      handleMultiAuth(AFK_RELAYS);
    }
  }, [ publicKey, privateKey]);

  const handleAuth = async () => {
    await authenticateWithRelay(RELAY_AFK_PRODUCTION);
  };

  const handleMultiAuth = async (relayUrls: string[]) => {
    console.log('handleMultiAuth', relayUrls);
    try {
      const origin = window && window.location?.origin ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL;
      await Promise.all(relayUrls.map(url => authenticateWithRelay(url)));
      showToast({
        message: 'Authenticated with all relays!',
        description: 'You can now use the app',
        type: 'success',
      });
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