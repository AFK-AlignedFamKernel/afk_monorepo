import {NDKEvent} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../context';
import {useAuth} from '../../store';
import {deriveSharedKey, fixPubKey, generateRandomBytes} from '../../utils/keypair';
import {v2} from '../../utils/nip44';

/**
 * You need to prepare the tags directly before calling it
 * 
 * https://github.com/nostr-protocol/nips/blob/master/61.md
Nutzap informational event
{
    "kind": 10019,
    "tags": [
        [ "relay", "wss://relay1" ],
        [ "relay", "wss://relay2" ],
        [ "mint", "https://mint1", "usd", "sat" ],
        [ "mint", "https://mint2", "sat" ],
        [ "pubkey", "<p2pk-pubkey>" ]
    ]
}
 */
export const useMintTrusted = () => {
  const {ndk} = useNostrContext();
  const {publicKey, privateKey} = useAuth();

  return useMutation({
    mutationKey: ['sendMintTrusted', ndk],
    mutationFn: async (data: {
      mintsUrls: string[];
      mintsInfo: string[];
      relayUrls: string[];
      content: string;
      walletName: string;
      direction?: string;
      amount?: string;
      unit?: string;
      eventIdSpentToken?: string;
      relayHint?: string;
      relayUrl?: string;
      receiverPublicKeyProps?: string;
      tags?: string[][];
      isEncrypted?: boolean;
      encryptedMessage?: string;
    }) => {
      const {
        relayUrl,
        mintsUrls,
        relayUrls,
      } = data;

      const event = new NDKEvent(ndk);
      event.kind = 10019;
      event.created_at = new Date().getTime();
      event.content = data.content;

      event.tags = data.tags;
      const eventPublish = await event?.publish();
      return eventPublish;
    },
  });
};
