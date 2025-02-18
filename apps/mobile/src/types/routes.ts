import { NDKEvent } from '@nostr-dev-kit/ndk';
import { DrawerNavigationProp, DrawerScreenProps } from '@react-navigation/drawer';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

import { TokenDeployInterface } from './keys';

export type RootStackParams = {
  MainStack: NavigatorScreenParams<MainStackParams>;
  DrawerStack: DrawerScreenProps<MainStackParams>;
  AuthStack: NavigatorScreenParams<AuthStackParams>;
  // DegensStack: NavigatorScreenParams<DegensAppStackParams>;
  // Home: NavigatorScreenParams<HomeBottomStackParams>;
};

export type AuthStackParams = {
  Login: undefined;
  CreateAccount: undefined;
  SaveKeys: {
    privateKey: string;
    publicKey: string;
  };
  ImportKeys: undefined;
  LoginNostr: undefined;
  Profile: {
    publicKey: string;
  };
  Community: undefined;
  RecordedStream: { streamId: string };

};

export type MainStackParams = {
  // Home: NavigatorScreenParams<HomeBottomStackParams>;
  BottomBar: undefined;
  CreatePost: undefined;
  Profile: { publicKey: string };
  PostDetail: { postId: string; post?: NDKEvent };
  GroupChat: { groupId: string; post?: NDKEvent; groupName: string; groupAccess: string };
  GroupChatDetail: { groupId: string; groupName: string; post?: NDKEvent; groupAccess: string };
  GroupChatMemberRequest: {
    groupId: string;
    groupName: string;
    post?: NDKEvent;
    groupAccess: string;
  };
  Tags: { tagName: string; post?: NDKEvent };
  EditProfile: undefined;
  Search: undefined;
  CreateChannel: undefined;
  ChannelsFeed: undefined;
  ChannelDetail: { postId: string; post?: NDKEvent };
  CreateForm: undefined;
  Defi: undefined;
  Games: undefined;
  KeysMarketplace: undefined;
  Slinks: undefined;
  Tips: undefined;
  Home: undefined;
  Feed: undefined;
  Settings: undefined;
  Launchpad: undefined;
  LaunchDetail: { coinAddress: string };
  Login: undefined;
  LoginNostr: undefined;
  CreateAccount: undefined;
  SaveKeys: {
    privateKey: string;
    publicKey: string;
  };
  ImportKeys: undefined;
  Auth: NavigatorScreenParams<AuthStackParams>;
  PrivateGroupDetails: { postId: string; post?: NDKEvent };
  Lightning: undefined;
  Cashu: undefined;
  Whatever: undefined;
  RightDrawer: undefined;
  WalletBTC: undefined;
  StreamStudio: undefined;
  WatchStream: { streamId: string };
  ViewStreamGuest: { streamId: string, recordingUrl?: string };
  Wallet: undefined;
  Portfolio: undefined;
  Ramp: undefined;
  Onboarding: undefined;
  DappBrowser: undefined;
  Oauth: undefined;
  ShortVideos: undefined;
  TokenDetail: { coinAddress: string };
  ReceiveEcash: { token: string };
  SocialPayment: undefined;
  TwitterCallback: { code: string };
  Nameservice: undefined;
  Console: undefined;
  Community: undefined;
  RecordedStream: { streamId: string, recordingUrl?: string };
};


export type HomeBottomStackParams = {
  Feed: undefined;
  UserProfile: { publicKey: string };
  Notifications: undefined;
  Tips: undefined;
  Search: undefined;
  Games: undefined;
  Wallet: undefined;
  Defi: undefined;
  Home: undefined;
  Settings: undefined;
  Profile: { publicKey: string };
  Launchpad: undefined;
  LaunchDetail: { coinAddress: string; launch?: TokenDeployInterface };
  Login: undefined;
  CreateAccount: undefined;
  SaveKeys: {
    privateKey: string;
    publicKey: string;
  };
  ImportKeys: undefined;
  Auth: NavigatorScreenParams<AuthStackParams>;
  Main: NavigatorScreenParams<MainStackParams>;
  PrivateGroupDetails: { postId: string; post?: NDKEvent };
  Lightning: undefined;
  Cashu: undefined;
  LoginNostr: undefined;
  DappBrowser: undefined;
  Oauth: undefined;
  ShortVideos: undefined;
  TokenDetail: { coinAddress: string };
  Nameservice: undefined;
  Console: undefined;
  Community: undefined;

  // CreateForm: undefined;
  // ChannelsFeed:undefined;
  // CreateChannel:undefined;
};

// Root Stack
export type RootStackNavigationProps = NativeStackNavigationProp<RootStackParams>;
export type RootStackScreenProps = NativeStackScreenProps<RootStackParams>;

// Auth
export type AuthLoginScreenProps = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParams | HomeBottomStackParams | MainStackParams, 'Login'>,
  NativeStackScreenProps<RootStackParams>
