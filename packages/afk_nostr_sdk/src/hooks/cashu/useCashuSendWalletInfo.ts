import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation, UseMutationResult} from '@tanstack/react-query';

import {useNostrContext} from '../../context';
import {useAuth} from '../../store';
import {
  deriveSharedKey,
  fixPubKey,
  generateRandomBytes,
  generateRandomKeypair,
} from '../../utils/keypair';
import {v2} from '../../utils/nip44';

/**https://github.com/nostr-protocol/nips/blob/9f9ab83ee9809251d0466f22c188a0f13abd585a/60.md 
/** 
 * https://github.com/nostr-protocol/nips/pull/1369/files */

/**
 * 
 * @returns {
    "kind": 37375,
    "content": nip44_encrypt([
        [ "balance", "100", "sat" ],
        [ "privkey", "hexkey" ] // explained in NIP-61
    ]),
    "tags": [
        [ "d", "my-wallet" ],
        [ "mint", "https://mint1" ],
        [ "mint", "https://mint2" ],
        [ "mint", "https://mint3" ],
        [ "name", "my shitposting wallet" ],
        [ "unit", "sat" ],
        [ "description", "a wallet for my day-to-day shitposting" ],
        [ "relay", "wss://relay1" ],
        [ "relay", "wss://relay2" ],
    ]
}
 */

export const useCreateCashuSendWalletInfo = ():UseMutationResult<any, Error, any, any> => {
  const {ndk, ndkCashuWallet, ndkWallet} = useNostrContext();
  const {publicKey, privateKey} = useAuth();

  return useMutation({
    mutationKey: ['createCashuWallet', ndk],
    mutationFn: async (data: {
      content: string;
      nameWallet: string;
      mint?: string;
      amount?: string;
      symbol?: string;
      relayUrl?: string;
      receiverPublicKeyProps?: string;
      tags?: string[][];
      isEncrypted?: boolean;
      encryptedMessage?: string;
    }) => {
      const {nameWallet, amount, symbol, mint} = data;

      const wallet = await ndkWallet.getCashuWallet(mint ?? 'https://mint1');
      // wallet.name = nameWallet;
      // wallet.relays = ['wss://relay1', 'wss://relay2'];

      // const eventPublish = await wallet.publish();
      return wallet;
      // return eventPublish;
    },
  });
};

export const useCashuSendWalletInfo = ():UseMutationResult<any, Error, any, any> => {
  const {ndk, ndkCashuWallet, ndkWallet} = useNostrContext();
  const {publicKey, privateKey} = useAuth();

  return useMutation({
    mutationKey: ['sendCashuWallet', ndk],
    mutationFn: async (data: {
      content: string;
      nameWallet: string;
      amount?: string;
      symbol?: string;
      relayUrl?: string;
      receiverPublicKeyProps?: string;
      tags?: string[][];
      isEncrypted?: boolean;
      encryptedMessage?: string;
      mint?: string;
    }) => {
      const {nameWallet, amount, symbol, mint} = data;

      const wallet = await ndkWallet.getCashuWallet(mint ?? 'https://mint1');
      // wallet.name = nameWallet;
      // wallet.relays = ['wss://relay1', 'wss://relay2'];

      // const eventPublish = await wallet?.publish();
      return wallet;
    },
  });
};

export const useCashuSendWalletInfoManual = () => {
  const {ndk} = useNostrContext();
  const {publicKey, privateKey} = useAuth();

  return useMutation({
    mutationKey: ['sendCashuWalletManual', ndk],
    mutationFn: async (data: {
      content: string;
      amount?: string;
      symbol?: string;
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

        amount,
        symbol,
      } = data;

      // let receiverPublicKey = fixPubKey(stringToHex(receiverPublicKeyProps))
      const receiverPublicKey = receiverPublicKeyProps
        ? fixPubKey(receiverPublicKeyProps)
        : fixPubKey(publicKey);

      /** NIP-4 - Encrypted Direct private message  */

      const event = new NDKEvent(ndk);
      event.kind = NDKKind.CashuWallet;
      event.created_at = new Date().getTime();
      event.content = data.content;

      const contentProps = [['balance', amount, symbol], []];

      /** This TAGS can be added in the content if needed */
      // [ "mint", "https://mint1" ],
      // [ "mint", "https://mint2" ],
      // [ "mint", "https://mint3" ],
      // [ "name", "my shitposting wallet" ],
      // [ "unit", "sat" ],
      // [ "description", "a wallet for my day-to-day shitposting" ],
      // [ "relay", "wss://relay1" ],
      // [ "relay", "wss://relay2" ],
      // [ "balance", "100", "sat" ],
      // [ "privkey", "hexkey" ]
      const {publicKey: randomPublicKey, privateKey: randomPrivateKeyStr} = generateRandomKeypair();
      const conversationKey = deriveSharedKey(privateKey, receiverPublicKey);
      // Generate a random IV (initialization vector)
      const nonce = await generateRandomBytes();

      /** TODO verify NIP-44 */
      event.content = v2.encrypt(
        JSON.stringify(amount && symbol ? contentProps : content),
        conversationKey,
        nonce,
      );

      event.tags = data.tags ?? [];
      //   "tags": [
      //     [ "d", "my-wallet" ],
      //     [ "mint", "https://mint1" ],
      //     [ "mint", "https://mint2" ],
      //     [ "mint", "https://mint3" ],
      //     [ "name", "my shitposting wallet" ],
      //     [ "unit", "sat" ],
      //     [ "description", "a wallet for my day-to-day shitposting" ],
      //     [ "relay", "wss://relay1" ],
      //     [ "relay", "wss://relay2" ],
      // ]
      // console.log('eventDirectMessage', eventDirectMessage)

      const eventPublish = await event?.publish();
      return eventPublish;
    },
  });
};
