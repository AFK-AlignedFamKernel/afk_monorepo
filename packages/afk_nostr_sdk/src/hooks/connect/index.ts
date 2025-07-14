import { useMutation } from "@tanstack/react-query";
import { useNostrContext } from "../../context/NostrContext";
import NDK from "@nostr-dev-kit/ndk";


export const checkIsConnected = async (ndk: NDK) => {
  try {
    const connectedRelays = ndk.pool.connectedRelays();
    console.log("connectedRelays", connectedRelays);
    if (connectedRelays.length === 0) {
      console.log("no connected relays");
      await ndk.connect();
      console.log("connected relays", ndk.pool.connectedRelays());
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