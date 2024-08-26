import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useMutation } from '@tanstack/react-query';

import { useNostrContext } from '../../context/NostrContext';
import { useAuth } from '../../store';
import { v2, generateRandomKeypair, transformStringToUint8Array, generateSharedSecret, generateRandomBytes, randomTimeUpTo2DaysInThePast } from "afk_utils"

/** NIP-17 Private message: https://nips.nostr.com/17 */
export const useSendPrivateMessage = () => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth()

  return useMutation({
    mutationKey: ['sendPrivateMessage', ndk],
    mutationFn: async (data: {
      content: string;
      relayUrl?:string,
      receiverPublicKey?: string,
      tags?: string[][], 
      isEncrypted?: boolean, 
      encryptedMessage?: string
    }) => {

      const {relayUrl , receiverPublicKey , isEncrypted, tags, encryptedMessage} = data
      /** NIP-14 - Direct private message  */

      const eventDirectMessage = new NDKEvent(ndk);
      eventDirectMessage.kind = 14;
      // eventDirectMessage.created_at = randomTimeUpTo2DaysInThePast().getTime()
      eventDirectMessage.created_at = new Date().getTime()
      eventDirectMessage.content = data.content;

      //   // ["p", "<receiver-1-pubkey>", "<relay-url>"],
      // ["p", "<receiver-2-pubkey>", "<relay-url>"],
      // ["e", "<kind-14-id>", "<relay-url>", "reply"] // if this is a reply
      // ["subject", "<conversation-title>"],
      eventDirectMessage.tags = data.tags ?? [];
      
      // Generate random private key and conversion key
      let { publicKey: randomPublicKey, privateKey: randomPrivateKeyStr } = generateRandomKeypair()
      let randomPrivateKey = transformStringToUint8Array(randomPrivateKeyStr);

      let conversationKey = generateSharedSecret(privateKey, receiverPublicKey)

      // Generate a random IV (initialization vector)
      let nonce = generateRandomBytes()
      /** Sealed event 13 
       * 
       * TO used in the Gift wrap content in a encrypted way
       */
      let eventSealed = new NDKEvent(ndk);
      // generate public key random
      eventSealed.pubkey = publicKey;
      eventSealed.kind = 13;
      // eventSealed.created_at = new Date().getTime()
      eventSealed.created_at = randomTimeUpTo2DaysInThePast().getTime()

      await eventSealed.sign()

      if (data?.isEncrypted && data?.encryptedMessage) {
        eventSealed.content = data?.encryptedMessage
        eventSealed.content = v2.encrypt(JSON.stringify(eventDirectMessage), conversationKey, nonce);
      }

      /** Gift Wrap*/
      let eventGift = new NDKEvent(ndk);
      // generate public key random
      eventGift.pubkey = randomPublicKey;

      eventGift.kind = 1059;
      eventGift.created_at = new Date().getTime()
      /** Used encryption of the sealed event */
      eventGift.content = v2.encrypt(JSON.stringify(eventSealed), conversationKey, nonce);

      eventGift.tags= [["p", receiverPublicKey, relayUrl]];

      return await eventGift?.publish()

    },
  });
};
