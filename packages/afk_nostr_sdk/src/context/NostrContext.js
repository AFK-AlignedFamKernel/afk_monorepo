import { jsx as _jsx } from "react/jsx-runtime";
import NDK, { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../store/auth';
import { AFK_RELAYS } from "../utils/relay";
export const NostrContext = createContext(null);
export const NostrProvider = ({ children }) => {
    const privateKey = useAuth((state) => state.privateKey);
    const [ndk, setNdk] = useState(new NDK({
        explicitRelayUrls: AFK_RELAYS,
    }));
    useEffect(() => {
        const newNdk = new NDK({
            explicitRelayUrls: AFK_RELAYS,
            signer: privateKey ? new NDKPrivateKeySigner(privateKey) : undefined,
        });
        newNdk.connect().then(() => {
            setNdk(newNdk);
        });
    }, [privateKey]);
    return _jsx(NostrContext.Provider, { value: { ndk }, children: children });
};
export const useNostrContext = () => {
    const nostr = useContext(NostrContext);
    if (!nostr) {
        throw new Error('NostrContext must be used within a NostrProvider');
    }
    return nostr;
};
