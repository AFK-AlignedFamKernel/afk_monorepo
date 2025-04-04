import { IconNames } from "src/components/Icon";

export enum SelectedTab {
  TIPS,
  MESSAGES,
  CHANNELS,
  NOTES,
  CREATE_NOTE,
  CREATE_CHANNEL,
  CREATE_TOKEN,
  CREATE_ARTICLE,
  DAO_OVERVIEW,
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
  SWAP_AVNU,
  TOKEN_STATS,
  USER_SHARE,
  DYNAMIC_GENERAL,
  GENERATE_INTERNAL_WALLET,
  BRIDGE_LAYERSWAP,
  STRIPE_SCREEN,
  ONRAMP_OFFRAMP,
  PAY_WALLET,
  WALLET_INTERNAL,
  AFK_ID,
  NAMESERVICE,
  CONTACTS = 'contacts',
  HOLDERS = 'HOLDERS',
  TX = 'TX',
  SHARES = 'SHARES',
  STATS = 'STATS',
  GRAPH = 'GRAPH',
  DYNAMIC_OWNED = 'DYNAMIC_OWNED',
  DYNAMIC_ALL = 'DYNAMIC_ALL',
  QUESTS = 'QUESTS',
  QUEST_FORM = 'QUEST_FORM',
  ALL_QUESTS = 'ALL_QUESTS',
  DAO_COMMUNITY = 'DAO_COMMUNITY',
}

export const TABS_TIP_LIST: { screen?: string; title: string; tab: SelectedTab }[] = [
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
    title: 'Article',
    screen: 'CreateArticle',
    tab: SelectedTab.CREATE_ARTICLE,
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

export const TABS_MENU: {
  screen?: string;
  title: string;
  description: string;
  tab: SelectedTab;
}[] = [
  {
    title: 'Pump',
    description: 'Launch your token to be trade and pumped',
    screen: 'Launchpad',
    tab: SelectedTab.LAUNCHPAD_VIEW,
  },
  {
    title: 'Pixel Peace',
    description: 'Pixel Game for communities',
    screen: 'PixelPeace',
    tab: SelectedTab.PIXEL_PEACE,
  },
  {
    title: 'Nameservice',
    description: 'AFK nameservice to mint your own name.afk',
    screen: 'AFK Nameservice',
    tab: SelectedTab.NAMESERVICE,
  },
  // {
  //   title: 'AFK ID',
  //   screen: 'AFK ID',
  //   tab: SelectedTab.AFK_ID,
  // },
  {
    title: 'Keys',
    description: 'Launch your own keys as a Starknet user linked to your profile',
    screen: 'KeysMarketplace',
    tab: SelectedTab.VIEW_KEYS_MARKETPLACE,
  },
  {
    title: 'Slink',
    description: 'Slink Description',
    screen: 'Slink',
    tab: SelectedTab.SLINK,
  },
  // {
  //   title: '?',
  //   description: '? Description',
  //   screen: '?',
  //   tab: SelectedTab.LAUNCH_TOKEN_UNRUGGABLE,
  // },
  // {
  //   title: '?!',
  //   description: '?! Description',
  //   screen: '?!',
  //   tab: SelectedTab.LAUNCH_TOKEN_PUMP,
  // },
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

export const TABS_DEFI: { screen?: string; title: string; tab: SelectedTab }[] = [
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
    title: 'Tips',
    screen: 'Tips',
    tab: SelectedTab.TIPS,
  },
  {
    title: 'BTC Fi',
    screen: 'BTCVault',
    tab: SelectedTab.BTC_FI_VAULT,
  },
  {
    title: 'Swap',
    screen: 'Swap',
    tab: SelectedTab.SWAP_AVNU,
  },

  {
    title: 'Bridge',
    screen: 'Bridge',
    tab: SelectedTab.BRIDGE_LAYERSWAP,
  },

  // {
  //   title: 'BTC Bridge',
  //   screen: 'BTCBridge',
  //   tab: SelectedTab.BTC_BRIDGE,
  // },
];

export const TABS_LAUNCH: { screen?: string; title: string; tab: SelectedTab }[] = [
  {
    title: 'Overview',
    screen: 'overview',
    tab: SelectedTab.LAUNCH_OVERVIEW,
  },
  // {
  //   title: 'Graph',
  //   screen: 'Graph',
  //   tab: SelectedTab.LAUNCH_GRAPH,
  // },
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

  {
    title: 'Shares',
    screen: 'Share',
    tab: SelectedTab.USER_SHARE,
  },
  // {
  //   title: 'STATS',
  //   screen: 'Stats',
  //   tab: SelectedTab.TOKEN_STATS,
  // },
  {
    title: 'GRAPH',
    screen: 'GRAPH',
    tab: SelectedTab.LAUNCH_GRAPH,
  },
];

export const TABS_CASHU: { screen?: string; title: string; tab: SelectedTab }[] = [
  // {
  //   title: 'General',
  //   screen: 'General',
  //   tab: SelectedTab.CASHU_WALLET,
  // },
  {
    title: 'Mints',
    screen: 'Mints',
    tab: SelectedTab.CASHU_MINT,
  },
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
    title: 'Contacts',
    screen: 'Contacts',
    tab: SelectedTab.CONTACTS,
  },
];

