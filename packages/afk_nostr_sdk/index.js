import { NostrContext } from "./src/context/NostrContext";
import { TanstackProvider } from "./src/context/TanstackProvider";
import * as hooks from "./src/hooks";
import { NDKKind, NDKEvent, NDKUser } from "@nostr-dev-kit/ndk";
import { AFK_RELAYS } from "./src/utils/relay";
export default { hooks, NostrContext, TanstackProvider,
    NDKEvent, NDKKind, NDKUser,
    AFK_RELAYS
};
