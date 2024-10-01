import {useAuth} from '../../store';
import {useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../context';
import NDK, {NDKEvent, NDKKind, NDKPrivateKeySigner} from '@nostr-dev-kit/ndk';
import {
  deriveSharedKey,
  fixPubKey,
  generateRandomBytes,
  generateRandomKeypair,
  randomTimeUpTo2DaysInThePast,
} from '../../utils/keypair';
import {v2} from '../../utils/nip44';
import {AFK_RELAYS} from '../../utils/relay';
import {Proof} from '@cashu/cashu-ts';

/**https://github.com/nostr-protocol/nips/blob/9f9ab83ee9809251d0466f22c188a0f13abd585a/60.md 
 * https://github.com/nostr-protocol/nips/pull/1369/files 

Spending History Event
Clients SHOULD publish kind:7376 events to create a transaction history when their balance changes.
{
    "kind": 7376,
    "content": nip44_encrypt([
        [ "direction", "in" ], // in = received, out = sent
        [ "amount", "1", "sats" ],
        [ "e", "<event-id-of-spent-token>", "<relay-hint>", "created" ],
    ]),
    "tags": [
        [ "a", "37375:<pubkey>:my-wallet" ],
    ]
}
 */
export const useCashuSpendingToken = () => {
  const {ndk} = useNostrContext();
  const {publicKey, privateKey} = useAuth();

  return useMutation({
    mutationKey: ['sendCashuSpendingToken', ndk],
    mutationFn: async (data: {
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
        //  receiverPublicKeyProps,
        content,
        direction,
        amount,
        unit,
        eventIdSpentToken,
        relayHint,
        walletName,
        isEncrypted,
        tags,
        encryptedMessage,
        relayUrl,
      } = data;

      let receiverPublicKey = fixPubKey(publicKey);

      /** NIP-4 - Encrypted Direct private message  */

      const event = new NDKEvent(ndk);
      event.kind = 7376;
      event.created_at = new Date().getTime();
      event.content = data.content;

      const contentProps = [
        ['direction', direction],
        ['amount', amount, unit ?? 'sats'],
        ['e', eventIdSpentToken, relayHint, 'created'],
      ];
      // [ "direction", "in" ], // in = received, out = sent
      // [ "amount", "1", "sats" ],
      // [ "e", "<event-id-of-spent-token>", "<relay-hint>", "created" ],

      let conversationKey = deriveSharedKey(privateKey, receiverPublicKey);
      let nonce = generateRandomBytes();
      /** TODO verify NIP-44 */
      event.content = v2.encrypt(
        JSON.stringify(amount && unit && direction ? contentProps : content),
        conversationKey,
        nonce,
      );

      event.tags = data.tags ?? [['a', `37375:${publicKey}:${walletName}`]];
      //   "tags": [
      // [ "a", "37375:<pubkey>:my-wallet" ]
      // ]

      const eventPublish = await event?.publish();
      return eventPublish;
    },
  });
};
