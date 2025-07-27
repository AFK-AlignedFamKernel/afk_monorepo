import { useUIStore } from '@/store/uiStore';
import { AFK_RELAYS, checkIsConnected, RELAY_AFK_PRODUCTION, useAuth, useNostrContext, useRelayAuth, useRelayAuthState } from 'afk_nostr_sdk';
import { useEffect } from 'react';

const AuthNostrProviderComponent = () => {
  const {publicKey, privateKey} = useAuth();
  const { ndk, isNdkConnected, setIsNdkConnected } = useNostrContext();
  const { setupAuthListeners, authenticateWithRelay, isAuthenticating } = useRelayAuth();
  const { getAuthStatus, areAllRelaysAuthenticated } = useRelayAuthState();
  const {showToast} = useUIStore();
  useEffect(() => {

    if (publicKey && privateKey && isNdkConnected) {

      setupAuthListeners();
      handleMultiAuth(AFK_RELAYS);
    }
  }, [ ndk, publicKey, privateKey, isNdkConnected]);

  useEffect(() => {
    if(!isNdkConnected){
      checkIsConnected(ndk);  
    }
  }, [isNdkConnected]);

  const handleAuth = async () => {
    await authenticateWithRelay(RELAY_AFK_PRODUCTION);
  };

  useEffect(() => {
    if(!isNdkConnected){
      setupAuthListeners();
      handleMultiAuth(AFK_RELAYS);
    }
  }, [isNdkConnected]);

  const handleMultiAuth = async (relayUrls: string[]) => {
    // console.log('handleMultiAuth', relayUrls);
    try {
      await checkIsConnected(ndk);
      const origin = window && window.location?.origin ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL;
      await Promise.all(relayUrls.map(url => authenticateWithRelay(url)));
      
      setIsNdkConnected(true);
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