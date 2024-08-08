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
import { useAuth } from '../../store/auth';
import { useNostrContext } from '../../context/NostrContext';
export const useCreateChannel = () => {
    const { ndk } = useNostrContext();
    const { publicKey } = useAuth();
    return useMutation({
        mutationKey: ['createChannel', ndk],
        mutationFn: (data) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            try {
                const user = ndk.getUser({ pubkey: publicKey });
                // if (!user.profile) {
                //   throw new Error('Profile not found');
                // }
                const event = new NDKEvent(ndk);
                event.kind = NDKKind.ChannelCreation;
                event.content = data.content;
                event.author = user;
                event.tags = (_a = data.tags) !== null && _a !== void 0 ? _a : [];
                yield event.publish();
                return event;
            }
            catch (error) {
                console.error('Error create channel', error);
                throw error;
            }
        }),
    });
};
