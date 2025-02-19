// Hooks
// Navigation Components
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from 'afk_nostr_sdk';
import { useEffect, useMemo, useRef } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
// Styles
import { StyleSheet } from 'react-native';

// import RightSidebar from '../modules/Layout/RightSideBar';
// Components
import { Icon } from '../components';
// import { retrievePublicKey } from '../utils/storage';
// Icons
import { IconNames } from '../components/Icon';
import { Navbar } from '../components/Navbar';
import { useStyles, useTheme } from '../hooks';
// Modules and Layout
import GroupChatDetail from '../modules/Group/groupDetail/GroupChatDetail';
import GroupChatGroupRequest from '../modules/Group/memberAction/ViewRequest';
import GroupChat from '../modules/Group/message/GroupMessage';
import AuthSidebar from '../modules/Layout/auth-sidebar';
import Sidebar from '../modules/Layout/sidebar';
import { SocialPaymentView } from '../modules/SocialPayment';
import { StudioModuleView } from '../modules/Studio';
import { SingleStreamModuleView } from '../modules/Studio/SingleStream';
import { ViewStreamModuleView } from '../modules/Studio/ViewStream';
// Screens

import { CreateAccount } from '../screens/Auth/nostr/CreateAccount';
import { ImportKeys } from '../screens/Auth/nostr/ImportKeys';
import { LoginNostr } from '../screens/Auth/nostr/LoginNostr';
import { SaveKeys } from '../screens/Auth/nostr/SaveKeys';
import { CashuScreen } from '../screens/Cashu';
import { ChannelDetail } from '../screens/ChannelDetail';
import { ChannelsFeed } from '../screens/ChannelsFeed';
import { CreateChannel } from '../screens/CreateChannel';
import { CreateForm } from '../screens/CreateForm';
import { CreatePost } from '../screens/CreatePost';
import { DappBrowserScreen } from '../screens/DappBrowser';
import { Defi } from '../screens/Defi';
import { EditProfile } from '../screens/EditProfile';
import { Feed } from '../screens/Feed';
import { Games } from '../screens/Games';
import { LaunchDetail } from '../screens/LaunchDetail';
import { LaunchpadScreen } from '../screens/Launchpad';
import { LightningNetworkScreen } from '../screens/Lightning';
import { NameserviceScreen } from '../screens/Nameservice';
import { ShortVideoNostrScreen } from '../screens/nostr/shorts';
import { OauthScreen } from '../screens/OauthTwitter';
import { Onboarding } from '../screens/Onboarding';
import { PostDetail } from '../screens/PostDetail';
import { Profile } from '../screens/Profile';
import { ReceiveEcash } from '../screens/ReceiveEcash';
import { Search } from '../screens/Search';
import { Settings } from '../screens/Settings';
import { TagsView } from '../screens/Tags';
import { Tips } from '../screens/Tips';
import { Wallet } from '../screens/Wallet';
import { WalletBTC } from '../screens/WalletBTC';
import { ThemedStyleSheet } from '../styles';
import { Community } from '../screens/Community';


// Utilities
import { AuthStackParams, HomeBottomStackParams, MainStackParams, RootStackParams } from '../types';
import { initGoogleAnalytics, logPageView } from '../utils/analytics';
import { ScreenRecordStream } from '../modules/Studio/ScreenRecord';
import { DAOScreen } from '../screens/DAO';

type TabBarIconProps = {
  focused: boolean;
  name: IconNames;
};

const TabBarIcon = ({ focused, name }: TabBarIconProps) => {
  const styles = useStyles(stylesheet);
  return (
    <View style={styles.tabBarIcon}>
      <Icon name={name} size={24} color={focused ? 'bottomBarActive' : 'bottomBarInactive'} />
      {focused && <Icon name="IndicatorIcon" color="primary" size={6} />}
    </View>
  );
};

// different Stack definitions here
const MainStack = createDrawerNavigator<MainStackParams>();
const RootStack = createNativeStackNavigator<RootStackParams>();
const AuthStack = createDrawerNavigator<AuthStackParams>();
const HomeBottomTabsStack = createBottomTabNavigator<HomeBottomStackParams>();

