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
export const useReact = () => {
    const { ndk } = useNostrContext();
    return useMutation({
        mutationKey: ['react', ndk],
        mutationFn: (data) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const event = new NDKEvent(ndk);
            event.kind = NDKKind.Reaction;
            event.content = data.type === 'like' ? '+' : '-';
            event.tags = [
                ['e', data.event.id],
                ['p', data.event.pubkey],
                ['k', ((_a = data.event.kind) !== null && _a !== void 0 ? _a : 1).toString()],
            ];
            return event.publish();
        }),
    });
};
