import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {NavigationContainer, useNavigation, useRoute} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from 'afk_nostr_sdk';
import {useEffect, useMemo, useState} from 'react';
import {Dimensions, Platform, StyleSheet, useWindowDimensions, View} from 'react-native';

import {Icon} from '../components';
import {Navbar} from '../components/Navbar';
import {useStyles, useTheme} from '../hooks';
import GroupChatDetail from '../modules/Group/groupDetail/GroupChatDetail';
import GroupChatGroupRequest from '../modules/Group/memberAction/ViewRequest';
import GroupChat from '../modules/Group/message/GroupMessage';
import AuthSidebar from '../modules/Layout/auth-sidebar';
import DegensSidebar from '../modules/Layout/degens-sidebar';
import Sidebar from '../modules/Layout/sidebar';
import {CreateAccount} from '../screens/Auth/CreateAccount';
import {ImportKeys} from '../screens/Auth/ImportKeys';
import {Login} from '../screens/Auth/Login';
import {SaveKeys} from '../screens/Auth/SaveKeys';
import {ChannelDetail} from '../screens/ChannelDetail';
import {ChannelsFeed} from '../screens/ChannelsFeed';
import {CreateChannel} from '../screens/CreateChannel';
import {CreateForm} from '../screens/CreateForm';
import {CreatePost} from '../screens/CreatePost';
import {Defi} from '../screens/Defi';
import {EditProfile} from '../screens/EditProfile';
import {Feed} from '../screens/Feed';
import {Games} from '../screens/Games';
import {LaunchDetail} from '../screens/LaunchDetail';
import {LightningNetworkScreen} from '../screens/Lightning';
import {PostDetail} from '../screens/PostDetail';
import {Profile} from '../screens/Profile';
import {Search} from '../screens/Search';
import {Settings} from '../screens/Settings';
import {Tips} from '../screens/Tips';
import {Whatever} from '../screens/Whatever';
import {ThemedStyleSheet} from '../styles';
import {
  AuthStackParams,
  DegensAppStackParams,
  DegensBottomStackParams,
  HomeBottomStackParams,
  MainStackParams,
  RootStackParams,
} from '../types';
import {retrievePublicKey} from '../utils/storage';
import RightSidebar from '../modules/Layout/RightSideBar';
const DrawerStack = createDrawerNavigator<MainStackParams>();
const RootStack = createNativeStackNavigator<RootStackParams>();
const AuthStack = createDrawerNavigator<AuthStackParams>();
// const AuthStack = createNativeStackNavigator<AuthStackParams>();
const MainStack = createNativeStackNavigator<MainStackParams>();
const HomeBottomTabsStack = createBottomTabNavigator<HomeBottomStackParams>();
const DegensBottomTabsStack = createBottomTabNavigator<DegensBottomStackParams>();

const DegensAppStack = createDrawerNavigator<DegensAppStackParams>();

