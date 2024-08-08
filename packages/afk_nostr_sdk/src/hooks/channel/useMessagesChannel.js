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
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNostrContext } from '../../context/NostrContext';
export const useMessagesChannels = (options) => {
    const { ndk } = useNostrContext();
    return useInfiniteQuery({
        initialPageParam: 0,
        queryKey: ['messagesChannels', options === null || options === void 0 ? void 0 : options.noteId, options === null || options === void 0 ? void 0 : options.authors, options === null || options === void 0 ? void 0 : options.search, ndk],
        getNextPageParam: (lastPage, allPages, lastPageParam) => {
            if (!(lastPage === null || lastPage === void 0 ? void 0 : lastPage.length))
                return undefined;
            const pageParam = lastPage[lastPage.length - 1].created_at - 1;
            if (!pageParam || pageParam === lastPageParam)
                return undefined;
            return pageParam;
        },
        queryFn: ({ pageParam }) => __awaiter(void 0, void 0, void 0, function* () {
            const notes = yield ndk.fetchEvents({
                kinds: [NDKKind.ChannelMessage],
                authors: options === null || options === void 0 ? void 0 : options.authors,
                search: options === null || options === void 0 ? void 0 : options.search,
                until: pageParam || Math.round(Date.now() / 1000),
                limit: 20,
                '#e': (options === null || options === void 0 ? void 0 : options.noteId) ? [options.noteId] : undefined,
            });
            return [...notes].filter((note) => note.tags.every((tag) => tag[0] === 'e'));
        }),
        placeholderData: { pages: [], pageParams: [] },
    });
};
