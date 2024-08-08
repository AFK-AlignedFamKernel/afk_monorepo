var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { NDKKind } from '@nostr-dev-kit/ndk';
import { useQuery } from '@tanstack/react-query';
import { useNostrContext } from '../context/NostrContext';
export const useContacts = (options) => {
    const { ndk } = useNostrContext();
    return useQuery({
        queryKey: ['contacts', options === null || options === void 0 ? void 0 : options.authors, options === null || options === void 0 ? void 0 : options.search, ndk],
        queryFn: () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const contacts = yield ndk.fetchEvent({
                kinds: [NDKKind.Contacts],
                authors: options === null || options === void 0 ? void 0 : options.authors,
                search: options === null || options === void 0 ? void 0 : options.search,
            });
            return (_a = contacts === null || contacts === void 0 ? void 0 : contacts.tags.filter((tag) => tag[0] === 'p').map((tag) => tag[1])) !== null && _a !== void 0 ? _a : [];
        }),
        placeholderData: [],
    });
};
