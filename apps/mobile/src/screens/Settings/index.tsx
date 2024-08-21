import {useAuth} from 'afk_nostr_sdk';
import {Text, View} from 'react-native';

import {Button, Divider, Icon, IconButton} from '../../components';
import {HeaderScreen} from '../../components/HeaderScreen';
import {PrivateKeyImport} from '../../components/PrivateKeyImport';
import {RelaysConfig} from '../../components/RelaysConfig';
import {useStyles, useTheme} from '../../hooks';
import {SettingsScreenProps} from '../../types';
import stylesheet from './styles';

export const Settings: React.FC<SettingsScreenProps> = ({navigation}) => {
  const styles = useStyles(stylesheet);
  const {theme, toggleTheme} = useTheme();
  const {publicKey, isExtension} = useAuth();
  return (
    <View style={styles.container}>
      <HeaderScreen
        showLogo={false}
        left={
          <IconButton
            icon="ChevronLeftIcon"
            size={24}
            onPress={() => {
              navigation.navigate('Profile', {publicKey});
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

      <Button onPress={toggleTheme} style={{width: 'auto'}}>
        <Icon
          name={theme.dark ? 'SunIcon' : 'MoonIcon'}
          size={24}
          title="Switch theme"
          onPress={toggleTheme}
        />
        <Text>Switch theme</Text>
      </Button>

      <Divider />

      {!isExtension && <PrivateKeyImport />}
      <Divider />

      <RelaysConfig></RelaysConfig>

      <Divider />
    </View>
  );
};