>;
export type AuthLoginNostrScreenProps = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParams | HomeBottomStackParams | MainStackParams, 'LoginNostr'>,
  NativeStackScreenProps<RootStackParams>
>;

export type AuthCreateAccountScreenProps = CompositeScreenProps<
  NativeStackScreenProps<
    AuthStackParams | HomeBottomStackParams | MainStackParams,
    'CreateAccount'
  >,
  NativeStackScreenProps<RootStackParams>
>;
export type AuthSaveKeysScreenProps = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParams | HomeBottomStackParams | MainStackParams, 'SaveKeys'>,
  NativeStackScreenProps<RootStackParams>
>;

export type AuthImportKeysScreenProps = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParams | HomeBottomStackParams | MainStackParams, 'ImportKeys'>,
  NativeStackScreenProps<RootStackParams>
>;

// Home Stack
export type HomeNavigationProp = NativeStackNavigationProp<HomeBottomStackParams>;

export type FeedScreenProps = CompositeScreenProps<
  NativeStackScreenProps<HomeBottomStackParams | MainStackParams, 'Feed'>,
  NativeStackScreenProps<RootStackParams>
>;
export type UserProfileScreenProps = CompositeScreenProps<
  NativeStackScreenProps<HomeBottomStackParams, 'UserProfile'>,
  NativeStackScreenProps<RootStackParams>
>;

export type NotificationsScreenProps = CompositeScreenProps<
  NativeStackScreenProps<HomeBottomStackParams, 'Notifications'>,
  NativeStackScreenProps<RootStackParams>
>;

export type TipsScreenProps = CompositeScreenProps<
  NativeStackScreenProps<HomeBottomStackParams | MainStackParams, 'Tips'>,
  NativeStackScreenProps<RootStackParams>
>;

export type SearchScreenProps = CompositeScreenProps<
  NativeStackScreenProps<HomeBottomStackParams, 'Search'>,
  NativeStackScreenProps<RootStackParams>
>;

// export type GamesScreenProps = CompositeScreenProps<
//   NativeStackScreenProps<HomeBottomStackParams, 'Games'>,
//   NativeStackScreenProps<RootStackParams>
// >;

// export type CreateChannelScreenProps = CompositeScreenProps<
//   NativeStackScreenProps<HomeBottomStackParams, 'CreateChannel'>,
//   NativeStackScreenProps<RootStackParams>
// >;

// export type ChannelsFeedScreenProps = CompositeScreenProps<
//   NativeStackScreenProps<HomeBottomStackParams, 'ChannelsFeed'>,
//   NativeStackScreenProps<RootStackParams>
// >;


// Main Stack
export type MainStackNavigationProps = NativeStackNavigationProp<MainStackParams>;

export type CreatePostScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'CreatePost'>,
  NativeStackScreenProps<RootStackParams>
>;

export type ProfileScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'Profile'>,
  NativeStackScreenProps<RootStackParams>
>;

export type TagsScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'Tags'>,
  NativeStackScreenProps<RootStackParams>
>;

export type PostDetailScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'PostDetail'>,
  NativeStackScreenProps<RootStackParams>
>;
export type GroupChatScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'GroupChat'>,
  NativeStackScreenProps<RootStackParams>
>;
export type GroupChatDetailScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'GroupChatDetail'>,
  NativeStackScreenProps<RootStackParams>
>;
export type GroupChatMemberRequestScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'GroupChatMemberRequest'>,
  NativeStackScreenProps<RootStackParams>
>;

export type ChannelDetailScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'ChannelDetail'>,
  NativeStackScreenProps<RootStackParams>
>;

export type EditProfileScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'EditProfile'>,
  NativeStackScreenProps<RootStackParams>
>;

export type CreateChannelScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'CreateChannel'>,
  NativeStackScreenProps<RootStackParams>
>;

export type ChannelsFeedScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'ChannelsFeed'>,
  NativeStackScreenProps<RootStackParams>
>;

export type CreateFormScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'CreateForm'>,
  NativeStackScreenProps<RootStackParams>
>;

export type DefiScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'Defi'>,
  NativeStackScreenProps<RootStackParams>
>;

export type GameSreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams | HomeBottomStackParams, 'Games'>,
  NativeStackScreenProps<RootStackParams>
>;

export type KeysMarketplaceSreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'KeysMarketplace'>,
  NativeStackScreenProps<RootStackParams>
>;

export type SlinkScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'Slinks'>,
  NativeStackScreenProps<RootStackParams>
>;

export type SettingsScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams | HomeBottomStackParams, 'Settings'>,
  NativeStackScreenProps<RootStackParams>
>;

export type LaunchpadScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams | HomeBottomStackParams, 'Launchpad'>,
  NativeStackScreenProps<RootStackParams>
>;

export type LaunchDetailScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams | HomeBottomStackParams, 'LaunchDetail'>,
  NativeStackScreenProps<RootStackParams>
