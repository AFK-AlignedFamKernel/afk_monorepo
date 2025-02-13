export enum SORT_OPTION_EVENT_NOSTR {
  TIME,
  TRENDING,
  FOR_YOU,
  INTERESTS,
}

export const SORT_OPTIONS = [
  {label: 'Recent', value: SORT_OPTION_EVENT_NOSTR.TIME},
  {label: 'Trending', value: SORT_OPTION_EVENT_NOSTR.TRENDING},
  {label: 'For You', value: SORT_OPTION_EVENT_NOSTR.FOR_YOU},
  // {label: 'Interests', value: SORT_OPTION_EVENT_NOSTR.INTERESTS},
];