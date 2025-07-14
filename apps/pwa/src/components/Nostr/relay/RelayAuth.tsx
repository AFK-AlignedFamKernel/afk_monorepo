import { AFK_RELAYS, RELAY_AFK_PRODUCTION, useRelayAuth, useRelayAuthState } from 'afk_nostr_sdk';
import { useEffect } from 'react';

const RelayAuthComponent = () => {
  const { setupAuthListeners, authenticateWithRelay, isAuthenticating } = useRelayAuth();
  const { getAuthStatus, areAllRelaysAuthenticated } = useRelayAuthState();

  useEffect(() => {
    setupAuthListeners();
  }, []);

  const handleAuth = async () => {
    await authenticateWithRelay(RELAY_AFK_PRODUCTION);
  };

  const handleMultiAuth = async (relayUrls: string[]) => {
    try {
      await Promise.all(relayUrls.map(url => authenticateWithRelay(url)));
      alert('Authenticated with all relays!');
    } catch (error) {
      console.error('Failed to authenticate with one or more relays:', error);
    }
  };

  return (
    <>
      <button onClick={handleAuth} disabled={isAuthenticating}>
        Authenticate with Relay
      </button>
      <button
        onClick={() => handleMultiAuth(AFK_RELAYS)}
        disabled={isAuthenticating}
      >
        Authenticate with All Relays
      </button>
    </>
  );
};

export default RelayAuthComponent;