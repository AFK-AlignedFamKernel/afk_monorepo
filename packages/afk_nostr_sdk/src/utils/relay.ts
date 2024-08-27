export const RELAYS_PROD = [
  'wss://relay.n057r.club',
  'wss://relay.nostr.net',
  'wss://relay.primal.net',
  'wss://relay.nostr.band',
  'wss://purplepag.es',
];
export const RELAYS_TEST = ['wss://relay.n057r.club', 'wss://relay.nostr.net'];

export const RELAY_AFK_PRODUCTION = 'wss://nostr-relay-nestjs-production.up.railway.app';

export const AFK_RELAYS =
  process.env.EXPO_NODE_ENV == 'production' || process.env.NODE_ENV == 'production'
    ? [
      // 'wss://nostr.joyboy.community',
      'wss://nostr-relay-nestjs-production.up.railway.app',
      ...RELAYS_PROD,
      // 'ws://localhost:3000', // comment if you don't run a relayer in localhost
    ]
    : [
      // ...RELAYS_PROD,

      // 'wss://nostr.joyboy.community',
      // 'ws://nostr-relay-nestjs-production.up.railway.app',
      // 'wss://nostr-relay-nestjs-production.up.railway.app',
      'ws://localhost:8080', // comment if you don't run a relayer in localhost
      ...RELAYS_TEST,
    ];

// export const AFK_RELAYS = [
//   'wss://nostr.joyboy.community',
//   // 'ws://localhost:3000', // comment if you don't run a relayer in localhost
// ];
