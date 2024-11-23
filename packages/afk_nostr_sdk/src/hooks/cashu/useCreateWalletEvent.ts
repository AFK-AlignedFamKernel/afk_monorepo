import {NDKEvent, NDKKind, NDKPrivateKeySigner, NDKUser} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../context';
import {useAuth} from '../../store';

/**
 * NIP-60: https://nips.nostr.com/60
 * Wallet Event: https://nips.nostr.com/60#wallet-event
 */

interface CreateWalletEventParams {
  name: string;
  description?: string;
  mints: string[];
  relays?: string[];
  balance?: string;
  privkey?: string;
  unit?: string;
}

export const useCreateWalletEvent = () => {
  const {ndk} = useNostrContext();
  const {publicKey, privateKey} = useAuth();

  return useMutation<NDKEvent, Error, CreateWalletEventParams>({
    mutationFn: async ({
      name,
      description,
      mints,
      relays,
      balance,
      privkey,
      unit = 'sat',
    }: {
      name: string;
      description?: string;
      mints: string[];
      relays?: string[];
      balance?: string;
      privkey?: string;
      unit?: string;
    }) => {
      const signer = new NDKPrivateKeySigner(privateKey);
      const user = new NDKUser({pubkey: publicKey});
      const content = await signer.nip44Encrypt(
        user,
        JSON.stringify([
          ['balance', balance || '0', unit],
          ['privkey', privkey || privateKey],
        ]),
      );

      const event = new NDKEvent(ndk);

      event.kind = NDKKind.CashuWallet;
      event.content = content;
      event.tags = [
        ['d', name.toLowerCase().replace(/\s+/g, '-')],
        ...mints.map((mint) => ['mint', mint]),
        ['name', name],
        ['unit', unit],
      ];

      if (description) event.tags.push(['description', description]);
      const eventRelays = relays?.length ? relays : ['wss://relay1', 'wss://relay2'];
      if (eventRelays.length) {
        relays.forEach((relay) => event.tags.push(['relay', relay]));
      }

      await event.sign(signer);

      await event.publish();
      return event;
    },
  });
};
