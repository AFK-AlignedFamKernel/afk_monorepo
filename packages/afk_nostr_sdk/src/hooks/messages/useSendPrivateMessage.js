var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { useMutation } from '@tanstack/react-query';
import { useNostrContext } from '../../context/NostrContext';
export const useSendPrivateMessage = () => {
    const { ndk } = useNostrContext();
    return useMutation({
        mutationKey: ['sendPrivateMessage', ndk],
        mutationFn: (data) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const event = new NDKEvent(ndk);
            event.kind = 14;
            // const encryptedContent = nip44
            event.content = data.content;
            event.tags = (_a = data.tags) !== null && _a !== void 0 ? _a : [];
            return event.publish();
        }),
    });
};
