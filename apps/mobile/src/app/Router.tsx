// Hooks
import { useEffect, useMemo, useRef } from 'react';
import { useWindowDimensions, View, Platform } from 'react-native';
import { useStyles, useTheme } from '../hooks';

// Navigation Components
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Modules and Layout
import GroupChatDetail from '../modules/Group/groupDetail/GroupChatDetail';
import GroupChatGroupRequest from '../modules/Group/memberAction/ViewRequest';
import GroupChat from '../modules/Group/message/GroupMessage';
import AuthSidebar from '../modules/Layout/auth-sidebar';
import Sidebar from '../modules/Layout/sidebar';
// import RightSidebar from '../modules/Layout/RightSideBar';

// Components
import { Icon } from '../components';
import { Navbar } from '../components/Navbar';

// Screens
import { CreateAccount } from '../screens/Auth/nostr/CreateAccount';
import { ImportKeys } from '../screens/Auth/nostr/ImportKeys';
import { LoginNostr } from '../screens/Auth/nostr/LoginNostr';
import { SaveKeys } from '../screens/Auth/nostr/SaveKeys';
import { ChannelDetail } from '../screens/ChannelDetail';
import { ChannelsFeed } from '../screens/ChannelsFeed';
import { CreateChannel } from '../screens/CreateChannel';
import { CreateForm } from '../screens/CreateForm';
import { CreatePost } from '../screens/CreatePost';
import { Defi } from '../screens/Defi';
import { EditProfile } from '../screens/EditProfile';
import { Feed } from '../screens/Feed';
import { Games } from '../screens/Games';
import { LaunchDetail } from '../screens/LaunchDetail';
import { LightningNetworkScreen } from '../screens/Lightning';
import { PostDetail } from '../screens/PostDetail';
import { Profile } from '../screens/Profile';
import { Search } from '../screens/Search';
import { Settings } from '../screens/Settings';
import { Tips } from '../screens/Tips';
import { CashuScreen } from '../screens/Cashu';
import { WalletBTC } from '../screens/WalletBTC';
import { Wallet } from '../screens/Wallet';

// Styles
import { StyleSheet } from 'react-native';
import { ThemedStyleSheet } from '../styles';

// Utilities
import { AuthStackParams, HomeBottomStackParams, MainStackParams, RootStackParams } from '../types';
import { useNavigationContainerRef } from '@react-navigation/native';
// import { retrievePublicKey } from '../utils/storage';

// Icons
import { IconNames } from '../components/Icon';
import { useAuth } from 'afk_nostr_sdk';
import { Onboarding } from '../screens/Onboarding';
import { initGoogleAnalytics, logPageView } from '../utils/analytics';

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
  const { publicKey } = useAuth()
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
        name="Tips"
        component={Tips}
        options={{
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'grey',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="CoinIcon" />,
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
        name="Defi"
        component={Defi}
        options={{
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: theme.colors.background,
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="WalletIcon" />,
        }}
      />

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
          !isDesktop ? <Navbar navigation={navigation} title="AFK" showLogo={true} /> : null,
        headerShown: !isDesktop,
        headerStyle: {
          backgroundColor: theme.theme.colors.background,
        },
        drawerType: isDesktop ? 'permanent' : 'front',
        headerTintColor: theme.theme.colors.text,
        overlayColor: isDesktop ? 'transparent' : theme.theme.colors.background, // Make sure overlay settings are correct
        drawerStyle: {
          width: 250,
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

      <MainStack.Screen name="Login" component={LoginNostr} />
      <MainStack.Screen name="CreateAccount" component={CreateAccount} />
      <MainStack.Screen name="SaveKeys" component={SaveKeys} />
      <MainStack.Screen name="ImportKeys" component={ImportKeys} />

      <MainStack.Screen name="Wallet" component={Wallet} />
      <MainStack.Screen name="Onboarding" component={Onboarding} />
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
    <NavigationContainer linking={linking}
      ref={navigationRef}>
      <RootNavigator />
    </NavigationContainer>
  );
};

const linking = {
  prefixes: ['https://afk-community.xyz', 'afk://'],
  config: {
    screens: {
      // Home: {
      //   path: '',
      //   screens: {
      //     Login: 'login',
      //     CreateAccount: 'create-account',
      //     SaveKeys: 'save-keys',
      //     ImportKeys: 'import-keys',
      //     Home: 'home',
      //     Feed: 'feed',
      //     Profile: {
      //       path: 'profile/:publicKey',
      //       parse: {
      //         publicKey: (publicKey: any) => `${publicKey}`,
      //       },
      //     },
      //     EditProfile: 'edit-profile',
      //     CreatePost: 'create-post',
      //   },
      // },
      AuthStack: {
        path: 'auth',
        screens: {
          Login: 'login',
          CreateAccount: 'create-account',
          SaveKeys: 'save-keys',
          ImportKeys: 'import-keys',
        },
      },
      MainStack: {
        path: 'app',
        screens: {
          // AuthStack: {
          //   path: 'auth',
          //   screens: {
          //     Login: 'login',
          //     CreateAccount: 'create-account',
          //     SaveKeys: 'save-keys',
          //     ImportKeys: 'import-keys',
          //   },
          // },
          // BottomBar: {
          //   path: '',
          // },
          Login: 'login',
          Onboarding: "onboarding",
          CreateAccount: 'create-account',
          SaveKeys: 'save-keys',
          ImportKeys: 'import-keys',
          Home: 'home',
          Feed: 'feed',
          Profile: {
            path: 'profile/:publicKey',
            parse: {
              publicKey: (publicKey: any) => `${publicKey}`,
            },
          },
          EditProfile: 'edit-profile',
          CreatePost: 'create-post',
          PostDetail: {
            path: 'post/:id',
            parse: {
              id: (id: any) => `${id}`,
            },
          },
          ChannelDetail: {
            path: 'channel/:publicKey',
            parse: {
              publicKey: (publicKey: any) => `${publicKey}`,
            },
          },
          Search: 'search',
          CreateChannel: 'create-channel',
          ChannelsFeed: 'channels',
          CreateForm: 'create-form',
          Defi: 'defi',
          Games: 'games',
          Tips: 'tips',
          Settings: 'settings',
          LaunchDetail: {
            path: 'launch/:coinAddress',
            parse: {
              coinAddress: (coinAddress: any) => `${coinAddress}`,
            },
          },
          Lightning: 'lightning',
          Cashu: 'cashu',
          WalletBTC: 'wallet-btc',
          KeysMarketplace: 'keys-marketplace',
          Launchpad: 'launchpad',
          LaunchToken: 'launch-token',
          Wallet: 'wallet',
          Portfolio: 'portfolio',
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
