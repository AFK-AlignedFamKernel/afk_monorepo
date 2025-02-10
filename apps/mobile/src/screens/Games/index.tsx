import {useMemo, useState} from 'react';
import {KeyboardAvoidingView, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useStyles, useTheme, useWindowDimensions} from '../../hooks';
import {PixelPeace} from '../../modules/PixelPeace';
import {GameSreenProps} from '../../types';
import {SelectedTab, CONSOLE_TABS_MENU} from '../../types/tab';
import {AllKeysComponent} from '../KeysMarketplace/AllKeysComponent';
import {LaunchpadComponent} from '../Launchpad/LaunchpadComponent';
import {SlinksMap} from '../Slink/SlinksMap';
import stylesheet from './styles';
import {NameserviceComponent} from '../../modules/nameservice';
import {IconButton} from '../../components';

export const Games: React.FC<GameSreenProps> = ({navigation}) => {
  const theme = useTheme();
  const styles = useStyles(stylesheet);
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(undefined);

  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]);

  const handleTabSelected = (tab: string | SelectedTab, screen?: string) => {
    setSelectedTab(tab as any);
    if (screen) {
      navigation.navigate(screen as any);
    }
  };

  const handleGoBack = () => {
    setSelectedTab(undefined);
  };

  return (
    <View style={styles.container}>
      {!selectedTab ? (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {maxWidth: isDesktop ? '80%' : '100%', gap: isDesktop ? 30 : 15},
          ]}
          showsVerticalScrollIndicator={false}
        >
          {CONSOLE_TABS_MENU.map((option) => (
            <Pressable
              style={[styles.menuItem, {borderRadius: isDesktop ? 20 : 15}]}
              onPress={() => handleTabSelected(option.tab)}
            >
              <Text style={[styles.title, {fontSize: isDesktop ? 20 : 18}]}>{option.title}</Text>
              <Text style={[styles.description, {fontSize: isDesktop ? 20 : 12}]}>
                {option.description}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <KeyboardAvoidingView behavior="padding" style={styles.selectedContent}>
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
                  <IconButton
                    icon="AnchorBack"
                    size={25}
                    onPress={handleGoBack}
                    style={styles.backButton}
                  />
                  <Text style={styles.mainTitle}>Fun Pump</Text>
                  <LaunchpadComponent isButtonInstantiateEnable={true}></LaunchpadComponent>
                </View>
              )}

              {selectedTab == SelectedTab.NAMESERVICE && (
                <View>
                  <NameserviceComponent></NameserviceComponent>
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
      )}
    </View>
  );
};
