// Export all public APIs
export * from './src/context';
export * from './src/hooks';
export * from './src/store';
export * from './src/types';
export * from './src/utils';
export * from './src/storage';

// Re-export key dependencies
export { NDKEvent, NDKKind, NDKUser } from '@nostr-dev-kit/ndk';

// Constants
export { AFK_RELAYS } from './src/utils/relay';

// import { NostrContext } from "./context/NostrContext";
// import { TanstackProvider } from "./context/TanstackProvider";
// import * as hooks from "./hooks"
// import {NDKKind, NDKEvent, NDKUser} from "@nostr-dev-kit/ndk"
// import { AFK_RELAYS } from "./utils/relay";
// export default {hooks, NostrContext, TanstackProvider ,
//     NDKEvent, NDKKind, NDKUser,
//     AFK_RELAYS
// }