// Home Bottom Tab Navigator
const HomeBottomTabNavigator: React.FC = () => {
  const { publicKey } = useAuth();
  // const [publicKey, setPublicKey] = useState<string | null | undefined>(undefined);
  const styles = useStyles(stylesheet);
  const { theme } = useTheme();

  // useEffect(() => {
  //   retrievePublicKey().then((key) => {
  //     setPublicKey(key);
  //   });
  // }, []);

  return (
    <HomeBottomTabsStack.Navigator
      // initialRouteName='BottomBar'
      sceneContainerStyle={styles.sceneContainer}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <HomeBottomTabsStack.Screen
        name="Feed"
        component={Feed}
        options={{
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: theme.colors.background,
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="HomeIcon" />,
        }}
      />

      <HomeBottomTabsStack.Screen
        name="Community"
        component={Community}
        options={{
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'grey',

          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="CommunityIcon" />,

        }}
      />

      <HomeBottomTabsStack.Screen
        name="Games"
        component={Games as any}
        options={{
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'grey',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="GameIcon" />,
        }}
      />

      <HomeBottomTabsStack.Screen
        name="Wallet"
        component={Wallet}
        options={{
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: theme.colors.background,
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="WalletIcon" />,
        }}
      />

      {/* <HomeBottomTabsStack.Screen
        name="Defi"
        component={Defi}
        options={{
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: theme.colors.background,
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="WalletIcon" />,
        }}
      /> */}

      {publicKey ? (
        <HomeBottomTabsStack.Screen
          name="UserProfile"
          component={Profile as any}
          initialParams={{ publicKey }}
          options={{
            tabBarActiveTintColor: 'white',
            tabBarInactiveTintColor: 'grey',
            tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="UserIcon" />,
          }}
        />
      ) : (
        <HomeBottomTabsStack.Screen
          name="Login"
          component={LoginNostr as any}
          options={{
            tabBarActiveTintColor: 'white',
            tabBarInactiveTintColor: 'grey',
            tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="UserPlusIcon" />,
          }}
        />
      )}
    </HomeBottomTabsStack.Navigator>
  );
};

// Auth Navigator
const AuthNavigator: React.FC = () => {
  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]);

  const { publicKey } = useAuth();
  // const [publicKey, setPublicKey] = useState<string | null | undefined>(undefined);

  const theme = useTheme();

  // useEffect(() => {
  //   retrievePublicKey().then((key) => {
  //     setPublicKey(key);
  //   });
  // }, []);

  // if (publicKey === undefined) return null;

  return (
    <AuthStack.Navigator
      drawerContent={(props) => <AuthSidebar navigation={props?.navigation}></AuthSidebar>}
      screenOptions={({ navigation }) => ({
        header: () => <></>,
        //    header: () =>!isDesktop ? <Navbar navigation={navigation} title="AFK" showLogo={true} /> : null,
        headerShown: !isDesktop,
        headerStyle: {
          backgroundColor: theme.theme.colors.background,
        },
        drawerType: isDesktop ? 'permanent' : 'front',
        headerTintColor: theme.theme.colors.text,
        overlayColor: isDesktop ? 'transparent' : theme.theme.colors.background,
        drawerStyle: {
          width: '20%',
        },
      })}
    >
      {/* {publicKey ?
        <>
          <AuthStack.Screen name="CreateAccount" component={CreateAccount} />
          <AuthStack.Screen name="Login" component={Login} />
        </> :
        <>
          <AuthStack.Screen name="CreateAccount" component={CreateAccount} />
          <AuthStack.Screen name="Login" component={Login} />
        </>
      } */}
      <AuthStack.Screen name="Login" component={LoginNostr} />
      <AuthStack.Screen name="CreateAccount" component={CreateAccount} />
      <AuthStack.Screen name="SaveKeys" component={SaveKeys} />
      <AuthStack.Screen name="ImportKeys" component={ImportKeys} />
    </AuthStack.Navigator>
  );
};

