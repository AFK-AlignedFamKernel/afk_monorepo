import {NDKEvent} from '@nostr-dev-kit/ndk';
import {DrawerNavigationProp, DrawerScreenProps} from '@react-navigation/drawer';
import {CompositeScreenProps, NavigatorScreenParams} from '@react-navigation/native';
import {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';

import {TokenLaunchInterface} from './keys';

export type RootStackParams = {
  MainStack: NavigatorScreenParams<MainStackParams>;
  DrawerStack: DrawerScreenProps<MainStackParams>;
  AuthStack: NavigatorScreenParams<AuthStackParams>;
  DegensStack: NavigatorScreenParams<DegensAppStackParams>;
};

export type AuthStackParams = {
  Login: undefined;
  CreateAccount: undefined;
  SaveKeys: {
    privateKey: string;
    publicKey: string;
  };
  ImportKeys: undefined;
};

export type MainStackParams = {
  // Home: NavigatorScreenParams<HomeBottomStackParams>;
  CreatePost: undefined;
  Profile: {publicKey: string};
  PostDetail: {postId: string; post?: NDKEvent};
  GroupChat: {groupId: string; post?: NDKEvent};
  GroupChatDetail: {groupId: string; post?: NDKEvent};
  EditProfile: undefined;
  Search: undefined;
  CreateChannel: undefined;
  ChannelsFeed: undefined;
  ChannelDetail: {postId: string; post?: NDKEvent};
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
  LaunchDetail: {coinAddress: string; launch?: TokenLaunchInterface};
  Login: undefined;
  CreateAccount: undefined;
  SaveKeys: {
    privateKey: string;
    publicKey: string;
  };
  ImportKeys: undefined;
  Auth: NavigatorScreenParams<AuthStackParams>;
  PrivateGroupDetails: {postId: string; post?: NDKEvent};
  Lightning: undefined;
};

export type DegensAppStackParams = {
  // Home: NavigatorScreenParams<HomeBottomStackParams>;
  Home: NavigatorScreenParams<DegensBottomStackParams>;

  CreatePost: undefined;
  Profile: {publicKey: string};
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
  LaunchDetail: {coinAddress: string; launch?: TokenLaunchInterface};
  Login: undefined;
  CreateAccount: undefined;
  Auth: NavigatorScreenParams<AuthStackParams>;

  SaveKeys: {
    privateKey: string;
    publicKey: string;
  };
};

export type DegensBottomStackParams = {
  // Feed: undefined;
  UserProfile: {publicKey: string};
  Notifications: undefined;
  Tips: undefined;
  Games: undefined;
  Defi: undefined;
  Home: undefined;
  Settings: undefined;
  Profile: {publicKey: string};
  Launchpad: undefined;
  LaunchDetail: {coinAddress: string; launch?: TokenLaunchInterface};

  Login: undefined;
  CreateAccount: undefined;
  SaveKeys: {
    privateKey: string;
    publicKey: string;
  };
  ImportKeys: undefined;
  Lightning: undefined;
};

export type HomeBottomStackParams = {
  Feed: undefined;
  UserProfile: {publicKey: string};
  Notifications: undefined;
  Tips: undefined;
  Search: undefined;
  Games: undefined;
  Defi: undefined;
  Home: undefined;
  Settings: undefined;
  Profile: {publicKey: string};
  Launchpad: undefined;
  LaunchDetail: {coinAddress: string; launch?: TokenLaunchInterface};
  Login: undefined;
  CreateAccount: undefined;
  SaveKeys: {
    privateKey: string;
    publicKey: string;
  };
  ImportKeys: undefined;
  Auth: NavigatorScreenParams<AuthStackParams>;
  Main: NavigatorScreenParams<MainStackParams>;
  PrivateGroupDetails: {postId: string; post?: NDKEvent};
  Lightning: undefined;
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
  NativeStackScreenProps<HomeBottomStackParams, 'Feed'>,
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

export type PrivateGroupScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams | HomeBottomStackParams, 'PrivateGroupDetails'>,
  NativeStackScreenProps<RootStackParams>
>;

export type LightningNetworkScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParams | HomeBottomStackParams, 'Lightning'>,
  NativeStackScreenProps<RootStackParams>
>;

// export type TipsMainScreenProps = CompositeScreenProps<
//   NativeStackScreenProps<MainStackParams, 'Tips'>,
//   NativeStackScreenProps<RootStackParams>
// >;

// Drawer desktop stack

export type DrawerStackNavigationProps = DrawerNavigationProp<MainStackParams>;
