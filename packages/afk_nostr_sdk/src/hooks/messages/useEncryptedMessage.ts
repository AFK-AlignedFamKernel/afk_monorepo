import NDK, {NDKEvent, NDKKind, NDKPrivateKeySigner} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../context/NostrContext';
import {useAuth, useSettingsStore} from '../../store';
import {
  generateRandomKeypair,
  transformStringToUint8Array,
  generateSharedSecret,
  generateRandomBytes,
  randomTimeUpTo2DaysInThePast,
  deriveSharedKey,
  stringToHex,
} from '../../utils/keypair';

import {v2} from '../../utils/nip44';
import {AFK_RELAYS} from '../../utils/relay';
/** NIP-4 Encrypted message: https://nips.nostr.com/4
 * Deprecated
 * Fix private message and user a relay that's enable it
 *
 */
export const useEncryptedMessage = () => {
  const {ndk} = useNostrContext();
  const {publicKey, privateKey} = useAuth();

  const {relays} = useSettingsStore();
  return useMutation({
    mutationKey: ['sendEncryptedMessage', ndk],
    mutationFn: async (data: {
      content: string;
      relayUrl?: string;
      receiverPublicKey?: string;
      tags?: string[][];
      isEncrypted?: boolean;
      encryptedMessage?: string;
    }) => {
      const {relayUrl, receiverPublicKey, isEncrypted, tags, encryptedMessage, content} = data;
      /** NIP-4  */

      const eventDirectMessage = new NDKEvent(ndk);
      eventDirectMessage.kind = NDKKind.EncryptedDirectMessage;
      // eventDirectMessage.created_at = randomTimeUpTo2DaysInThePast().getTime()
      eventDirectMessage.created_at = new Date().getTime();
      eventDirectMessage.content = data.content;

      //   // ["p", "<receiver-1-pubkey>", "<relay-url>"],
      // ["p", "<receiver-2-pubkey>", "<relay-url>"],
      // ["e", "<kind-14-id>", "<relay-url>", "reply"] // if this is a reply
      // ["subject", "<conversation-title>"],
      eventDirectMessage.tags = data.tags ?? [];
      let {publicKey: randomPublicKey, privateKey: randomPrivateKeyStr} = generateRandomKeypair();
      let conversationKey = deriveSharedKey(privateKey, receiverPublicKey);
      // Generate a random IV (initialization vector)
      let nonce = generateRandomBytes();
    },
  });
};
