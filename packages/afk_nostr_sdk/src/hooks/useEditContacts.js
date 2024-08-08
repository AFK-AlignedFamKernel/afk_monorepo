var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useMutation } from '@tanstack/react-query';
import { useNostrContext } from '../context/NostrContext';
import { useAuth } from '../store/auth';
export const useEditContacts = () => {
    const { ndk } = useNostrContext();
    const { publicKey } = useAuth();
    return useMutation({
        mutationKey: ['editContacts', ndk],
        mutationFn: (data) => __awaiter(void 0, void 0, void 0, function* () {
            let contacts = yield ndk.fetchEvent({
                kinds: [NDKKind.Contacts],
                authors: [publicKey],
            });
            if (!contacts) {
                contacts = new NDKEvent(ndk);
                contacts.kind = NDKKind.Contacts;
                contacts.content = '';
                contacts.tags = [];
            }
            // Resetting the id and created_at to avoid conflicts
            contacts.id = undefined;
            contacts.created_at = undefined;
            if (data.type === 'add') {
                contacts.tags.push(['p', data.pubkey, '', '']);
            }
            else {
                contacts.tags = contacts.tags.filter((tag) => tag[1] !== data.pubkey);
            }
            yield contacts.sign();
            return contacts.publish();
        }),
    });
};
