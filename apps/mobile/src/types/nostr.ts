export enum SORT_OPTION_EVENT_NOSTR {
  TIME = 'time',
  FOR_YOU = 'for_you',
  TRENDING = 'trending',
  INTERESTS = 'interests',
}

export const SORT_OPTIONS = [
  {label: 'Recent', value: SORT_OPTION_EVENT_NOSTR.TIME},
  {label: 'For You', value: SORT_OPTION_EVENT_NOSTR.FOR_YOU},
  // {label: 'Trending', value: SORT_OPTION_EVENT_NOSTR.TRENDING},
  // {label: 'Interests', value: SORT_OPTION_EVENT_NOSTR.INTERESTS},
];