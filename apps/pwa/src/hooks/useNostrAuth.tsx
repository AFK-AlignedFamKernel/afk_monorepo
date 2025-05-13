import { useAuth, useNip07Extension, useNostrContext } from 'afk_nostr_sdk';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { NostrProfileManagement } from '@/components/Nostr/profile/nostr-profile-management';
import NostrCreateAccountComponent from '@/components/Nostr/login/NostrCreateAccount';

export const useNostrAuth = () => {
  const { publicKey, privateKey } = useAuth();
  const { ndk } = useNostrContext();
  const { getPublicKey } = useNip07Extension();
  const router = useRouter();
  const { showModal, showToast } = useUIStore();

  const isNostrConnected = useMemo(() => {
    return publicKey ? true : false;
  }, [publicKey]);

  const handleCheckNostrAndSendConnectDialog = async () => {
    // @todo fix
    if (!isNostrConnected) {

      showModal((
        <>
          <div>
            <h1>Login your Nostr accounts</h1>
            <NostrProfileManagement />
            <NostrCreateAccountComponent />
          </div>
        </>
      ))
      // show();
    }

    return isNostrConnected;
  };

  const handleGoLogin = () => {
    showModal((
      <>
        <p>Login your Nostr accounts</p>
        <button onClick={() => {
          router.push('/nostr/login');
        }}>Continue</button>
      </>
    ))
  };

  const handleCreateNostrAccount = () => {
    showModal((
      <>
        <h1>WARNING</h1>
        <p>Creating a new account will delete your current account. Are you sure you want to continue?</p>
        <button onClick={() => {
          router.push('/nostr/login');
        }}>Continue</button>
      </>
    ))
  };


  const handleExtensionConnect = () => {
    showModal((
      <>
        <h1>WARNING</h1>
        <p>Used your Nostr extension.</p>
        <button onClick={() => {
          getPublicKey();
          // navigation.navigate('ImportKeys');
          // hideDialog();
        }}>Continue</button>
      </>
    ))
  };

  return {
    isNostrConnected,
    handleCheckNostrAndSendConnectDialog,
    handleCreateNostrAccount,
    handleExtensionConnect,
    handleGoLogin,
  };
};
