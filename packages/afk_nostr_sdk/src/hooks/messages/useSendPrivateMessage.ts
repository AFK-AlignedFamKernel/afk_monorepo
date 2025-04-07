import NDK, { NDKEvent, NDKPrivateKeySigner, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { useMutation } from '@tanstack/react-query';

import { useNostrContext } from '../../context/NostrContext';
import { useAuth, useSettingsStore } from '../../store';
import {
  deriveSharedKey,
  fixPubKey,
  generateRandomBytes,
  generateRandomKeypair,
  randomTimeUpTo2DaysInThePast,
} from '../../utils/keypair';
import { v2 } from '../../utils/nip44';
import { AFK_RELAYS } from '../../utils/relay';

// import {v2} from '../../utils/nip44';
// import {AFK_RELAYS} from '../../utils/relay';
// /** NIP-17 Private message: https://nips.nostr.com/17 */
export const useSendPrivateMessage = () => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();

  const { relays } = useSettingsStore();
  return useMutation({
    mutationKey: ['sendPrivateMessage', ndk],
    mutationFn: async (data: {
      content: string;
      relayUrl?: string;
      receiverPublicKeyProps?: string;
      tags?: string[][];
      isEncrypted?: boolean;
      encryptedMessage?: string;
      conversationTitle?: string;
    }) => {
      const senderName = (await getUser(ndk, publicKey))?.nip05 || 'AFK ANON';
      const receiverName = (await getUser(ndk, data.receiverPublicKeyProps))?.nip05 || 'AFK ANON';

      const { relayUrl, receiverPublicKeyProps, isEncrypted, tags, encryptedMessage, content } = data;

      console.log('receiverPublicKeyProps', receiverPublicKeyProps);
      // let receiverPublicKey = fixPubKey(stringToHex(receiverPublicKeyProps))
      const receiverPublicKey = fixPubKey(receiverPublicKeyProps);
      console.log('receiverPublicKey', receiverPublicKey);
      /** NIP-4 - Encrypted Direct private message  */

      const eventDirectMessage = new NDKEvent(ndk);
      eventDirectMessage.kind = 14;
      // eventDirectMessage.created_at = randomTimeUpTo2DaysInThePast().getTime()
      eventDirectMessage.created_at = new Date().getTime();
      eventDirectMessage.content = data.content;

      //   // ["p", "<receiver-1-pubkey>", "<relay-url>"],
      // ["p", "<receiver-2-pubkey>", "<relay-url>"],
      // ["e", "<kind-14-id>", "<relay-url>", "reply"] // if this is a reply
      // ["subject", "<conversation-title>"],
      eventDirectMessage.tags = data.tags ?? [
        // ["p", "<receiver-1-pubkey>", "<relay-url>"],
        ["p", receiverPublicKeyProps ?? '', relayUrl ?? ''],
        ["e", eventDirectMessage.id, relayUrl ?? '', "reply"], // if this is a reply
        ["subject", data.conversationTitle ?? ''],
      ];
      // console.log('eventDirectMessage', eventDirectMessage)

      // const eventDirectMessage = {
      //   kind: 14,
      //   created_at: new Date().getTime(),
      //   content: content,
      //   tags:tags,
      //   pubkey:publicKey
      // }
      // Generate random private key and conversion key
      const { publicKey: randomPublicKey, privateKey: randomPrivateKeyStr } = generateRandomKeypair();
      const conversationKey = deriveSharedKey(privateKey, receiverPublicKey);
      console.log('conversationKey', conversationKey);
      // Generate a random IV (initialization vector)
      const nonce = generateRandomBytes();
      /** Sealed event 13
       *
       * TO used in the Gift wrap content in a encrypted way
       */
      const eventSealed = new NDKEvent(ndk);
      // generate public key random
      eventSealed.pubkey = publicKey;
      eventSealed.kind = 13;
      // eventSealed.created_at = new Date().getTime()
      eventSealed.created_at = randomTimeUpTo2DaysInThePast().getTime();
      // const encryptedMessageSealed: string | undefined = v2.encrypt(
      //   JSON.stringify(data?.content),
      //   conversationKey,
      //   nonce,
      // );
      // Already encrypted
      // if (data?.isEncrypted && data?.encryptedMessage) {
      //   eventSealed.content = v2.encrypt(JSON.stringify(eventDirectMessage), conversationKey, nonce);
      // } else {
      //   eventSealed.content = v2.encrypt(JSON.stringify(eventDirectMessage), conversationKey, nonce);
      // }

      const encryptedEventToNostr = await eventDirectMessage.toNostrEvent();

      // eventSealed.content = v2.encrypt(JSON.stringify(eventDirectMessage), conversationKey, nonce);
      eventSealed.content = v2.encrypt(
        JSON.stringify(encryptedEventToNostr),
        conversationKey,
        // nonce,
      );

      await eventSealed.sign();
      // console.log('eventSealed', eventSealed)
      const sealedEvent = await eventSealed.toNostrEvent();
      // console.log('sealedEvent', sealedEvent)

      /** Fetch dm relay */
      // const eventsDMRelays = await ndk.fetchEvents({
      //   kinds: [10050 as number]
      // })

      // let tagsRelayDM = []
      // for (let e of eventsDMRelays.values()) {
      //   for (let t of e?.tags) {
      //     tagsRelayDM.push(t[1])
      //   }
      // }
      // console.log("tagsRelayDm")
      /** Gift Wrap*/

      const ndkRandomSigner = new NDKPrivateKeySigner(randomPrivateKeyStr);

      const ndkRandom = new NDK({
        explicitRelayUrls:
          // tagsRelayDM ??
          // relays ??
          AFK_RELAYS,
        signer: ndkRandomSigner,
      });

      console.log('AFK_RELAYS', AFK_RELAYS);
      // TODO generate public key random
      // Used random private
      // How to retrieve it easily as a sender?
      const eventGiftReceiver = new NDKEvent(ndk);
      eventGiftReceiver.pubkey = publicKey;
      // TODO Fix the random sender and the way to retrieve it

      // eventGift.pubkey = randomPublicKey;
      // let eventGift = new NDKEvent(ndkRandom);
      eventGiftReceiver.kind = 1059;
      eventGiftReceiver.created_at = new Date().getTime();
      /** Used encryption of the sealed event */
      // eventGift.content = v2.encrypt(JSON.stringify(sealedEvent), conversationKey, nonce);
      // eventGift.content = "gm";
      eventGiftReceiver.content = v2.encrypt(JSON.stringify(sealedEvent), conversationKey, nonce);
      eventGiftReceiver.tags = [
        ['p', receiverPublicKeyProps ?? '', relayUrl ?? ''],
        // ['sender', publicKey, senderName],
        ['receiverName', receiverName],
      ] as string[][];

      // await eventGift.sign()
      const eventPublishReceiver = await eventGiftReceiver?.publish();

      // TODO generate public key random
      // Used random private
      // How to retrieve it easily as a sender?
      const eventGiftSender = new NDKEvent(ndk);
      eventGiftSender.pubkey = publicKey;
      // TODO Fix the random sender and the way to retrieve it

      // eventGift.pubkey = randomPublicKey;
      // let eventGift = new NDKEvent(ndkRandom);
      eventGiftSender.kind = 1059;
      eventGiftSender.created_at = new Date().getTime();
      /** Used encryption of the sealed event */
      // eventGift.content = v2.encrypt(JSON.stringify(sealedEvent), conversationKey, nonce);
      // eventGift.content = "gm";
      eventGiftSender.content = v2.encrypt(JSON.stringify(sealedEvent), conversationKey, nonce);
      eventGiftSender.tags = [
        ['p', publicKey ?? '', relayUrl ?? ''],
        ['receiverName', receiverName],
      ] as string[][];

      // await eventGift.sign()
      const eventPublishSender = await eventGiftSender?.publish();
      return { eventPublishSender, eventPublishReceiver };
    },
  });
};

