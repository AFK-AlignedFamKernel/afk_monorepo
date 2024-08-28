import {useState} from 'react';
import {KeyboardAvoidingView, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {TextButton} from '../../components';
import TabSelector from '../../components/TabSelector';
import {useStyles, useTheme} from '../../hooks';
import {GameSreenProps} from '../../types';
import {SelectedTab, TABS_MENU} from '../../types/tab';
import {AllKeysComponent} from '../KeysMarketplace/AllKeysComponent';
import {LaunchpadComponent} from '../Launchpad/LaunchpadComponent';
import {SlinksMap} from '../Slink/SlinksMap';
import stylesheet from './styles';
import { PixelPeace } from '../../modules/PixelPeace';

export const Games: React.FC<GameSreenProps> = ({navigation}) => {
  const theme = useTheme();
  const styles = useStyles(stylesheet);
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(
    SelectedTab.LAUNCHPAD_VIEW,
  );
  const handleTabSelected = (tab: string | SelectedTab, screen?: string) => {
    setSelectedTab(tab as any);
    if (screen) {
      navigation.navigate(screen as any);
    }
  };
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.header}>
        <TextButton style={styles.cancelButton} onPress={navigation.goBack}>
          Cancel
        </TextButton>
      </SafeAreaView>
      <KeyboardAvoidingView behavior="padding" style={styles.content}>
        <TabSelector
          activeTab={selectedTab}
          handleActiveTab={handleTabSelected}
          buttons={TABS_MENU}
          addScreenNavigation={false}
        ></TabSelector>
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.viewContent}>
          <ScrollView>

          {selectedTab == SelectedTab.PIXEL_PEACE && (
              <>
                <PixelPeace></PixelPeace>
              </>
            )}

            {selectedTab == SelectedTab.SLINK && (
              <>
                <SlinksMap></SlinksMap>
              </>
            )}

            {selectedTab == SelectedTab.LAUNCHPAD_VIEW && (
              <View>
                <LaunchpadComponent isButtonInstantiateEnable={true}></LaunchpadComponent>
              </View>
            )}

            {selectedTab == SelectedTab?.VIEW_KEYS_MARKETPLACE && (
              <>
                <View
                  style={{
                    paddingVertical: 5,
                    borderRadius: 5,
                    borderColor: theme.theme?.colors?.shadow,
                  }}
                >
                  <Text style={styles.text}>Key pass for Starknet user</Text>
                  <Text style={styles.text}>
                    {' '}
                    Send the force and tip your friends and favorite content creator.
                  </Text>
                  <Text style={styles.text}>
                    {' '}
                    Buy or sell the keys to get perks and rewards from them, linked to Nostr &
                    Starknet.
                  </Text>
                </View>
                <AllKeysComponent isButtonInstantiateEnable={true}></AllKeysComponent>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};
