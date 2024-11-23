import {NDKEvent, NDKKind, NDKPrivateKeySigner, NDKUser} from '@nostr-dev-kit/ndk';
import {useInfiniteQuery, useMutation, useQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../context';
import {useAuth} from '../../store';

/**
 * NIP-61: https://nips.nostr.com/61
 * Nutzap Event: https://nips.nostr.com/61#nutzap-event
 */

// Type for mint configuration
type MintConfig = {
  url: string;
  units?: string[];
};

// Hook to set up NutZap receiving preferences
export const useSetNutZapPreferences = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationFn: async ({
      mints,
      relays,
      p2pkPubkey,
    }: {
      mints: MintConfig[];
      relays?: string[];
      p2pkPubkey?: string;
    }) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.CashuMintList;
      event.content = '';
      event.tags = [
        ...mints.map((mint) => {
          if (mint.units) {
            return ['mint', mint.url, ...mint.units];
          }
          return ['mint', mint.url];
        }),
        ...(relays ? relays.map((relay) => ['relay', relay]) : []),
        ...(p2pkPubkey ? [['pubkey', p2pkPubkey]] : []),
      ];

      return await event.publish();
    },
  });
};

// Hook to create a NutZap
export const useCreateNutZap = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationFn: async ({
      recipientPubkey,
      amount,
      unit,
      mintUrl,
      proofs,
      zappedEvent,
      comment,
    }: {
      recipientPubkey: string;
      amount: string;
      unit: string;
      mintUrl: string;
      proofs: Array<{
        amount: number;
        C: string;
        id: string;
        secret: string;
      }>;
      zappedEvent?: {id: string; relay?: string};
      comment?: string;
    }) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.Nutzap;
      event.content = comment || '';
      event.tags = [
        ['amount', amount],
        ['unit', unit],
        ['u', mintUrl],
        ['p', recipientPubkey],
        ...proofs.map((proof) => ['proof', JSON.stringify(proof)]),
        ...(zappedEvent ? [['e', zappedEvent.id, zappedEvent.relay || '']] : []),
      ];

      return await event.publish();
    },
  });
};

// Hook to fetch recipient's NutZap preferences
export const useGetRecipientNutZapInfo = (recipientPubkey?: string) => {
  const {ndk} = useNostrContext();

  return useQuery({
    queryKey: ['nutZapInfo', recipientPubkey],
    enabled: !!recipientPubkey,
    queryFn: async () => {
      const events = await ndk.fetchEvents({
        kinds: [NDKKind.CashuMintList],
        authors: [recipientPubkey],
        limit: 1,
      });

      const info = [...events][0];
      if (!info) throw new Error('No NutZap info found for recipient');

      return {
        mints: info.tags
          .filter((t) => t[0] === 'mint')
          .map((t) => ({
            url: t[1],
            units: t.slice(2),
          })),
        relays: info.tags.filter((t) => t[0] === 'relay').map((t) => t[1]),
        p2pkPubkey: info.tags.find((t) => t[0] === 'pubkey')?.[1] || recipientPubkey,
      };
    },
  });
};

// Hook to fetch received NutZaps
export const useGetReceivedNutZaps = (options?: {mints?: string[]; since?: number}) => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth();

  return useInfiniteQuery({
    queryKey: ['receivedNutZaps', publicKey, options?.mints, options?.since],
    enabled: !!publicKey,
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;
      const pageParam = lastPage[lastPage.length - 1].created_at - 1;
      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      const filter: any = {
        kinds: [NDKKind.Nutzap],
        '#p': [publicKey],
        until: pageParam || Math.round(Date.now() / 1000),
        limit: 20,
      };

      if (options?.mints?.length) {
        filter['#u'] = options.mints;
      }

      if (options?.since) {
        filter.since = options.since;
      }

      const zaps = await ndk.fetchEvents(filter);
      return [...zaps];
    },
  });
};

// Hook to record NutZap redemption
export const useRecordNutZapRedemption = () => {
  const {ndk} = useNostrContext();
  const {publicKey, privateKey} = useAuth();

  return useMutation({
    mutationFn: async ({
      walletId,
      amount,
      unit,
      nutZapEvent,
      newTokenEventId,
      senderPubkey,
    }: {
      walletId: string;
      amount: string;
      unit: string;
      nutZapEvent: {id: string; relay?: string};
      newTokenEventId: {id: string; relay?: string};
      senderPubkey: string;
    }) => {
      const signer = new NDKPrivateKeySigner(privateKey);
      const user = new NDKUser({pubkey: publicKey});
      const content = await signer.nip44Encrypt(
        user,
        JSON.stringify([
          ['direction', 'in'],
          ['amount', amount, unit],
          ['e', newTokenEventId.id, newTokenEventId.relay || '', 'created'],
        ]),
      );

      const event = new NDKEvent(ndk);

      event.kind = 7376;
      event.content = content;
      event.tags = [
        ['a', `37375:${walletId}`],
        ['e', nutZapEvent.id, nutZapEvent.relay || '', 'redeemed'],
        ['p', senderPubkey],
      ];

      return await event.publish();
    },
  });
};
