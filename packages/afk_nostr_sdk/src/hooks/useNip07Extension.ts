import {useNostrContext} from '../context/NostrContext';
import {useAuth} from '../store';
export type UseRootProfilesOptions = {
  authors?: string[];
  search?: string;
};

export const useNip07Extension = (options?: UseRootProfilesOptions) => {
  const {ndk, nip07Signer} = useNostrContext();
  const {setAuth, setPublicKey, setIsExtensionConnect} = useAuth();
  const getPublicKey = async () => {
    return nip07Signer?.user().then(async (user) => {
      if (user.pubkey) {
        console.log('Permission granted to read their public key:', user.pubkey);
        setPublicKey(user.pubkey);
        setIsExtensionConnect(true);
        return user.pubkey
      }
    });
    // if (typeof window !== 'undefined') {
    //   const pubkey = await window?.nostr?.getPublicKey();
    //   const created_at = new Date().getTime();
    //   // setPublicKey(pubkey)
    //   // if (pubkey) {
    //   //   setIsExtensionConnect(true)
    //   // }
    // }
  };
  return {
    getPublicKey,
  };
};
