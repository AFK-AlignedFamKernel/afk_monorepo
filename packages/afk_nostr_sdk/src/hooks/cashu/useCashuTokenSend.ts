import {Proof} from '@cashu/cashu-ts';
import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation, UseMutationResult  } from '@tanstack/react-query';

import {useNostrContext} from '../../context';
import {useAuth} from '../../store';
import {deriveSharedKey, fixPubKey, generateRandomBytes} from '../../utils/keypair';
import {v2} from '../../utils/nip44';

/**https://github.com/nostr-protocol/nips/blob/9f9ab83ee9809251d0466f22c188a0f13abd585a/60.md 
/**
 *  https://github.com/nostr-protocol/nips/pull/1369/files */

/**
 * 
 * ## Token Event
Token events are used to record the unspent proofs that come from the mint.
There can be multiple `kind:7375` events for the same mint, and multiple proofs inside each `kind:7375` event.
```jsonc
{
    "kind": 7375,
    "content": nip44_encrypt({
      "mint": "https://stablenut.umint.cash",
        "proofs": [
            {
                "id": "005c2502034d4f12",
                "amount": 1,
                "secret": "z+zyxAVLRqN9lEjxuNPSyRJzEstbl69Jc1vtimvtkPg=",
                "C": "0241d98a8197ef238a192d47edf191a9de78b657308937b4f7dd0aa53beae72c46"
            }
        ]
    }),
    "tags": [
        [ "a", "37375:<pubkey>:my-wallet" ]
    ]
}
```
 */
export const useCashuTokenSend = ():UseMutationResult<any, Error, any, any> => {
  const {ndk} = useNostrContext();
  const {publicKey, privateKey} = useAuth();

  return useMutation({
    mutationKey: ['sendCashuTokenSend', ndk],
    mutationFn: async (data: {
      content: string;
      mint?: string;
      proofs?: Proof[];
      relayUrl?: string;
      receiverPublicKeyProps?: string;
      tags?: string[][];
      isEncrypted?: boolean;
      encryptedMessage?: string;
    }) => {
      const {
        relayUrl,
        receiverPublicKeyProps,
        isEncrypted,
        tags,
        encryptedMessage,
        content,

        mint,
        proofs,
      } = data;

      // let receiverPublicKey = fixPubKey(stringToHex(receiverPublicKeyProps))
      const receiverPublicKey = receiverPublicKeyProps
        ? fixPubKey(receiverPublicKeyProps)
        : fixPubKey(publicKey);

      /** NIP-4 - Encrypted Direct private message  */

      const event = new NDKEvent(ndk);
      event.kind = NDKKind.CashuToken;
      event.created_at = new Date().getTime();
      event.content = data.content;

      const contentProps = {
        mint,
        proofs,
      };
      // nip44_encrypt({
      //   "mint": "https://stablenut.umint.cash",
      //     "proofs": [
      //         {
      //             "id": "005c2502034d4f12",
      //             "amount": 1,
      //             "secret": "z+zyxAVLRqN9lEjxuNPSyRJzEstbl69Jc1vtimvtkPg=",
      //             "C": "0241d98a8197ef238a192d47edf191a9de78b657308937b4f7dd0aa53beae72c46"
      //         }
      //     ]
      // })

      const conversationKey = deriveSharedKey(privateKey, receiverPublicKey);
      const nonce = generateRandomBytes();
      /** TODO verify NIP-44 */
      event.content = v2.encrypt(
        JSON.stringify(mint && proofs ? contentProps : content),
        conversationKey,
        nonce,
      );

      event.tags = data.tags ?? [];
      //   "tags": [
      // [ "a", "37375:<pubkey>:my-wallet" ]
      // ]

      const eventPublish = await event?.publish();
      return eventPublish;
    },
  });
};
