export enum SelectedTab {
  TIPS,
  MESSAGES,
  CHANNELS,
  NOTES,
  CREATE_NOTE,
  CREATE_CHANNEL,
  CREATE_TOKEN,
  LAUNCH_TOKEN,
  LAUNCH_TOKEN_UNRUGGABLE,
  VIEW_KEYS_MARKETPLACE,
  LAUNCH_TOKEN_PUMP,
  SLINK,
  LAUNCHPAD_VIEW


}

export const TABS_LIST: { screen?: string; title: string; tab: SelectedTab }[] = [
  {
    title: 'Tips',
    screen: 'Tips',
    tab: SelectedTab.TIPS,
  },
  {
    title: 'Channels',
    screen: 'ChannelsFeed',
    tab: SelectedTab.CHANNELS,
  },
  // {
  //   title: 'Messages',
  //   screen: "ChannelsFeed",
  //   tab: SelectedTab.MESSAGES

  // },
];

export const TABS_LIST_SEARCH: { screen?: string; title: string; tab: SelectedTab }[] = [
  {
    title: 'Notes',
    screen: 'Feed',
    tab: SelectedTab.NOTES,
  },
  {
    title: 'Tips',
    screen: 'Tips',
    tab: SelectedTab.TIPS,
  },
  {
    title: 'Channels',
    screen: 'ChannelsFeed',
    tab: SelectedTab.CHANNELS,
  },
  // {
  //   title: 'Messages',
  //   screen: "ChannelsFeed",
  //   tab: SelectedTab.MESSAGES

  // },
];

export const TABS_FORM_CREATE: { screen?: string; title: string; tab: SelectedTab }[] = [
  {
    title: 'Notes',
    screen: 'PostCreate',
    tab: SelectedTab.CREATE_NOTE,
  },
  {
    title: 'Channel',
    screen: 'CreateChannel',
    tab: SelectedTab.CREATE_CHANNEL,
  },
  {
    title: 'Token',
    screen: 'LaunchToken',
    tab: SelectedTab.LAUNCH_TOKEN,
  },

  // {
  //   title: 'Messages',
  //   screen: "ChannelsFeed",
  //   tab: SelectedTab.MESSAGES

  // },
];


export const TABS_MENU: { screen?: string; title: string; tab: SelectedTab }[] = [

  {
    title: 'Pump',
    screen: 'Launchpad',
    tab: SelectedTab.LAUNCHPAD_VIEW,
  },
  {
    title: 'Keys',
    screen: 'KeysMarketplace',
    tab: SelectedTab.VIEW_KEYS_MARKETPLACE,
  }, {
    title: 'Slink',
    screen: 'Slink',
    tab: SelectedTab.SLINK,
  },
  {
    title: '?',
    screen: '?',
    tab: SelectedTab.LAUNCH_TOKEN_UNRUGGABLE,
  },
  {
    title: '?!',
    screen: '?!',
    tab: SelectedTab.LAUNCH_TOKEN_PUMP,
  },
  // {
  //   title: 'Channel',
  //   screen: 'CreateChannel',
  //   tab: SelectedTab.CREATE_CHANNEL,
  // },
  // {
  //   title: 'Token',
  //   screen: 'LaunchToken',
  //   tab: SelectedTab.LAUNCH_TOKEN,
  // },
  // {
  //   title: 'Messages',
  //   screen: "ChannelsFeed",
  //   tab: SelectedTab.MESSAGES

  // },
];