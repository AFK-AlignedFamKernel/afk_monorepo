import {NDKEvent, NDKNip07Signer, NDKUser} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../context';
import {useAuth} from '../../store';

/**
 * NIP-60: https://nips.nostr.com/60
 * Spending History Event: https://nips.nostr.com/60#spending-history-event
 */

export const useCreateSpendingEvent = () => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth();

  return useMutation({
    mutationFn: async ({
      walletId,
      direction,
      amount,
      unit,
      events,
    }: {
      walletId: string;
      direction: 'in' | 'out';
      amount: string;
      unit: string;
      events: Array<{
        id: string;
        relay?: string;
        marker: 'created' | 'destroyed' | 'redeemed';
      }>;
    }) => {
      const signer = new NDKNip07Signer();
      const user = new NDKUser({pubkey: publicKey});
      const content = await signer.nip44Encrypt(
        user,
        JSON.stringify([
          ['direction', direction],
          ['amount', amount, unit],
          ...events.map((event) => ['e', event.id, event.relay || '', event.marker]),
        ]),
      );

      const event = new NDKEvent(ndk);

      event.kind = 7376;
      event.content = content;
      event.tags = [['a', `37375:${publicKey}:${walletId}`]];

      return await event.publish();
    },
  });
};
