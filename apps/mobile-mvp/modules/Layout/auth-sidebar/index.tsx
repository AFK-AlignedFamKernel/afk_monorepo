import React, {useEffect} from 'react';
import {Image, Text, View} from 'react-native';

import {useStyles} from '../../../hooks';
import stylesheet from './styles';

interface SidebarInterface {
  navigation: any;
}
const AuthSidebar = ({navigation}: SidebarInterface) => {
  const styles = useStyles(stylesheet);

  useEffect(() => {
    const unsubscribe = navigation.addListener('drawerClose', () => {
      // Code to handle drawer closing
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.sidebar}>
      <View style={styles.logoContainer}>
        <Image style={styles.logo} source={require('../../../assets/afkMascot.png')} />
        {/* <AFKIcon color={theme.colors.text} width={96} height={16} /> */}
      </View>

      <Text style={styles.sidebarText}>AFK: Aligned Fam Kernel</Text>

      <View style={styles.container}>
        <Text style={styles.title}>All-in-one platform</Text>
      </View>

      <View style={styles.container}>
        <Text style={styles.textItem}>Connect or create an Account</Text>
        <Text style={styles.textItem}>Access the AFK app</Text>
      </View>

      <View style={styles.container}>
        <Text style={styles.textItem}>Coming soon also in IOS and Android</Text>

        <View style={{flex: 1, flexDirection: 'row'}}></View>
      </View>
    </View>
  );
};

export default AuthSidebar;
