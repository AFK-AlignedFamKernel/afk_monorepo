import { NostrContext, NostrProvider, useNostrContext } from "./context/NostrContext";
import { TanstackProvider } from "./context/TanstackProvider";
import * as hooks from "./hooks"
import { NDKKind, NDKEvent, NDKUser } from "@nostr-dev-kit/ndk"
import { AFK_RELAYS } from "./utils/relay";

export default {
    hooks, NostrContext, 
    TanstackProvider,
    context: {
        NostrContext, NostrProvider, TanstackProvider,
        useNostrContext,
    },
    NDKEvent, NDKKind, NDKUser,
    AFK_RELAYS
};
// export default {
//     hooks, NostrContext, TanstackProvider,
//     context: {
//         NostrContext, NostrProvider, TanstackProvider,
//         useNostrContext,
//     },
//     NDKEvent, NDKKind, NDKUser,
//     AFK_RELAYS
// };