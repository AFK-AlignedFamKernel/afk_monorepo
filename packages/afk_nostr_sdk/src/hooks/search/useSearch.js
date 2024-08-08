var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// useSearchUsers.ts
import { NDKKind } from '@nostr-dev-kit/ndk';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNostrContext } from '../../context/NostrContext';
export const useSearch = (options) => {
    const { ndk } = useNostrContext();
    return useInfiniteQuery({
        initialPageParam: 0,
        queryKey: ['search', options === null || options === void 0 ? void 0 : options.authors, options === null || options === void 0 ? void 0 : options.search, options === null || options === void 0 ? void 0 : options.kind, options === null || options === void 0 ? void 0 : options.kinds, ndk],
        getNextPageParam: (lastPage, allPages, lastPageParam) => {
            if (!(lastPage === null || lastPage === void 0 ? void 0 : lastPage.length))
                return undefined;
            const pageParam = lastPage[lastPage.length - 1].created_at - 1;
            if (!pageParam || pageParam === lastPageParam)
                return undefined;
            return pageParam;
        },
        queryFn: ({ pageParam }) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            console.log('search query', options === null || options === void 0 ? void 0 : options.search);
            const notes = yield ndk.fetchEvents({
                kinds: (_a = options === null || options === void 0 ? void 0 : options.kinds) !== null && _a !== void 0 ? _a : [(_b = options === null || options === void 0 ? void 0 : options.kind) !== null && _b !== void 0 ? _b : NDKKind.Text],
                authors: options === null || options === void 0 ? void 0 : options.authors,
                search: options === null || options === void 0 ? void 0 : options.search,
                // content: options?.search,
                until: pageParam || Math.round(Date.now() / 1000),
                limit: 20,
            });
            return [notes];
            // return [...notes].filter((note) => note.tags.every((tag) => tag[0] !== 'e'));
        }),
        placeholderData: { pages: [], pageParams: [] },
    });
};
export default useSearch;
