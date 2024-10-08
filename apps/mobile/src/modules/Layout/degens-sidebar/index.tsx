import {useAuth, useNostrContext} from 'afk_nostr_sdk';
import React, {useEffect, useMemo} from 'react';
import {Image, Pressable, Text, View} from 'react-native';

import {Icon} from '../../../components/Icon';
import {useStyles, useTheme, useWindowDimensions} from '../../../hooks';
import stylesheet from './styles';

interface SidebarInterface {
  // navigation:MainStackNavigationProps | DrawerNavigationHelpers
  navigation: any;
}
const DegensSidebar = ({navigation}: SidebarInterface) => {
  const styles = useStyles(stylesheet);
  const publicKey = useAuth((state) => state.publicKey);
  const ndk = useNostrContext();
  const handleNavigateProfile = () => {
    navigation.navigate('Profile', {publicKey});
  };

  const handleAuth = () => {
    navigation.navigate('Auth');
  };
  const theme = useTheme();
  // const handleNavigateHome = () => {
  //     navigation.navigate("Home");
  // };
  const handleDefiScreen = () => {
    navigation.navigate('Defi');
  };
  const handleGameScreen = () => {
    navigation.navigate('Games');
  };
  const handleHomeScreen = () => {
    navigation.navigate('Feed');
  };

  const handleTipsScreen = () => {
    navigation.navigate('Tips');
  };
  useEffect(() => {
    const unsubscribe = navigation.addListener('drawerClose', () => {
      // Code to handle drawer closing
    });

    return unsubscribe;
  }, [navigation]);

  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]); // Adjust based on your breakpoint for desktop

  // if(!isDesktop) {
  //   return;
  // }

  return (
    <View style={styles.sidebar}>
      <View style={styles.logoContainer}>
        <Image style={styles.logo} source={require('../../../assets/afkMascot.png')} />
        {/* <AFKIcon color={theme.colors.text} width={96} height={16} /> */}
      </View>
      <Text style={styles.sidebarText}>AFK</Text>

      <Pressable onPress={handleHomeScreen} style={styles.item}>
        <Icon name="HomeIcon" size={24} style={{backgroundColor: theme.theme.colors.background}} />
        <Text style={styles.textItem}>Feed</Text>
      </Pressable>

      <Pressable onPress={handleDefiScreen} style={styles.item}>
        <Icon name="CoinIcon" size={24} style={{backgroundColor: theme.theme.colors.background}} />
        <Text style={styles.textItem}>DeFi</Text>
      </Pressable>

      <Pressable onPress={handleTipsScreen} style={styles.item}>
        <Icon name="HomeIcon" size={24} style={{backgroundColor: theme.theme.colors.background}} />
        <Text style={styles.textItem}>Tips</Text>
      </Pressable>

      <Pressable onPress={handleGameScreen} style={styles.item}>
        <Icon name="GameIcon" size={24} style={{backgroundColor: theme.theme.colors.background}} />
        <Text style={styles.textItem}>LFG</Text>
      </Pressable>

      {/* <Pressable onPress={handleTipsScreen} style={styles.item}>
        <Icon name="CoinIcon" size={24} style={{ backgroundColor: theme.theme.colors.background }} />
        <Text style={styles.textItem}>Tips</Text>
      </Pressable> */}

      {publicKey && (
        <Pressable onPress={handleNavigateProfile} style={styles.item}>
          <Icon name="UserIcon" size={24} />
          <Text style={styles.textItem}>Profile</Text>
        </Pressable>
      )}

      {!publicKey && !ndk?.ndk?.signer && (
        <Pressable onPress={handleAuth} style={styles.item}>
          <Icon name="UserIcon" size={24} />
          <Text style={styles.textItem}>Login</Text>
        </Pressable>
      )}
    </View>
  );
};

export default DegensSidebar;
