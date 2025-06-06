import { NDKEvent, NDKKind, NDKPrivateKeySigner, NDKUser } from '@nostr-dev-kit/ndk';
import { useMutation } from '@tanstack/react-query';

import { useNostrContext } from '../../context';
import { useAuth } from '../../store';

/**
 * NIP-60: https://nips.nostr.com/60
 * Token Event: https://nips.nostr.com/60#token-event
 */

interface CreateTokenEventParams {
  walletId: string;
  mint: string;
  proofs: Array<{
    id: string;
    amount: number;
    secret: string;
    C: string;
  }>;
  event_id_del?: string;
  event_id_dels?: string[];
}

export const useCreateTokenEvent = () => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();

  return useMutation<NDKEvent, Error, CreateTokenEventParams>({
    mutationFn: async ({
      walletId,
      mint,
      proofs,
      event_id_dels,
    }: {
      walletId: string;
      mint: string;
      proofs: Array<{
        id: string;
        amount: number;
        secret: string;
        C: string;
      }>;
      event_id_dels?: string[];
    }) => {
      try {
        const signer = new NDKPrivateKeySigner(privateKey);
        const user = new NDKUser({ pubkey: publicKey });
        const content = await signer.encrypt(
          user,
          JSON.stringify({
            mint,
            proofs,
            "del": [event_id_dels?.map((id) => id)]
          }),
          "nip44"
        );
  
        const event = new NDKEvent(ndk);
  
        event.kind = NDKKind.CashuToken;
        event.content = content;
        // event.tags = [['a', `37375:${publicKey}:${walletId}`]];
  
        await event.sign(signer);
  
        await event.publish();
        return event;  
      } catch (error) {
        console.log("error",error)
        
      }
      
    },
  });
};
