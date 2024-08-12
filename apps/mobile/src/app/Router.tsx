import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { Icon } from '../components';
import { useStyles, useTheme } from '../hooks';
import { CreateAccount } from '../screens/Auth/CreateAccount';
import { ImportKeys } from '../screens/Auth/ImportKeys';
import { Login } from '../screens/Auth/Login';
import { SaveKeys } from '../screens/Auth/SaveKeys';
import { ChannelDetail } from '../screens/ChannelDetail';
import { ChannelsFeed } from '../screens/ChannelsFeed';
import { CreateChannel } from '../screens/CreateChannel';
import { CreateForm } from '../screens/CreateForm';
import { CreatePost } from '../screens/CreatePost';
import { EditProfile } from '../screens/EditProfile';
import { Feed } from '../screens/Feed';
import { PostDetail } from '../screens/PostDetail';
import { Profile } from '../screens/Profile';
import { Search } from '../screens/Search';
import { Tips } from '../screens/Tips';
// import { useAuth } from '../store/auth';
// import { useAuth } from '../store/auth';
import { ThemedStyleSheet } from '../styles';
import { AuthStackParams, HomeBottomStackParams, MainStackParams, RootStackParams } from '../types';
import { retrievePublicKey } from '../utils/storage';
import Sidebar from '../modules/Layout/sidebar';
import { Defi } from '../screens/Defi';
import { Games } from '../screens/Games';
import { useAuth } from 'afk_nostr_sdk';

const RootStack = createNativeStackNavigator<RootStackParams>();
const AuthStack = createNativeStackNavigator<AuthStackParams>();
const MainStack = createNativeStackNavigator<MainStackParams>();
const HomeBottomTabsStack = createBottomTabNavigator<HomeBottomStackParams>();

const HomeBottomTabNavigator: React.FC = () => {
  const styles = useStyles(stylesheet);

  const { publicKey } = useAuth();
  const { theme } = useTheme();

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
          tabBarIcon: ({ focused }) => (
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
          tabBarIcon: ({ focused }) => (
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
          tabBarIcon: ({ focused }) => (
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

      <HomeBottomTabsStack.Screen
        name="UserProfile"
        component={Profile as any}
        initialParams={{ publicKey }}
        options={{
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'grey',
          tabBarIcon: ({ focused }) => (
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
    </HomeBottomTabsStack.Navigator>
  );
};

const AuthNavigator: React.FC = () => {
  const [publicKey, setPublicKey] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    retrievePublicKey().then((key) => {
      setPublicKey(key);
    });
  });

  if (publicKey === undefined) return null;

  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      {publicKey && <AuthStack.Screen name="Login" component={Login} />}
      <AuthStack.Screen name="CreateAccount" component={CreateAccount} />
      <AuthStack.Screen name="SaveKeys" component={SaveKeys} />
      <AuthStack.Screen name="ImportKeys" component={ImportKeys} />
    </AuthStack.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}
    >
      <MainStack.Screen name="Home" component={HomeBottomTabNavigator} />
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
    </MainStack.Navigator>
  );
};

const linking = {
  prefixes: [
    // "home","search", "profile/:publicKey", "details/:id"
    /* your linking prefixes */
  ],
  config: {
    screens: {
      Home: 'home',
      Menu: 'menu',
      Search: 'search',
      Details: {
        path: 'profile/:publicKey',  // Example of a path with a parameter
        parse: {
          id: (id: any) => `${id}`,  // Convert the id from the URL to a string, if needed
        },
      },
      Profile: {
        path: 'details/:id',  // Example of a path with a parameter
        parse: {
          id: (id: any) => `${id}`,  // Convert the id from the URL to a string, if needed
        },
      },
    },

  },
};


const RootNavigator: React.FC = () => {
  const { publicKey } = useAuth();

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {publicKey ? (
        <RootStack.Screen name="MainStack" component={MainNavigator} />
      ) : (
        <RootStack.Screen name="AuthStack" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

export const Router: React.FC = () => {
  const isWeb = Platform.OS === 'web';
  const windowWidth = Dimensions.get('window').width;
  const shouldShowSidebar = isWeb && windowWidth >= 1024;
  return (
    <NavigationContainer
    // linking={linking}
    >
      {shouldShowSidebar && <Sidebar></Sidebar>}

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
    flexDirection: 'row'
  },
  content: {
    flex: 1,
    padding: 20
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