// Main Navigator
const MainNavigator: React.FC = () => {
  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]);

  const theme = useTheme();

  const FeedWithSidebar: React.FC = () => (
    <View style={{ flexDirection: 'row', flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Feed navigation={useNavigation()} route={useRoute()} />
      </View>
      {/* {isDesktop && (
        <View style={{width: 300, backgroundColor: theme.theme.colors.surface}}>
          <RightSidebar />
        </View>
      )} */}
    </View>
  );

  return (
    <MainStack.Navigator
      initialRouteName="Home"
      // initialRouteName="Feed"
      drawerContent={(props) => <Sidebar navigation={props?.navigation}></Sidebar>}
      screenOptions={({ navigation }) => ({
        header: () =>
          !isDesktop ? <Navbar navigation={navigation} showLogo={true} /> : null,
        headerShown: !isDesktop,
        headerStyle: {
          backgroundColor: theme.theme.colors.background,
        },
        drawerType: isDesktop ? 'permanent' : 'front',
        headerTintColor: theme.theme.colors.text,
        overlayColor: theme.theme.colors.overlay70,
        drawerStyle: {
          width: isDesktop ? 350 : 300,
        },
      })}
    >
      {!isDesktop && <MainStack.Screen name="Home" component={HomeBottomTabNavigator} />}
      {/* <MainStack.Screen name="BottomBar" component={HomeBottomTabNavigator} /> */}
      <MainStack.Screen name="Feed" component={FeedWithSidebar} />

      {/* <MainStack.Screen name="Auth" component={AuthNavigator} /> */}
      {/* <MainStack.Screen name="Home" component={HomeBottomTabNavigator} /> */}

      {!isDesktop && <MainStack.Screen name="BottomBar" component={HomeBottomTabNavigator} />}

      <MainStack.Screen name="Profile" component={Profile} />
      <MainStack.Screen name="EditProfile" component={EditProfile} />
      <MainStack.Screen name="CreatePost" component={CreatePost} />
      <MainStack.Screen name="PostDetail" component={PostDetail} />
      <MainStack.Screen name="ChannelDetail" component={ChannelDetail} />
      <MainStack.Screen name="Search" component={Search} />
      <MainStack.Screen name="Tags" component={TagsView} />
      <MainStack.Screen name="CreateChannel" component={CreateChannel} />
      <MainStack.Screen name="ChannelsFeed" component={ChannelsFeed} />
      <MainStack.Screen name="CreateForm" component={CreateForm} />
      <MainStack.Screen name="Defi" component={Defi} />
      <MainStack.Screen name="Games" component={Games} />
      <MainStack.Screen name="GroupChat" component={GroupChat} />
      <MainStack.Screen name="GroupChatDetail" component={GroupChatDetail} />
      <MainStack.Screen name="GroupChatMemberRequest" component={GroupChatGroupRequest} />
      <MainStack.Screen name="Tips" component={Tips} />
      <MainStack.Screen name="Settings" component={Settings} />
      <MainStack.Screen name="LaunchDetail" component={LaunchDetail} />
      <MainStack.Screen name="Lightning" component={LightningNetworkScreen} />
      <MainStack.Screen name="Cashu" component={CashuScreen} />
      <MainStack.Screen name="WalletBTC" component={WalletBTC} />
      <MainStack.Screen name="StreamStudio" component={StudioModuleView} />
      <MainStack.Screen name="WatchStream" component={SingleStreamModuleView} />
      <MainStack.Screen name="ViewStreamGuest" component={ViewStreamModuleView} />
      <MainStack.Screen name="RecordedStream" component={ScreenRecordStream} />
      <MainStack.Screen name="SocialPayment" component={SocialPaymentView} />
      <MainStack.Screen name="Login" component={LoginNostr} />
      <MainStack.Screen name="CreateAccount" component={CreateAccount} />
      <MainStack.Screen name="SaveKeys" component={SaveKeys} />
      <MainStack.Screen name="ImportKeys" component={ImportKeys} />

      <MainStack.Screen name="Wallet" component={Wallet} />

      {/* <MainStack.Screen name="ShortVideos" component={Short} /> */}
      {/* <MainStack.Screen name="ShortVideos" component={ShortVideosModule} /> */}
      <MainStack.Screen name="ShortVideos" component={ShortVideoNostrScreen} />
      <MainStack.Screen name="Onboarding" component={Onboarding} />
      <MainStack.Screen name="DappBrowser" component={DappBrowserScreen} />
      <MainStack.Screen name="Oauth" component={OauthScreen} />
      <MainStack.Screen name="Launchpad" component={LaunchpadScreen} />
      <MainStack.Screen name="Nameservice" component={NameserviceScreen} />
      <MainStack.Screen name="ReceiveEcash" component={ReceiveEcash} />
      <MainStack.Screen name="Community" component={Community} />
      <MainStack.Screen name="DAO" component={DAOScreen} />

    </MainStack.Navigator>
  );
};

// Root Navigator
const RootNavigator: React.FC = () => {
  // const [publicKey, setPublicKey] = useState<string | null | undefined>(undefined);

  // useEffect(() => {
  //   retrievePublicKey().then((key) => {
  //     setPublicKey(key);
  //   });
  // }, []);

  const { publicKey } = useAuth();
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {/* {publicKey ? (
        <RootStack.Screen name="MainStack" component={MainNavigator} />
      ) : (
        <RootStack.Screen name="AuthStack" component={AuthNavigator} />
      )} */}
      {/* <RootStack.Screen name="AuthStack" component={AuthNavigator} /> */}
      <RootStack.Screen name="MainStack" component={MainNavigator} />
    </RootStack.Navigator>
  );
};

