import { NDKEvent, NDKPrivateKeySigner, NDKUser } from '@nostr-dev-kit/ndk';
import { useMutation } from '@tanstack/react-query';

import { useNostrContext } from '../../context';
import { useAuth } from '../../store';
import { EventMarker } from '../../types';


interface CreateSpendingEventParams {
  walletId: string;
  direction: 'in' | 'out';
  amount: string;
  unit: string;
  events: Array<{
    id: string;
    relay?: string;
    marker: EventMarker;
  }>;
  tags?: string[][];
  eventsIdRelations?: string[][];
}

export const useCreateSpendingEvent = () => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();

  return useMutation<NDKEvent, Error, CreateSpendingEventParams>({
    mutationFn: async ({
      walletId,
      direction,
      amount,
      unit,
      events,
      eventsIdRelations,
      tags,
    }: {
      walletId: string;
      direction: 'in' | 'out';
      amount: string;
      unit: string;
      events: Array<{
        id: string;
        relay?: string;
        marker: EventMarker;
      }>;
      eventsIdRelations?: string[][];
      tags?: string[][];
    }) => {

      try {

        console.log('createSpendingEvent');
        const signer = new NDKPrivateKeySigner(privateKey);
        const user = new NDKUser({ pubkey: publicKey });
        const content = await signer.encrypt(
          user,
          JSON.stringify([
            ['direction', direction],
            ['amount', amount, unit],
            ...events.map((event) => ['e', event.id, event.relay || '', event.marker]),
            ["e", `37375:${publicKey}:${walletId}`],
            // ...eventsIdRelations?.map((event) => ['e', event[0], event[1], event[2]])
  
          ]),
          "nip44"
        );
  
        const event = new NDKEvent(ndk);
  
        event.kind = 7376;
        event.content = content;
        event.tags = tags ?? [
          ["e", "<event-id-of-created-token>", "", "redeemed"], // TODO: add event id of created token
          // ['a', `37375:${publicKey}:${walletId}`],
          // ["e", `37375:${publicKey}:${walletId}`]
        ];
  
        await event.sign(signer);
  
        await event.publish();
        return event;        
      } catch (error) {
        console.log("useCreateSpendingEvent error",error)
        
      }

    },
  });
};