const HomeBottomTabNavigator: React.FC = () => {
  const styles = useStyles(stylesheet);

  const {publicKey} = useAuth();
  const {theme} = useTheme();

  return (
    <HomeBottomTabsStack.Navigator
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
          tabBarIcon: ({focused}) => (
            <View style={styles.tabBarIcon}>
              <Icon
                name="HomeIcon"
                size={24}
                color={focused ? 'bottomBarActive' : 'bottomBarInactive'}
              />
              {focused && <Icon name="IndicatorIcon" color="primary" size={6} />}
            </View>
          ),
        }}
      />

      <HomeBottomTabsStack.Screen
        name="Tips"
        component={Tips}
        options={{
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'grey',
          tabBarIcon: ({focused}) => (
            <View style={styles.tabBarIcon}>
              <Icon
                name="CoinIcon"
                size={24}
                color={focused ? 'bottomBarActive' : 'bottomBarInactive'}
              />
              {focused && <Icon name="IndicatorIcon" color="primary" size={6} />}
            </View>
          ),
        }}
      />

      <HomeBottomTabsStack.Screen
        name="Games"
        component={Games as any}
        // initialParams={{ publicKey }}
        options={{
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'grey',
          tabBarIcon: ({focused}) => (
            <View style={styles.tabBarIcon}>
              <Icon
                name="GameIcon"
                size={24}
                color={focused ? 'bottomBarActive' : 'bottomBarInactive'}
              />
              {focused && <Icon name="IndicatorIcon" color="primary" size={6} />}
            </View>
          ),
        }}
      />

      {publicKey && (
        <HomeBottomTabsStack.Screen
          name="UserProfile"
          component={Profile as any}
          initialParams={{publicKey}}
          options={{
            tabBarActiveTintColor: 'white',
            tabBarInactiveTintColor: 'grey',
            tabBarIcon: ({focused}) => (
              <View style={styles.tabBarIcon}>
                <Icon
                  name="UserIcon"
                  size={24}
                  color={focused ? 'bottomBarActive' : 'bottomBarInactive'}
                />
                {focused && <Icon name="IndicatorIcon" color="primary" size={6} />}
              </View>
            ),
          }}
        />
      )}

      {!publicKey && (
        <HomeBottomTabsStack.Screen
          name="Login"
          component={Login as any}
          options={{
            tabBarActiveTintColor: 'white',
            tabBarInactiveTintColor: 'grey',
            tabBarIcon: ({focused}) => (
              <View style={styles.tabBarIcon}>
                <Icon
                  name="UserIcon"
                  size={24}
                  color={focused ? 'bottomBarActive' : 'bottomBarInactive'}
                />
                {focused && <Icon name="IndicatorIcon" color="primary" size={6} />}
              </View>
            ),
          }}
        />
      )}
    </HomeBottomTabsStack.Navigator>
  );
};

const AuthNavigator: React.FC = () => {
  const [publicKey, setPublicKey] = useState<string | null | undefined>(undefined);
  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]); // Adjust based on your breakpoint for desktop

  const theme = useTheme();

  useEffect(() => {
    retrievePublicKey().then((key) => {
      setPublicKey(key);
    });
  });

  if (publicKey === undefined) return null;

  return (
    <AuthStack.Navigator
      drawerContent={(props) => <AuthSidebar navigation={props?.navigation}></AuthSidebar>}
      screenOptions={({navigation}) => ({
        // headerShown:false,
        header: () => (!isDesktop ? <Navbar navigation={navigation} title="AFK" showLogo={true} /> : null),
        headerShown: !isDesktop,
        headerStyle: {
          backgroundColor: theme.theme.colors.background,
        },
        drawerType: isDesktop ? 'permanent' : 'front',
        // drawerType:"permanent",
        headerTintColor: theme.theme.colors.text,
        overlayColor: isDesktop ? 'transparent' : theme.theme.colors.background, // Make sure overlay settings are correct
        // swipeEdgeWidth: 0
        drawerStyle: {
          width: '20%', // Adjust width or other styling as necessary
        },
      })}
    >
      {publicKey && <AuthStack.Screen name="Login" component={Login} />}
      <AuthStack.Screen name="CreateAccount" component={CreateAccount} />
      <AuthStack.Screen name="SaveKeys" component={SaveKeys} />
      <AuthStack.Screen name="ImportKeys" component={ImportKeys} />
    </AuthStack.Navigator>
  );
};

const DrawerRightDesktop = createDrawerNavigator();

