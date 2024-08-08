var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useMutation } from '@tanstack/react-query';
// import {useNostrContext} from '../../context/NostrContext';
// import {useAuth} from '../../store/auth';
// import {useNostrContext} from '../context/NostrContext';
import { useNostrContext } from '../context/NostrContext';
import { useAuth } from '../store/auth';
export const useEditProfile = () => {
    const { ndk } = useNostrContext();
    const { publicKey } = useAuth();
    return useMutation({
        mutationKey: ['editProfile', ndk],
        mutationFn: (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const user = ndk.getUser({ pubkey: publicKey });
                yield user.fetchProfile();
                if (!user.profile) {
                    throw new Error('Profile not found');
                }
                user.profile = Object.assign(Object.assign({}, user.profile), data);
                return user.publish();
            }
            catch (error) {
                console.error('Error editing profile', error);
                throw error;
            }
        }),
    });
};
