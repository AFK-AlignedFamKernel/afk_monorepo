export const RELAYS_PROD = [
  'wss://relay.primal.net',
  // 'wss://relay.damus.io',
  'wss://nos.lol'
  // 'wss://relay.snort.social',
  // 'wss://nos.lol'
  // 'wss://relay.n057r.club', 'wss://relay.nostr.net',
];

export const RELAYS_TEST = [
  'wss://nos.lol'
];

// export const RELAYS_TEST = ['wss://relay.n057r.club', 'wss://relay.nostr.net'];

export const RELAY_AFK_PRODUCTION = 'wss://nostr-relay-nestjs-production.up.railway.app';

export const AFK_RELAYS =
  process.env.EXPO_NODE_ENV == 'production' ||
    process.env.EXPO_PUBLIC_NODE_ENV == 'production' ||
    process.env.NEXT_PUBLIC_NODE_ENV == 'production' ||
    process.env.NODE_ENV == 'production'
    ? [
      ...RELAYS_PROD,
      'wss://nostr-relay-nestjs-production.up.railway.app',
    ]
    : [
      // ...RELAYS_TEST,
      'wss://nostr-relay-nestjs-production.up.railway.app',
    ];