export const TABS_WALLET: { screen?: string; title: string; tab: SelectedTab }[] = [
  {
    title: 'Cashu',
    screen: 'Cashu',
    tab: SelectedTab.CASHU_WALLET,
  },
  // {
  //   title: 'Portfolio',
  //   screen: 'Portfolio',
  //   tab: SelectedTab.PORTFOLIO,
  // },

  {
    title: 'Tips',
    screen: 'Tips',
    tab: SelectedTab.TIPS,
  },

  {
    title: 'Swap',
    screen: 'Swap',
    tab: SelectedTab.SWAP_AVNU,
  },
  {
    title: 'Bridge',
    screen: 'Bridge',
    tab: SelectedTab.BRIDGE_LAYERSWAP,
  },
  {
    title: 'Ramp',
    screen: 'Ramp',
    tab: SelectedTab.ONRAMP_OFFRAMP,
  },
  // {
  //   title: 'BTC Fi',
  //   screen: 'BTCVault',
  //   tab: SelectedTab.BTC_FI_VAULT,
  // },
  // {
  //   title: 'Lightning',
  //   screen: 'Lightning',
  //   tab: SelectedTab.LIGHTNING_NETWORK_WALLET,
  // },
];

export const TABS_WALLET_BTC: { screen?: string; title: string; tab: SelectedTab }[] = [
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
];

export const TABS_ONBOARDING_WALLET: { screen?: string; title: string; tab: SelectedTab }[] = [
  {
    title: 'Dynamic',
    screen: 'Dynamic',
    tab: SelectedTab.DYNAMIC_GENERAL,
  },
  {
    title: 'Generate',
    screen: 'Generate',
    tab: SelectedTab.GENERATE_INTERNAL_WALLET,
  },
  {
    title: 'Portfolio',
    screen: 'Portfolio',
    tab: SelectedTab.PORTFOLIO,
  },
];

export const TABS_NAMESERVICE: { screen?: string; title: string; tab: SelectedTab }[] = [
  {
    title: 'Buy Name',
    screen: 'Buy',
    tab: SelectedTab.DYNAMIC_GENERAL,
  },
  {
    title: 'All Names',
    screen: 'All',
    tab: SelectedTab.DYNAMIC_ALL,
  },
  {
    title: 'Your Names',
    screen: 'Owned',
    tab: SelectedTab.DYNAMIC_OWNED,
  },
];

export const TABS_CONSOLE: { screen?: string; title: string; tab: SelectedTab }[] = [
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
    title: 'AFK Nameservice',
    screen: 'AFK Nameservice',
    tab: SelectedTab.NAMESERVICE,
  },
  // {
  //   title: 'AFK ID',
  //   screen: 'AFK ID',
  //   tab: SelectedTab.AFK_ID,
  // },
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

export const TABS_COMMUNITY: { screen?: string; title: string; tab: SelectedTab }[] = [
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
  //   title: 'Tips',
  //   screen: 'Tips',
  //   tab: SelectedTab.TIPS,
  // },
  // {
  //   title: 'Messages',
  //   screen: "ChannelsFeed",
  //   tab: SelectedTab.MESSAGES

  // },
];

export const CONSOLE_TABS_MENU: {
  screen?: string;
  title: string;
  description: string;
  tab: SelectedTab;
  insideRouting?: string;
  icon?: IconNames;
}[] = [
  {
    title: 'Pump',
    description: 'Launch your token to be trade and pumped',
    screen: 'Launchpad',
    tab: SelectedTab.LAUNCHPAD_VIEW,
    icon:"RocketIcon"
  },
  {
    title: 'Pixel Peace',
    description: 'Pixel Game for communities',
    // screen: 'PixelPeace',
    tab: SelectedTab.PIXEL_PEACE,
    icon:"PixelArtGameIcon"
  },
  {
    title: 'DAO Community',
    description: 'DAO Community for communities',
    // screen: 'PixelPeace',
    screen: 'DAO',
    insideRouting: 'MainStack',
    tab: SelectedTab.DAO_COMMUNITY,
    icon:"CommunityIcon"
  },
  // {
  //   title: 'Quests',
  //   description: 'Quests for communities',
  //   screen: 'Quests',
  //   tab: SelectedTab.QUESTS,
  // },
  {
    title: 'Nameservice',
    description: 'AFK nameservice to mint your own name.afk',
    // screen: 'AFK Nameservice',
    tab: SelectedTab.NAMESERVICE,
  },
  // {
  //   title: 'AFK ID',
  //   screen: 'AFK ID',
  //   tab: SelectedTab.AFK_ID,
  // },
  {
    title: 'Keys',
    description: 'Launch your own keys as a Starknet user linked to your profile',
    // screen: 'KeysMarketplace',
    tab: SelectedTab.VIEW_KEYS_MARKETPLACE,
    icon:"VIPSubscriptionIcon"
  },
  // {
  //   title: 'Slink',
  //   description: 'Slink Description',
  //   screen: 'Slink',
  //   tab: SelectedTab.SLINK,
  // },
  // {
  //   title: '?',
  //   description: '? Description',
  //   screen: '?',
  //   tab: SelectedTab.LAUNCH_TOKEN_UNRUGGABLE,
  // },
  // {
  //   title: '?!',
  //   description: '?! Description',
  //   screen: '?!',
  //   tab: SelectedTab.LAUNCH_TOKEN_PUMP,
  // },
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

export const TABS_QUESTS: { screen?: string; title: string; tab: SelectedTab }[] = [
  {
    title: 'Quest',
    screen: 'Quest',
    tab: SelectedTab.QUESTS,
  },
  {
    title: 'All Quests',
    screen: 'All',
    tab: SelectedTab.DYNAMIC_ALL,
  },
  {
    title: 'Your Quests',
    screen: 'Owned',
    tab: SelectedTab.DYNAMIC_OWNED,
  },
];

export const TABS_DAO: { screen?: string; title: string; tab: SelectedTab }[] = [
  {
    title: 'Overview',
    screen: 'DAO',
    tab: SelectedTab.DAO_OVERVIEW,
  },
];
