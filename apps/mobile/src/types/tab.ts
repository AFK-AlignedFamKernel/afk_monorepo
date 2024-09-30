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
  LAUNCHPAD_VIEW,
  BTC_BRIDGE,
  BTC_FI_VAULT,
  LAUNCH_OVERVIEW,
  LAUNCH_GRAPH,
  LAUNCH_HOLDERS,
  LAUNCH_TX,
  LIGHTNING_NETWORK_WALLET,
  GROUP,
  ALL_GROUP,
  GROUP_MESSAGE,
  PIXEL_PEACE,
  CASHU_WALLET,
  CASHU_MINT,
  CASHU_PROOF,
  CASHU_TOKENS,
  CASHU_PAYMENT,
  CASHU_HISTORY,
  CASHU_INVOICES,
  CASHU_SETTINGS,
  PORTFOLIO,
  STARKNET_PORTFOLIO,
}

export const TABS_TIP_LIST: {screen?: string; title: string; tab: SelectedTab}[] = [
  {
    title: 'Tips',
    screen: 'Tips',
    tab: SelectedTab.TIPS,
  },
  {
    title: 'All Group',
    screen: 'AllGroup',
    tab: SelectedTab.ALL_GROUP,
  },
  {
    title: 'Channels',
    screen: 'ChannelsFeed',
    tab: SelectedTab.CHANNELS,
  },
  {
    title: 'Messages',
    screen: 'Messages',
    tab: SelectedTab.MESSAGES,
  },
  // {
  //   title: 'Messages',
  //   screen: "ChannelsFeed",
  //   tab: SelectedTab.MESSAGES

  // },
];

export const TABS_LIST: {screen?: string; title: string; tab: SelectedTab}[] = [
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

export const TABS_LIST_SEARCH: {screen?: string; title: string; tab: SelectedTab}[] = [
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

export const TABS_FORM_CREATE: {screen?: string; title: string; tab: SelectedTab}[] = [
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
  {
    title: 'Group',
    screen: 'Group',
    tab: SelectedTab.GROUP,
  },

  // {
  //   title: 'Messages',
  //   screen: "ChannelsFeed",
  //   tab: SelectedTab.MESSAGES

  // },
];

export const TABS_MENU: {screen?: string; title: string; tab: SelectedTab}[] = [
  {
    title: 'Pump',
    screen: 'Launchpad',
    tab: SelectedTab.LAUNCHPAD_VIEW,
  },
  {
    title: 'Pixel Peace',
    screen: 'PixelPeace',
    tab: SelectedTab.PIXEL_PEACE,
  },
  {
    title: 'Keys',
    screen: 'KeysMarketplace',
    tab: SelectedTab.VIEW_KEYS_MARKETPLACE,
  },
  {
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

export const TABS_DEFI: {screen?: string; title: string; tab: SelectedTab}[] = [
  {
    title: 'Cashu',
    screen: 'Cashu',
    tab: SelectedTab.CASHU_WALLET,
  },
  {
    title: 'Lightning',
    screen: 'Lightning',
    tab: SelectedTab.LIGHTNING_NETWORK_WALLET,
  },
  {
    title: 'BTC Fi',
    screen: 'BTCVault',
    tab: SelectedTab.BTC_FI_VAULT,
  },
  // {
  //   title: 'BTC Bridge',
  //   screen: 'BTCBridge',
  //   tab: SelectedTab.BTC_BRIDGE,
  // },
];

export const TABS_LAUNCH: {screen?: string; title: string; tab: SelectedTab}[] = [
  {
    title: 'Overview',
    screen: 'overview',
    tab: SelectedTab.LAUNCH_OVERVIEW,
  },
  {
    title: 'Graph',
    screen: 'Graph',
    tab: SelectedTab.LAUNCH_GRAPH,
  },
  {
    title: 'Holders',
    screen: 'Holders',
    tab: SelectedTab.LAUNCH_HOLDERS,
  },
  {
    title: 'TX',
    screen: 'TX',
    tab: SelectedTab.LAUNCH_TX,
  },
];

export const TABS_CASHU: {screen?: string; title: string; tab: SelectedTab}[] = [
  {
    title: 'Invoices',
    screen: 'Invoices',
    tab: SelectedTab.CASHU_INVOICES,
  },
  {
    title: 'History',
    screen: 'History',
    tab: SelectedTab.CASHU_HISTORY,
  },
  {
    title: 'Mints',
    screen: 'Mints',
    tab: SelectedTab.CASHU_MINT,
  },
  // {
  //   title: 'General',
  //   screen: 'General',
  //   tab: SelectedTab.CASHU_WALLET,
  // },
];

export const TABS_WALLET_BTC: {screen?: string; title: string; tab: SelectedTab}[] = [
  {
    title: 'Lightning',
    screen: 'Lightning',
    tab: SelectedTab.LIGHTNING_NETWORK_WALLET,
  },
  {
    title: 'Cashu',
    screen: 'Cashu',
    tab: SelectedTab.CASHU_WALLET,
  },
];

export const TABS_WALLET: {screen?: string; title: string; tab: SelectedTab}[] = [
  {
    title: 'Portfolio',
    screen: 'Portfolio',
    tab: SelectedTab.PORTFOLIO,
  },
  {
    title: 'Lightning',
    screen: 'Lightning',
    tab: SelectedTab.LIGHTNING_NETWORK_WALLET,
  },
  {
    title: 'Cashu',
    screen: 'Cashu',
    tab: SelectedTab.CASHU_WALLET,
  },
];
