export const RELAYS_PROD = ['wss://relay.n057r.club', 'wss://relay.nostr.net'];

export const JOYBOY_RELAYS = [
  // 'wss://nostr.joyboy.community',
  'ws://nostr-relay-nestjs-production.up.railway.app',
  // 'ws://localhost:3000', // comment if you don't run a relayer in localhost
];

// export const AFK_RELAYS = [
//     // 'wss://nostr.joyboy.community',
//     'ws://nostr-relay-nestjs-production.up.railway.app',
//     // 'ws://localhost:3000', // comment if you don't run a relayer in localhost
// ]
export const AFK_RELAYS =
  process.env.EXPO_NODE_ENV == 'production' || process.env.NODE_ENV == 'production'
    ? [
        // 'wss://nostr.joyboy.community',
        'wss://nostr-relay-nestjs-production.up.railway.app',
        // 'ws://localhost:3000', // comment if you don't run a relayer in localhost
      ]
    : [
        // 'wss://nostr.joyboy.community',
        // 'ws://nostr-relay-nestjs-production.up.railway.app',
        'ws://localhost:8080', // comment if you don't run a relayer in localhost
      ];
