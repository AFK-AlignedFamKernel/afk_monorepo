import * as React from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';

import {useStyles, useWindowDimensions} from '../../hooks';
import {Icon} from '../Icon';
import stylesheet from './styles';
import CustomProfileMenu from '../Starknet/CustomProfile';
interface CustomHeaderInterface {
  title?: string;
  navigation?: any;
  showLogo?: boolean;
}
export const Navbar = ({title, navigation, showLogo}: CustomHeaderInterface) => {
  const styles = useStyles(stylesheet);
  const dimensions = useWindowDimensions();
  const isDesktop = React.useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]); // Adjust based on your breakpoint for desktop

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

      {!isDesktop && (
        <TouchableOpacity onPress={() => navigation?.openDrawer()} style={styles.burgerIcon}>
          <Icon name="MenuIcon" size={25} />
        </TouchableOpacity>
      )}

      {/* {isDesktop &&
        <TouchableOpacity onPress={() => navigation?.openDrawer()} style={styles.burgerIcon}>
          <Icon name="MenuIcon" size={25} />
        </TouchableOpacity>
      } */}
    </View>
  );
};