>;

export type TokenDetailScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams | HomeBottomStackParams, 'TokenDetail'>,
  NativeStackScreenProps<RootStackParams>
>;

export type PrivateGroupScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams | HomeBottomStackParams, 'PrivateGroupDetails'>,
  NativeStackScreenProps<RootStackParams>
>;

export type LightningNetworkScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams | HomeBottomStackParams, 'Lightning'>,
  NativeStackScreenProps<RootStackParams>
>;

export type CashuWalletScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams | HomeBottomStackParams, 'Cashu'>,
  NativeStackScreenProps<RootStackParams>
>;

export type WalletScreenBTC = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'WalletBTC'>,
  NativeStackScreenProps<RootStackParams>
>;
// export type TipsMainScreenProps = CompositeScreenProps<
//   NativeStackScreenProps<MainStackParams, 'Tips'>,
//   NativeStackScreenProps<RootStackParams>
// >;

export type BottomBarProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'BottomBar'>,
  NativeStackScreenProps<RootStackParams>
>;

export type WalletScreen = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'Wallet'>,
  NativeStackScreenProps<RootStackParams>
>;

export type PortfolioScreen = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'Portfolio'>,
  NativeStackScreenProps<RootStackParams>
>;

export type Ramp = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'Ramp'>,
  NativeStackScreenProps<RootStackParams>
>;

export type OnboardingWalletScreen = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'Onboarding'>,
  NativeStackScreenProps<RootStackParams>
>;

export type OauthLoginProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams | HomeBottomStackParams, 'Oauth'>,
  NativeStackScreenProps<RootStackParams>
>;

export type ShortVideosScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams | HomeBottomStackParams, 'ShortVideos'>,
  NativeStackScreenProps<RootStackParams>
>;

export type ReceiveEcashScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'ReceiveEcash'>,
  NativeStackScreenProps<RootStackParams>
>;
// Drawer desktop stack

export type DappBrowserWalletScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams | HomeBottomStackParams, 'DappBrowser'>,
  NativeStackScreenProps<RootStackParams>
>;

// Stream Studio
export type StreamStudio = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'StreamStudio'>,
  NativeStackScreenProps<RootStackParams>
>;
export type WatchStream = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'WatchStream'>,
  NativeStackScreenProps<RootStackParams>
>;
export type ViewStreamGuest = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'ViewStreamGuest'>,
  NativeStackScreenProps<RootStackParams>
>;
export type NameserviceScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams | HomeBottomStackParams, 'Nameservice'>,
  NativeStackScreenProps<RootStackParams>
>;

export type RecordedStream = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'RecordedStream'>,
  NativeStackScreenProps<RootStackParams>
>;

// Social Payments
export type SocialPayment = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'SocialPayment'>,
  NativeStackScreenProps<RootStackParams>
>;

// Social Login
export type TwitterCallback = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams, 'TwitterCallback'>,
  NativeStackScreenProps<RootStackParams>
>;

export type ConsoleScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams | HomeBottomStackParams, 'Console'>,
  NativeStackScreenProps<RootStackParams>
>;

export type CommunityScreenProps = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParams | HomeBottomStackParams | MainStackParams, 'Community'>,
  NativeStackScreenProps<RootStackParams>
>;

export type DrawerStackNavigationProps = DrawerNavigationProp<MainStackParams>;

/** TODO delete */
export type DegensAppStackParams = {
  // Home: NavigatorScreenParams<HomeBottomStackParams>;
  Home: NavigatorScreenParams<DegensBottomStackParams>;

  CreatePost: undefined;
  Profile: { publicKey: string };
  CreateForm: undefined;
  Defi: undefined;
  Games: undefined;
  KeysMarketplace: undefined;
  Slinks: undefined;
  Tips: undefined;
  // Home: undefined;
  Feed: undefined;
  Lightning: undefined;
  Settings: undefined;
  Launchpad: undefined;
  LaunchDetail: { coinAddress: string; launch?: TokenDeployInterface };
  Login: undefined;
  CreateAccount: undefined;
  Auth: NavigatorScreenParams<AuthStackParams>;
  Cashu: undefined;

  SaveKeys: {
    privateKey: string;
    publicKey: string;
  };
};

export type DegensBottomStackParams = {
  // Feed: undefined;
  UserProfile: { publicKey: string };
  Notifications: undefined;
  Tips: undefined;
  Games: undefined;
  Defi: undefined;
  Home: undefined;
  Settings: undefined;
  Profile: { publicKey: string };
  Launchpad: undefined;
  LaunchDetail: { coinAddress: string; launch?: TokenDeployInterface };

  Login: undefined;
  CreateAccount: undefined;
  SaveKeys: {
    privateKey: string;
    publicKey: string;
  };
  ImportKeys: undefined;
  Lightning: undefined;
};
