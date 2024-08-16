import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Divider, Header, Icon, IconButton, Input, KeyboardFixedView } from '../../components';
import { useStyles, useTheme } from '../../hooks';
import { useToast } from '../../hooks/modals';
import { SettingsScreenProps } from '../../types';
import stylesheet from './styles';
import { HeaderScreen } from '../../components/HeaderScreen';
import { useAuth, useSettingsStore } from 'afk_nostr_sdk';
import { AFK_RELAYS } from 'afk_nostr_sdk/src/utils/relay';

export const Settings: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const styles = useStyles(stylesheet);
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { relays, setRelays } = useSettingsStore()
  const { publicKey } = useAuth()
  // const RELAYS_USED = relays ?? AFK_RELAYS
  const RELAYS_USED = relays
  return (
    <View style={styles.container}>
      <HeaderScreen
        showLogo={false}
        left={<IconButton icon="ChevronLeftIcon" size={24} onPress={
          () => {
            navigation.navigate("Profile", { publicKey })
            // navigation.goBack
          }
        } />}
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

      <Button
        onPress={toggleTheme}
      >
        <Icon
          name={theme.dark ? 'SunIcon' : 'MoonIcon'}
          size={24}
          title='Switch theme'
          onPress={toggleTheme}
        />
        <Text>
          Switch theme
        </Text>
      </Button>

      <Divider />


      <SafeAreaView edges={['top', 'left', 'right']}>
        <View style={styles.coverButtons}>
          <View style={styles.buttons}>
            <IconButton
              icon="ChevronLeftIcon"
              size={20}
              style={styles.backButton}
              onPress={() => {
                navigation.navigate("Profile", { publicKey })
              }}
            />

          </View>
        </View>
      </SafeAreaView>

      <View style={styles.relaysSettings}>

        <Text style={styles.title}>AFK: All relays used</Text>

        {RELAYS_USED?.map((r, i) => {
          return (
            <Text  key={i} style={styles.text}>
              Relay: {r}
            </Text>
          )
        })}
      </View>
      <Divider />


    </View>
  );
};
