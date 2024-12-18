// import { useAuth } from '../../../store/auth';
import {useAuth, useNostrContext} from 'afk_nostr_sdk';
import React, {useEffect, useMemo, useState} from 'react';
import {Image, Platform, Pressable, ScrollView, Text, View} from 'react-native';

import {Icon} from '../../../components/Icon';
import {useStyles, useTheme, useWindowDimensions} from '../../../hooks';
import stylesheet from './styles';

interface SidebarInterface {
  // navigation:MainStackNavigationProps | DrawerNavigationHelpers
  navigation: any;
}
const Sidebar = ({navigation}: SidebarInterface) => {
  const styles = useStyles(stylesheet);
  const publicKey = useAuth((state) => state.publicKey);
  const ndk = useNostrContext();
  // const navigation = useNavigation<MainStackNavigationProps>()
  // const navigation = useNavigation<DrawerStackNavigationProps>()
  const handleNavigateProfile = () => {
    navigation.navigate('Profile', {publicKey});
  };

  const handleAuth = () => {
    navigation.navigate('Login');
  };

  const handleWallet = () => {
    navigation.navigate('Wallet');
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
  const handleStudioScreen = () => {
    navigation.navigate('StreamStudio');
  };
  const handleSocialScreen = () => {
    navigation.navigate('SocialPayment');
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

  const [currentRouteKey, setCurrentRouteKey] = useState('');
  const [hoveredKey, setHoveredKey] = useState('');

  useEffect(() => {
    const key =
      navigation.getState().history[navigation.getState().history.length - (isDesktop ? 1 : 2)].key;
    setCurrentRouteKey(key);
  }, [navigation.getState().history]);

  return (
    <ScrollView
      style={[isDesktop ? styles.sidebarDesktop : styles.sidebarMobile]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[isDesktop ? styles.colContainer : styles.rowContainer]}>
        <Image
          style={[isDesktop ? styles.logoDesktop : styles.logoMobile]}
          source={require('./../../../assets/afk_logo_circle.svg')}
        />
        <Text style={[isDesktop ? styles.sidebarTextDesktop : styles.sidebarTextMobile]}>
          Aligned Fam
        </Text>
      </View>
      <View style={styles.sidebarItemsContainer}>
        {/* 
            <Text style={[isDesktop ? styles.itemDesktop : styles.itemMobile]}>
                Launchpad
            </Text>
            <Text style={[isDesktop ? styles.itemDesktop : styles.itemMobile,]}>
                Notifications
            </Text> */}
        {/* <Pressable style={[isDesktop ? styles.itemDesktop : styles.itemMobile]}
            // onPress={handleNavigateToPostDetails}
            >
            </Pressable> */}
        {/* <Pressable
                // onPress={handleNavigateHome}
                style={isDesktop ? styles.itemDesktop : styles.itemMobile}>
                <Text
                    style={[isDesktop ? styles.textItemDesktop : styles.textItemMobile]}
                >
                    Home
                </Text>

            </Pressable> */}

        <Pressable
          onPress={handleHomeScreen}
          onHoverIn={() => setHoveredKey('Feed')}
          onHoverOut={() => setHoveredKey('')}
          style={[
            isDesktop ? styles.itemDesktop : styles.itemMobile,
            currentRouteKey?.includes('Feed') || hoveredKey === 'Feed'
              ? styles.activeItem
              : styles.inactiveItem,
          ]}
        >
          <Icon name="HomeIcon" size={isDesktop ? 30 : 25} />
          <Text style={[isDesktop ? styles.textItemDesktop : styles.textItemMobile]}>Feed</Text>
        </Pressable>

        <Pressable
          onPress={handleTipsScreen}
          onHoverIn={() => setHoveredKey('Tips')}
          onHoverOut={() => setHoveredKey('')}
          style={[
            isDesktop ? styles.itemDesktop : styles.itemMobile,
            currentRouteKey?.includes('Tips') || hoveredKey === 'Tips'
              ? styles.activeItem
              : styles.inactiveItem,
          ]}
        >
          <Icon name="CoinIcon" size={isDesktop ? 30 : 25} />
          <Text style={[isDesktop ? styles.textItemDesktop : styles.textItemMobile]}>Tips</Text>
        </Pressable>

        <Pressable
          onPress={handleGameScreen}
          onHoverIn={() => setHoveredKey('Games')}
          onHoverOut={() => setHoveredKey('')}
          style={[
            isDesktop ? styles.itemDesktop : styles.itemMobile,
            currentRouteKey?.includes('Games') || hoveredKey === 'Games'
              ? styles.activeItem
              : styles.inactiveItem,
          ]}
        >
          <Icon name="GameIcon" size={isDesktop ? 30 : 25} />
          <Text style={[isDesktop ? styles.textItemDesktop : styles.textItemMobile]}>?</Text>
        </Pressable>

        <Pressable
          onPress={handleDefiScreen}
          onHoverIn={() => setHoveredKey('Defi')}
          onHoverOut={() => setHoveredKey('')}
          style={[
            isDesktop ? styles.itemDesktop : styles.itemMobile,
            currentRouteKey?.includes('Defi') || hoveredKey === 'Defi'
              ? styles.activeItem
              : styles.inactiveItem,
          ]}
        >
          <Icon name="CoinIcon" size={isDesktop ? 30 : 25} />
          <Text style={[isDesktop ? styles.textItemDesktop : styles.textItemMobile]}>DeFi</Text>
        </Pressable>

        <Pressable
          onPress={handleWallet}
          onHoverIn={() => setHoveredKey('Wallet')}
          onHoverOut={() => setHoveredKey('')}
          style={[
            isDesktop ? styles.itemDesktop : styles.itemMobile,
            currentRouteKey?.includes('Wallet') || hoveredKey === 'Wallet'
              ? styles.activeItem
              : styles.inactiveItem,
          ]}
        >
          <Icon name="WalletIcon" size={isDesktop ? 30 : 25} />
          <Text style={[isDesktop ? styles.textItemDesktop : styles.textItemMobile]}>Wallet</Text>
        </Pressable>

        {Platform.OS === 'web' && (
          <Pressable
            onPress={handleStudioScreen}
            onHoverIn={() => setHoveredKey('Studio')}
            onHoverOut={() => setHoveredKey('')}
            style={[
              isDesktop ? styles.itemDesktop : styles.itemMobile,
              currentRouteKey?.includes('Studio') || hoveredKey === 'Studio'
                ? styles.activeItem
                : styles.inactiveItem,
            ]}
          >
            <Icon name="VideoIcon" size={isDesktop ? 30 : 25} />
            <Text style={[isDesktop ? styles.textItemDesktop : styles.textItemMobile]}>Studio</Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleSocialScreen}
          onHoverIn={() => setHoveredKey('SocialPayment')}
          onHoverOut={() => setHoveredKey('')}
          style={[
            isDesktop ? styles.itemDesktop : styles.itemMobile,
            currentRouteKey?.includes('SocialPayment') || hoveredKey === 'SocialPayment'
              ? styles.activeItem
              : styles.inactiveItem,
          ]}
        >
          <Icon name="SunIcon" size={isDesktop ? 30 : 25} />
          <Text style={[isDesktop ? styles.textItemDesktop : styles.textItemMobile]}>Socials</Text>
        </Pressable>

        {publicKey && (
          <Pressable
            onPress={handleNavigateProfile}
            onHoverIn={() => setHoveredKey('Profile')}
            onHoverOut={() => setHoveredKey('')}
            style={[
              isDesktop ? styles.itemDesktop : styles.itemMobile,
              currentRouteKey?.includes('Profile') || hoveredKey === 'Profile'
                ? styles.activeItem
                : styles.inactiveItem,
            ]}
          >
            <Icon name="UserIcon" size={isDesktop ? 30 : 25} />
            <Text style={[isDesktop ? styles.textItemDesktop : styles.textItemMobile]}>
              Profile
            </Text>
          </Pressable>
        )}

        {!publicKey && !ndk?.ndk?.signer && (
          <Pressable
            onPress={handleAuth}
            onHoverIn={() => setHoveredKey('Login')}
            onHoverOut={() => setHoveredKey('')}
            style={[
              isDesktop ? styles.itemDesktop : styles.itemMobile,
              currentRouteKey?.includes('Login') || hoveredKey === 'Login'
                ? styles.activeItem
                : styles.inactiveItem,
            ]}
          >
            <Icon name="UserPlusIcon" size={isDesktop ? 30 : 25} />
            <Text style={[isDesktop ? styles.textItemDesktop : styles.textItemMobile]}>Login</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
};

export default Sidebar;