const RightDrawerNavigator = () => {
  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]); // Adjust based on your breakpoint for desktop

  const theme = useTheme();

  return (
    <DrawerRightDesktop.Navigator
      // initialRouteName="RightDrawer"
      drawerContent={(props) => <AuthSidebar navigation={props?.navigation}></AuthSidebar>}
      screenOptions={({navigation}) => ({
        // drawerPosition: "right",
        drawerType: isDesktop ? 'permanent' : 'front',
        // drawerType:"permanent",
        headerTintColor: theme.theme.colors.text,
        overlayColor: isDesktop ? 'transparent' : theme.theme.colors.background, // Make sure overlay settings are correct
        // swipeEdgeWidth: 0
        drawerStyle: {
          // maxWidth:270,
          // width: '15%', // Adjust width or other styling as necessary
          width: 250, // Adjust width or other styling as necessary
        },
      })}
    >
      <DrawerRightDesktop.Screen name="Whatever" component={Whatever} />
    </DrawerRightDesktop.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]); // Adjust based on your breakpoint for desktop

  const theme = useTheme();

  const FeedWithSidebar: React.FC = () => (
    <View style={{ flexDirection: 'row', flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Feed navigation={useNavigation()} route={useRoute()} />
      </View>
      <View style={{ width: 300, backgroundColor: theme.theme.colors.surface }}>
        <RightSidebar />
      </View>
    </View>
  );

  return (
    <DrawerStack.Navigator
      // screenOptions={{ headerShown: false }}
      // initialRouteName="Home"
      drawerContent={(props) => <Sidebar navigation={props?.navigation}></Sidebar>}
      screenOptions={({navigation}) => ({
        // headerShown:false,
        header: () => (!isDesktop ? <Navbar navigation={navigation} title="AFK" showLogo={true} /> : null),
        headerShown: !isDesktop,
        headerStyle: {
          backgroundColor: theme.theme.colors.background,
        },
        drawerType: isDesktop ? 'permanent' : 'front',
        // drawerType:"permanent",
        headerTintColor: theme.theme.colors.text,
        overlayColor: isDesktop ? 'transparent' : theme.theme.colors.background, // Make sure overlay settings are correct
        // swipeEdgeWidth: 0
        drawerStyle: {
          // maxWidth:270,
          // width: '15%', // Adjust width or other styling as necessary
          width: 250, // Adjust width or other styling as necessary
        },
      })}
    >

      {!isDesktop ? (
        <DrawerStack.Screen name="Home" component={HomeBottomTabNavigator} />
      ) : (
        <DrawerStack.Screen name="Feed" component={FeedWithSidebar} />
      )}
      {isDesktop && (
        <DrawerStack.Screen
          name="RightDrawer"
          component={RightDrawerNavigator}
        ></DrawerStack.Screen>
      )}

      <DrawerStack.Screen name="Profile" component={Profile} />
      <DrawerStack.Screen name="EditProfile" component={EditProfile} />
      <DrawerStack.Screen name="CreatePost" component={CreatePost} />
      <DrawerStack.Screen name="PostDetail" component={PostDetail} />
      <DrawerStack.Screen name="ChannelDetail" component={ChannelDetail} />
      <DrawerStack.Screen name="Search" component={Search} />
      <DrawerStack.Screen name="CreateChannel" component={CreateChannel} />
      <DrawerStack.Screen name="ChannelsFeed" component={ChannelsFeed} />
      <DrawerStack.Screen name="CreateForm" component={CreateForm} />
      <DrawerStack.Screen name="Defi" component={Defi} />
      <DrawerStack.Screen name="Games" component={Games} />
      <DrawerStack.Screen name="GroupChat" component={GroupChat} />
      <DrawerStack.Screen name="GroupChatDetail" component={GroupChatDetail} />
      <DrawerStack.Screen name="GroupChatMemberRequest" component={GroupChatGroupRequest} />

      <DrawerStack.Screen name="Tips" component={Tips} />
      <DrawerStack.Screen name="Settings" component={Settings} />
      <DrawerStack.Screen name="LaunchDetail" component={LaunchDetail} />
      <DrawerStack.Screen name="Auth" component={AuthNavigator} />
      <DrawerStack.Screen name="Login" component={Login} />
      <DrawerStack.Screen name="Lightning" component={LightningNetworkScreen} />
    </DrawerStack.Navigator>
  );
};

const DegensBottomTabNavigator: React.FC = () => {
  const styles = useStyles(stylesheet);

  const {publicKey} = useAuth();
  const {theme} = useTheme();

  return (
    <DegensBottomTabsStack.Navigator
      sceneContainerStyle={styles.sceneContainer}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <DegensBottomTabsStack.Screen
        name="Defi"
        component={Defi}
        options={{
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: theme.colors.background,
          tabBarIcon: ({focused}) => (
            <View style={styles.tabBarIcon}>
              <Icon
                name="MoonIcon"
                size={24}
                color={focused ? 'bottomBarActive' : 'bottomBarInactive'}
              />
              {focused && <Icon name="IndicatorIcon" color="primary" size={6} />}
            </View>
          ),
        }}
      />

      <DegensBottomTabsStack.Screen
        name="Tips"
        component={Tips}
        options={{
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'grey',
          tabBarIcon: ({focused}) => (
            <View style={styles.tabBarIcon}>
              <Icon
                name="CoinIcon"
                size={24}
                color={focused ? 'bottomBarActive' : 'bottomBarInactive'}
              />
              {focused && <Icon name="IndicatorIcon" color="primary" size={6} />}
            </View>
          ),
        }}
      />

      <DegensBottomTabsStack.Screen
        name="Games"
        component={Games as any}
        // initialParams={{ publicKey }}
        options={{
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'grey',
          tabBarIcon: ({focused}) => (
            <View style={styles.tabBarIcon}>
              <Icon
                name="GameIcon"
                size={24}
                color={focused ? 'bottomBarActive' : 'bottomBarInactive'}
              />
              {focused && <Icon name="IndicatorIcon" color="primary" size={6} />}
            </View>
          ),
        }}
      />

      {!publicKey && (
        <DegensBottomTabsStack.Screen
          name="Login"
          component={Login as any}
          options={{
            tabBarActiveTintColor: 'white',
            tabBarInactiveTintColor: 'grey',
            tabBarIcon: ({focused}) => (
              <View style={styles.tabBarIcon}>
                <Icon
                  name="UserIcon"
                  size={24}
                  color={focused ? 'bottomBarActive' : 'bottomBarInactive'}
                />
                {focused && <Icon name="IndicatorIcon" color="primary" size={6} />}
              </View>
            ),
          }}
        />
      )}
    </DegensBottomTabsStack.Navigator>
  );
};

const DegensAppNavigator: React.FC = () => {
  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]); // Adjust based on your breakpoint for desktop

  const theme = useTheme();

  return (
    <DegensAppStack.Navigator
      // screenOptions={{ headerShown: false }}
      // initialRouteName="Home"
      drawerContent={(props) => <DegensSidebar navigation={props?.navigation}></DegensSidebar>}
      screenOptions={({navigation}) => ({
        // headerShown:false,
        header: () => <Navbar navigation={navigation} title="AFK" showLogo={true} />,
        headerStyle: {
          backgroundColor: theme.theme.colors.background,
        },
        drawerType: isDesktop ? 'permanent' : 'front',
        // drawerType:"permanent",
        headerTintColor: theme.theme.colors.text,
        overlayColor: isDesktop ? 'transparent' : theme.theme.colors.background, // Make sure overlay settings are correct
        // swipeEdgeWidth: 0
        drawerStyle: {
          // maxWidth:270,
          // width: '15%', // Adjust width or other styling as necessary
          width: 250, // Adjust width or other styling as necessary
        },
      })}
    >
      {!isDesktop && <DegensAppStack.Screen name="Home" component={DegensBottomTabNavigator} />}
      <DegensAppStack.Screen name="Games" component={Games} />
      <DegensAppStack.Screen name="Defi" component={Defi} />
      <DegensAppStack.Screen name="Profile" component={Profile} />
      <DegensAppStack.Screen name="CreatePost" component={CreatePost} />
      <DegensAppStack.Screen name="CreateForm" component={CreateForm} />
      <DegensAppStack.Screen name="Tips" component={Tips} />
      <DegensAppStack.Screen name="Settings" component={Settings} />
      <DegensAppStack.Screen name="LaunchDetail" component={LaunchDetail} />
      {/* <DegensAppStack.Screen name="Auth" component={AuthNavigator} /> */}
      <DegensAppStack.Screen name="Login" component={Login} />
      <DegensAppStack.Screen name="Lightning" component={LightningNetworkScreen} />
    </DegensAppStack.Navigator>
  );
};
// const MainNavigator: React.FC = () => {
//   const dimensions = useWindowDimensions();
//   const isDesktop = dimensions.width >= 768; // Adjust based on your breakpoint for desktop
//   return (
//     <MainStack.Navigator screenOptions={{ headerShown: false }}
//     >
//       <MainStack.Screen name="Home" component={HomeBottomTabNavigator} />
//       <MainStack.Screen name="Profile" component={Profile} />
//       <MainStack.Screen name="EditProfile" component={EditProfile} />
//       <MainStack.Screen name="CreatePost" component={CreatePost} />
//       <MainStack.Screen name="PostDetail" component={PostDetail} />
//       <MainStack.Screen name="ChannelDetail" component={ChannelDetail} />
//       <MainStack.Screen name="Search" component={Search} />
//       <MainStack.Screen name="CreateChannel" component={CreateChannel} />
//       <MainStack.Screen name="ChannelsFeed" component={ChannelsFeed} />
//       <MainStack.Screen name="CreateForm" component={CreateForm} />
//       <MainStack.Screen name="Defi" component={Defi} />
//       <MainStack.Screen name="Games" component={Games} />
//     </MainStack.Navigator>
//   );
// };

