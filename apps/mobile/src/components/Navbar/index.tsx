import * as React from 'react';
import { Image, Text, TouchableOpacity, View, FlatList } from 'react-native';

import { useStyles, useWindowDimensions } from '../../hooks';
import { Icon } from '../Icon';
import stylesheet from './styles';
import CustomProfileMenu from '../Starknet/CustomProfile';
import { Avatar } from '../Avatar';
import { NostrKeyManager } from 'afk_nostr_sdk';
interface CustomHeaderInterface {
  title?: string;
  navigation?: any;
  showLogo?: boolean;
}
export const Navbar = ({ title, navigation, showLogo }: CustomHeaderInterface) => {
  const styles = useStyles(stylesheet);
  const dimensions = useWindowDimensions();
  const isDesktop = React.useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]); // Adjust based on your breakpoint for desktop

  const [isOpenProfile, setIsOpenProfile] = React.useState(false);
  const nostrAccounts = NostrKeyManager.getNostrAccountsFromStorage();
  console.log('nostrAccounts', nostrAccounts);
  console.log('isOpenProfile', isOpenProfile);
  // const navigation = useNavigation<DrawerNavigationConfig>()
  return (
    <View style={styles.header}>
      {showLogo && (
        <View style={styles.logoContainer}>
          <Image
            style={styles.logo}
            //  source={require('../../assets/pepe-logo.png')}
            source={require('../../assets/afk_logo_circle.png')}
          />
          <Text style={styles.headerTitle}>{title}</Text>

          {/* <AFKIcon color={theme.colors.text} width={96} height={16} /> */}
        </View>
      )}

      {/* <CustomProfileMenu></CustomProfileMenu> */}


      <View style={styles.rightContainer}>
        {/* <View style={styles.profileContainer}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => {
              // navigation?.navigate('Profile')
              setIsOpenProfile(!isOpenProfile)
            }}
          >
            <View style={styles.avatarContainer}>
              <Avatar
                // style={styles.avatar}
                source={require('../../assets/pepe-uhoh.png')}
              // defaultSource={require('../../assets/pepe-uhoh.png')}
              />
            </View>


            <Icon name="ChevronDown" size={16} />
          </TouchableOpacity>
          {isOpenProfile && (
            <FlatList
              style={styles.listProfile}
              data={nostrAccounts}
              renderItem={({ item }) => {
                return (
                  <View>
                    <Text>{item.publicKey}</Text>
                  </View>
                )
              }}
            >
            </FlatList>
          )}
        </View> */}

        {!isDesktop && (
          <TouchableOpacity onPress={() => navigation?.openDrawer()} style={styles.burgerIcon}>
            <Icon name="MenuIcon" size={25} />
          </TouchableOpacity>
        )}

      </View>

      {/* {isDesktop &&
        <TouchableOpacity onPress={() => navigation?.openDrawer()} style={styles.burgerIcon}>
          <Icon name="MenuIcon" size={25} />
        </TouchableOpacity>
      } */}
    </View>
  );
};
