import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {useAuth, useSettingsStore} from '../../../store';
import {deriveSharedKey, generateRandomBytes, generateRandomKeypair} from '../../../utils/keypair';
import { v2 } from '../../../utils';
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
      subject?: string;
      receiverPublicKey?: string;
      tags?: string[][];
      isEncrypted?: boolean;
      encryptedMessage?: string;
    }) => {
      const {relayUrl, receiverPublicKey, isEncrypted, tags, content, subject} = data;
      /** NIP-4  */

      const eventDirectMessage = new NDKEvent(ndk);
      eventDirectMessage.kind = NDKKind.EncryptedDirectMessage;
      // eventDirectMessage.created_at = randomTimeUpTo2DaysInThePast().getTime()
      eventDirectMessage.created_at = new Date().getTime();

      const conversationKey = deriveSharedKey(privateKey, receiverPublicKey);
      const encryptedMessage = v2.encrypt(content, conversationKey);
      eventDirectMessage.content = encryptedMessage;

      const nonce = generateRandomBytes();
      

      eventDirectMessage.tags = [
        ["p", receiverPublicKey, relayUrl],
        ["e", "14", relayUrl, "reply"],
        ["subject", subject],
      ];
    },
  });
};
