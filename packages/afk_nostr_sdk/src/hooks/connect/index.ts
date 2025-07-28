import { useMutation } from "@tanstack/react-query";
import { useNostrContext } from "../../context/NostrContext";
import NDK from "@nostr-dev-kit/ndk";


export const checkIsConnected = async (ndk: NDK) => {
  try {
    const connectedRelays = ndk.pool.connectedRelays();
    //  console.log("connectedRelays", connectedRelays);
    if (connectedRelays.length === 0) {
      console.log("no connected relays, please wait");
      
      // Add timeout to connection
      await Promise.race([
        ndk.connect(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        )
      ]);
      
      // console.log("connected relays", ndk.pool.connectedRelays());
    }

    return true;
  } catch (error) {
    console.log("error", error);
    return false;
  }
};

export const useConnect = () => {
  const { ndk } = useNostrContext();


  return useMutation({
    mutationKey: ['connect', ndk],
    mutationFn: async () => {
      await checkIsConnected(ndk);
    },
  });
};  