export const Router = () => {
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = useRef<string>();

  const GA_TRACKING_ID = process.env.EXPO_PUBLIC_GOOGLE_TAG_ID; // Replace with your Google Analytics Tracking ID

  useEffect(() => {
    if (Platform.OS === 'web' && GA_TRACKING_ID) {
      initGoogleAnalytics(GA_TRACKING_ID);
      logPageView(); // Log the initial page view

      const unsubscribe = navigationRef.addListener('state', () => {
        const currentRouteName = navigationRef.getCurrentRoute()?.name;
        if (currentRouteName !== routeNameRef.current) {
          routeNameRef.current = currentRouteName;
          logPageView(); // Log new page view on route change
        }
      });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [navigationRef]);
  return (
    <NavigationContainer linking={linking} ref={navigationRef}>
      <RootNavigator />
    </NavigationContainer>
  );
};

const linking = {
  prefixes: ['https://afk-community.xyz', 'afk://'],
  config: {
    screens: {
      MainStack: {
        screens: {
          Home: {
            screens: {
              Feed: 'feed',
              Games: 'games',
              Wallet: 'wallet',
              UserProfile: 'profile',
              Login: 'login',
              Community: 'community'
            }
          },
          Feed: 'app/feed',
          Profile: {
            path: 'app/profile/:publicKey',
            parse: {
              publicKey: (publicKey: string) => `${publicKey}`,
            },
          },
          EditProfile: 'app/edit-profile',
          CreatePost: 'app/create-post',
          PostDetail: {
            path: 'app/post/:postId',
            parse: {
              postId: (postId: string) => postId,
            },
          },
          ChannelDetail: {
            path: 'app/channel/:publicKey',
            parse: {
              publicKey: (publicKey: string) => `${publicKey}`,
            },
          },
          Search: 'app/search',
          Tags: 'app/tags',
          CreateChannel: 'app/create-channel',
          ChannelsFeed: 'app/channels',
          CreateForm: 'app/create-form',
          Defi: 'app/defi',
          Games: 'app/games',
          GroupChat: 'app/group-chat',
          GroupChatDetail: 'app/group-chat-detail',
          GroupChatMemberRequest: 'app/group-chat-request',
          Tips: 'app/tips',
          Settings: 'app/settings',
          LaunchDetail: {
            path: 'app/launch/:coinAddress',
            parse: {
              coinAddress: (coinAddress: string) => `${coinAddress}`,
            },
          },
          Lightning: 'app/lightning',
          Cashu: 'app/cashu',
          WalletBTC: 'app/wallet-btc',
          StreamStudio: 'app/studio',
          WatchStream: 'app/watch-stream',
          ViewStreamGuest: 'app/view-stream',
          SocialPayment: 'app/social-payment',
          Login: 'app/login',
          CreateAccount: 'app/create-account',
          SaveKeys: 'app/save-keys',
          ImportKeys: 'app/import-keys',
          Wallet: 'app/wallet',
          ShortVideos: 'app/shorts',
          Onboarding: 'app/onboarding',
          DappBrowser: 'app/browser',
          Oauth: 'app/oauth',
          Launchpad: 'app/launchpad',
          Nameservice: 'app/nameservice',
          ReceiveEcash: {
            path: 'app/receive/ecash/:token',
            parse: {
              token: (token: string) => `${token}`,
            },
          },
          Community: 'app/community',
          DAO: 'app/dao',
          // DAODetail: {
          //   path: 'app/dao/:daoId',
          //   parse: {
          //     daoId: (daoId: string) => `${daoId}`,
          //   },
          // },
        },
      },
    },
  },
};






const stylesheet = ThemedStyleSheet((theme) => ({
  sceneContainer: {
    backgroundColor: theme.colors.background,
  },
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabBarIcon: {
    flex: 1,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
}));
