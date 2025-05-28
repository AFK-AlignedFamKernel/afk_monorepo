import NDK, { NDKEvent, NDKPrivateKeySigner, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['sendPrivateMessage'],
    mutationFn: async (data: {
      content: string;
      receiverPublicKeyProps: string;
      relayUrl?: string;
      tags?: string[][];
    }) => {
      if (!privateKey || !publicKey) {
        throw new Error('Private key or public key not available');
      }

      const receiverPublicKey = fixPubKey(data.receiverPublicKeyProps);
      const conversationKey = deriveSharedKey(privateKey, receiverPublicKey);
      // 1. Create the direct message event (kind 14)
      const directMessage = new NDKEvent(ndk);
      directMessage.kind = 14;
      directMessage.created_at = randomTimeUpTo2DaysInThePast().getTime();
      directMessage.content = data.content;
      directMessage.tags = [
        ['p', receiverPublicKey],
        ['e', directMessage.id, data.relayUrl || '', 'reply'],
      ];

      // 2. Create the sealed event (kind 13)
      const sealedEvent = new NDKEvent(ndk);
      sealedEvent.kind = 13;
      sealedEvent.created_at = Math.floor(Date.now() / 1000);
      sealedEvent.content = v2.encrypt(
        JSON.stringify(await directMessage.toNostrEvent()),
        conversationKey
      );

      // 3. Create the gift wrap event (kind 1059)
      const { privateKey: randomPrivateKey } = generateRandomKeypair();
      const randomSigner = new NDKPrivateKeySigner(randomPrivateKey);

      const ndkRandom = new NDK({
        explicitRelayUrls: [...AFK_RELAYS],
        signer: new NDKPrivateKeySigner(randomPrivateKey),
      });
      await ndkRandom.connect();
      const giftWrap = new NDKEvent(ndkRandom);
      giftWrap.kind = 1059;
      giftWrap.created_at = Math.floor(Date.now() / 1000);
      giftWrap.content = v2.encrypt(
        JSON.stringify(await sealedEvent.toNostrEvent()),
        conversationKey
      );
      giftWrap.tags = [
        ['p', receiverPublicKey],
        ['receiverName', 'AFK ANON'], // You might want to fetch this from the user's profile
      ];

      // 4. Publish the gift wrap
      await giftWrap.publish();

      // 5. Publish the sender gif t xrap
      const { privateKey: randomPrivateKeySecond } = generateRandomKeypair();

      const ndkRandomSecond = new NDK({
        explicitRelayUrls: [...AFK_RELAYS],
        signer: new NDKPrivateKeySigner(randomPrivateKeySecond),
      });

      await ndkRandomSecond.connect();

      const senderGift = new NDKEvent(ndkRandomSecond);
      senderGift.kind = 1059;
      senderGift.created_at = Math.floor(Date.now() / 1000);
      senderGift.content = v2.encrypt(
        JSON.stringify(await sealedEvent.toNostrEvent()),
        conversationKey
      );
      senderGift.tags = [
        ['p', publicKey],
        ['senderName', 'AFK ANON'], // You might want to fetch this from the user's profile
      ];
      await senderGift.publish();

      // 4. Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['messageUsers'] });
      queryClient.invalidateQueries({ queryKey: ['myMessagesSent'] });


      return giftWrap;
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
