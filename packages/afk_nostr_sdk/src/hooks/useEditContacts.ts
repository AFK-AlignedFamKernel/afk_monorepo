import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../context/NostrContext';
import {useAuth} from '../store/auth';

export const useEditContacts = () => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth();

  return useMutation({
    mutationKey: ['editContacts', ndk],
    mutationFn: async (data: {pubkey: string; type: 'add' | 'remove'}) => {

      try {
        let contacts = await ndk.fetchEvent({
          kinds: [NDKKind.Contacts],
          authors: [publicKey],
        });

       console.log("ndk.signer", ndk.signer)
  
        console.log("contacts", contacts)
        if (!contacts) {
          contacts = new NDKEvent(ndk);
          contacts.kind = NDKKind.Contacts;
          contacts.content = '';
          contacts.tags = [];
        }
  
        const connectedRelays = ndk?.pool?.connectedRelays()
        console.log("connectedRelays", connectedRelays)
        if(connectedRelays.length === 0 ) {
          await ndk.connect(5000)
        }
  
        // Resetting the id and created_at to avoid conflicts
        contacts.id = undefined as any;
        contacts.created_at = undefined;
  
        console.log("contacts", contacts)
  
        // if (data.type === 'add') {
        //   contacts.tags.push(['p', data.pubkey, '', '']);
        // } else {
        //   contacts.tags = contacts.tags.filter((tag) => tag[1] !== data.pubkey);
        // }

        // Remove duplicates before adding new contact
        if (data.type === 'add') {
          const existingContact = contacts.tags.find((tag) => tag[1] === data.pubkey);
          if (!existingContact) {
            contacts.tags.push(['p', data.pubkey, '', '']);
          }
        } else {
          contacts.tags = contacts.tags.filter((tag) => tag[1] !== data.pubkey);
        }
        await contacts.sign();
  
        return contacts.publish();
      } catch (error) {
        console.log("error", error)
        return new Set()
      }

    },
  });
};
