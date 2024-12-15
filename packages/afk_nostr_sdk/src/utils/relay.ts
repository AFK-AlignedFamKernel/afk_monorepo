export const RELAYS_PROD = [
  'wss://relay.primal.net',
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://purplepag.es',
  'wss://relay.snort.social',
  'wss://nos.lol'
  // 'wss://relay.n057r.club', 'wss://relay.nostr.net',
];

export const RELAYS_TEST = [
  'wss://relay.damus.io',
  'wss://nos.lol'
];

// export const RELAYS_TEST = ['wss://relay.n057r.club', 'wss://relay.nostr.net'];

export const RELAY_AFK_PRODUCTION = 'wss://nostr-relay-nestjs-production.up.railway.app';

export const AFK_RELAYS =
  process.env.EXPO_NODE_ENV === 'production' ||
  process.env.EXPO_PUBLIC_NODE_ENV === 'production' ||
  process.env.NODE_ENV === 'production'
    ? [
        'wss://nostr-relay-nestjs-production.up.railway.app',
        ...RELAYS_PROD,
        'wss://nostr-relay-nestjs-production.up.railway.app',
      ]
    : [
        'wss://nostr-relay-nestjs-production.up.railway.app',
        ...RELAYS_TEST
      ];

      // export const AFK_RELAYS = [
//   'wss://nostr.joyboy.community',
//   // 'ws://localhost:3000', // comment if you don't run a relayer in localhost
// ];
