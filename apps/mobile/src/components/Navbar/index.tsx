import * as React from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';

import {useStyles} from '../../hooks';
import {Icon} from '../Icon';
import stylesheet from './styles';
interface CustomHeaderInterface {
  title?: string;
  navigation?: any;
  showLogo?: boolean;
}
export const Navbar = ({title, navigation, showLogo}: CustomHeaderInterface) => {
  const styles = useStyles(stylesheet);
  // const navigation = useNavigation<DrawerNavigationConfig>()
  return (
    <View style={styles.header}>
      {showLogo && (
        <View style={styles.logoContainer}>
          <Image style={styles.logo} source={require('../../assets/pepe-logo.png')} />
          {/* <AFKIcon color={theme.colors.text} width={96} height={16} /> */}
        </View>
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity onPress={() => navigation?.openDrawer()} style={styles.burgerIcon}>
        <Icon name="MenuIcon" size={25} />
      </TouchableOpacity>
    </View>
  );
};
