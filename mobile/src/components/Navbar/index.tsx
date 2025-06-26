import * as React from 'react';
import { Image, Text, TouchableOpacity, View, FlatList } from 'react-native';

import { useStyles, useWindowDimensions } from '../../hooks';
import { Icon } from '../Icon';
import stylesheet from './styles';
import CustomProfileMenu from '../Starknet/CustomProfile';
import { Avatar } from '../Avatar';
import { NostrKeyManager } from 'afk_nostr_sdk';
import { ProfileManagement } from '../ProfileManagement';
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
        <TouchableOpacity onPress={() => navigation?.navigate('Home')}>
          <View style={styles.logoContainer}>
            <Image
              style={styles.logo}
              //  source={require('../../assets/pepe-logo.png')}
              source={require('../../assets/afk_logo_circle.png')}
            />
            <Text style={styles.headerTitle}>{title}</Text>
            {/* <AFKIcon color={theme.colors.text} width={96} height={16} /> */}
          </View>
        </TouchableOpacity>

      )}

      {/* <CustomProfileMenu></CustomProfileMenu> */}


      <View style={styles.rightContainer}>
        {/* todo finish nostr with menu/accordion and login multi account
        add starknet wallet */}
        <ProfileManagement isModalMode={true}></ProfileManagement>
        {/* <NostrProfile></NostrProfile> */}


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
