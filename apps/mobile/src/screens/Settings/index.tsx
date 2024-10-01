import {useAuth} from 'afk_nostr_sdk';
import {View} from 'react-native';

import {Button, Divider, Icon, IconButton, Text} from '../../components';
import {HeaderScreen} from '../../components/HeaderScreen';
import {PrivateKeyImport} from '../../components/PrivateKeyImport';
import {RelaysConfig} from '../../components/RelaysConfig';
import {useStyles, useTheme} from '../../hooks';
import {MainStackNavigationProps, SettingsScreenProps} from '../../types';
import stylesheet from './styles';
import {useNavigation} from '@react-navigation/native';

export const Settings: React.FC<SettingsScreenProps> = ({navigation}) => {
  const styles = useStyles(stylesheet);
  const {theme, toggleTheme} = useTheme();
  const {publicKey, isExtension} = useAuth();
  const navigationMain = useNavigation<MainStackNavigationProps>();
  return (
    <View style={styles.container}>
      <HeaderScreen
        showLogo={false}
        left={
          <IconButton
            icon="ChevronLeftIcon"
            size={16}
            onPress={() => {
              // navigationMain.navigate('Profile', {publicKey});
              navigationMain.goBack();
              // navigation.goBack
            }}
          />
        }
        // right={<IconButton icon="MoreHorizontalIcon" size={24} />}
        title="Settings"
      />

      {/* <Pressable
        onPress={toggleTheme}
      >
        <Icon
          name={theme.dark ? 'SunIcon' : 'MoonIcon'}
          size={24}
          title='Switch theme'
          onPress={toggleTheme}
        />
      </Pressable> */}

      <View style={styles.content}>
        <View style={styles.toggleThemeContainer}>
          <Text>Switch theme</Text>
          <Button onPress={toggleTheme} style={styles.themeButton}>
            <Icon
              style={styles.toggleIcon}
              name={theme.dark ? 'SunIcon' : 'MoonIcon'}
              size={24}
              title="Switch theme"
              onPress={toggleTheme}
            />
          </Button>
        </View>

        <Divider style={{marginVertical: 12}} />

        {!isExtension && <PrivateKeyImport />}

        <Divider style={{marginVertical: 12}} />

        <RelaysConfig />
      </View>
    </View>
  );
};