// // // Example usage with dummy keys
// // const authorPrivateKeyHexTest = 'a3c1fdecf205cc4f4d1f587fa1d487f2a6bda4c3dfd57313b04b5a6f30f5f543'; // Replace with actual private key
// // const recipientPublicKeyHex = '0297b8d3f5ac6f5b1b9b76e1785679a6d1225e129d2477318c81b1b0a64b9d1a55'; // Replace with actual public key
// // console.log("authorPrivateKeyHexTest", authorPrivateKeyHexTest)
// // console.log("recipientPublicKeyHex", recipientPublicKeyHex)
// // console.log("receiverPublicKey", receiverPublicKey)

// // // Buffer.from(testShared).toString('hex')

// // let testShared = deriveSharedKey(authorPrivateKeyHexTest, recipientPublicKeyHex)
// // console.log('Derived Shared Key:', Buffer.from(testShared).toString('hex'));

// // // let conversationKey = generateSharedSecret(privateKey, receiverPublicKey)
// // // let conversationKey = deriveSharedSecret(privateKey, receiverPublicKey)

// // let authorPrivateKeyHex = stringToHex(privateKey);
// // let recipientHexKey = stringToHex(privateKey);

async function getUser(ndk: any, pubKey: string): Promise<NDKUserProfile> {
  const user = await ndk.getUser({ pubkey: pubKey });
  return user.fetchProfile();
}