const linking = {
  prefixes: [
    'home',
    'search',
    'profile/:publicKey',
    'details/:id',
    /* your linking prefixes */
  ],
  config: {
    screens: {
      Home: 'home',
      MainStack: 'app',
      DegensStack: 'degens',
      Menu: 'menu',
      Search: 'search',
      AuthStack: 'auth',
      Feed: 'feed',
      ImportKeys: 'import-keys',
      KeysMarketplace: 'keys-marketplace',
      CreateChannel: 'create-channel',
      CreateForm: 'create-form',
      EditProfile: 'edit-profile',
      Launchpad: 'launchpad',
      LaunchToken: 'launch-token',
      Games: 'games',
      Defi: 'defi',
      Settings: 'settings',
      Tips: 'Tips',
      ChannelDetail: {
        path: 'channel/:publicKey', // Example of a path with a parameter
        parse: {
          id: (id: any) => `${id}`, // Convert the id from the URL to a string, if needed
        },
      },
      Details: {
        path: 'profile/:publicKey', // Example of a path with a parameter
        parse: {
          id: (id: any) => `${id}`, // Convert the id from the URL to a string, if needed
        },
      },
      Profile: {
        path: 'profile/nostr/', // Example of a path with a parameter
        parse: {
          id: (id: any) => `${id}`, // Convert the id from the URL to a string, if needed
        },

        // path: 'details/:id', // Example of a path with a parameter
        // parse: {
        //   id: (id: any) => `${id}`, // Convert the id from the URL to a string, if needed
        // },
      },
    },
  },
};

const RootNavigator: React.FC = () => {
  const {publicKey} = useAuth();

  return (
    <RootStack.Navigator screenOptions={{headerShown: false}}>
      {/* <RootStack.Screen name="MainStack" component={MainNavigator} />
      <RootStack.Screen name="AuthStack" component={AuthNavigator} />
          <RootStack.Screen name="DegensStack" component={DegensAppNavigator} /> */}
      {publicKey ? (
        <RootStack.Screen name="MainStack" component={MainNavigator} />
      ) : (
        <>
          <RootStack.Screen name="AuthStack" component={AuthNavigator} />
          <RootStack.Screen name="DegensStack" component={DegensAppNavigator} />
        </>
      )}
    </RootStack.Navigator>
  );
};

export const Router: React.FC = () => {
  const isWeb = Platform.OS === 'web';
  const windowWidth = Dimensions.get('window').width;
  const shouldShowSidebar = isWeb && windowWidth >= 1024;
  return (
    <NavigationContainer linking={linking}>
      {/* {shouldShowSidebar && <Sidebar></Sidebar>} */}

      <RootNavigator />
    </NavigationContainer>
  );
};

const stylesheet = ThemedStyleSheet((theme) => ({
  sceneContainer: {
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    padding: 20,
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
