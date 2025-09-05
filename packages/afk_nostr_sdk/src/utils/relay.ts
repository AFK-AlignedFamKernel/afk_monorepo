export const RELAYS_PROD = [
  'wss://relay.primal.net',
  // 'wss://relay.damus.io',
  'wss://nos.lol',
  // "wss://relay.nostr.band",
  // 'wss://news.utxo.one',
  // 'wss://news.utxo.one',
  
  // "wss://relay.snort.social",
  // 'wss://relay.snort.social',
  // 'wss://nos.lol'
  // 'wss://relay.n057r.club', 'wss://relay.nostr.net',
];

export const RELAYS_TEST = [
  'wss://nos.lol',
  // 'wss://relay.primal.net',
  // 'wss://relay.damus.io',
  // 'wss://relay.snort.social',
  'wss://relay.nostr.band',

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
      // ...RELAYS_PROD,

      // ...RELAYS_TEST,
      'wss://nostr-relay-nestjs-staging.up.railway.app',
      'wss://nostr-relay-nestjs-production.up.railway.app',
    ];