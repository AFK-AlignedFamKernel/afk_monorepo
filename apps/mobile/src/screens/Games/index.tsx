import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon, IconButton } from '../../components';
import { useStyles, useTheme, useWindowDimensions } from '../../hooks';
import { NameserviceComponent } from '../../modules/nameservice';
import { PixelPeace } from '../../modules/PixelPeace';
import { QuestsComponent } from '../../modules/quests';
import { GameSreenProps } from '../../types';
import { CONSOLE_TABS_MENU, SelectedTab } from '../../types/tab';
import { DAOComponent } from '../DAO/DaoComponent';
import { AllKeysComponent } from '../KeysMarketplace/AllKeysComponent';
import { LaunchpadComponent } from '../Launchpad/LaunchpadComponent';
import stylesheet from './styles';
import { IconNames } from 'src/components/Icon';
import { InfoFiComponent } from 'src/modules/InfoFi/InfoFiComponent';

export const Games: React.FC<GameSreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const styles = useStyles(stylesheet);
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(undefined);

  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]);

  const handleTabSelected = (
    tab: string | SelectedTab,
    screen?: string,
    insideRouting?: string,
  ) => {
    setSelectedTab(tab as any);
    if (screen && !insideRouting) {
      navigation.navigate(screen as any);
      setSelectedTab(undefined);
    } else if (screen && insideRouting) {
      navigation.navigate(insideRouting as any, { screen });
      setSelectedTab(undefined);
    }
  };

  const handleGoBack = () => {
    setSelectedTab(undefined);
  };

  const [isViewSelected, setIsViewSelected] = useState(true);

  return (
    <View style={styles.container}>

      {/* <View>
        <Text>AFK console</Text>

        <View>
          <Button onPress={() => setIsViewSelected(!isViewSelected)}>View</Button>

          <View>

          </View>
        </View>

      </View> */}
      {!selectedTab && isViewSelected ? (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { maxWidth: isDesktop ? '80%' : '100%', gap: isDesktop ? 30 : 15 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {CONSOLE_TABS_MENU.map((option) => (
            <Pressable
              style={[styles.menuItem, { borderRadius: isDesktop ? 20 : 15 }]}
              onPress={() => handleTabSelected(option?.tab, option?.screen, option?.insideRouting)}
            >

              <View style={{
                flexDirection: "row",
                display: "flex",
                alignItems: "center",
                gap: 10,
                // flex: 1 
              }}>
                {option.icon && <Icon name={option.icon as IconNames} size={20} />}
                <Text style={[styles.title, { fontSize: isDesktop ? 16 : 14 }]}>{option.title}</Text>

              </View>
              <Text style={[styles.description, { fontSize: isDesktop ? 14 : 12 }]}>
                {option.description}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <KeyboardAvoidingView behavior="padding" style={styles.selectedContent}>
          <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.viewContent}>
            <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
              {selectedTab == SelectedTab.PIXEL_PEACE && (
                <>
                  <IconButton
                    icon="AnchorBack"
                    size={25}
                    onPress={handleGoBack}
                    style={styles.backButton}
                  />
                  <PixelPeace></PixelPeace>
                </>
              )}

              {/* {selectedTab == SelectedTab.SLINK && (
                <>
                  <SlinksMap></SlinksMap>
                </>
              )} */}


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

              {selectedTab == SelectedTab.DAO_COMMUNITY && (
                <View>
                  <IconButton
                    icon="AnchorBack"
                    size={25}
                    onPress={handleGoBack}
                    style={styles.backButton}
                  />
                  <DAOComponent></DAOComponent>
                </View>
              )}

              {selectedTab == SelectedTab.NAMESERVICE && (
                <View>
                  <IconButton
                    icon="AnchorBack"
                    size={25}
                    onPress={handleGoBack}
                    style={styles.backButton}
                  />
                  <NameserviceComponent></NameserviceComponent>
                </View>
              )}

              {selectedTab == SelectedTab.QUESTS && (
                <View>
                  <IconButton
                    icon="AnchorBack"
                    size={25}
                    onPress={handleGoBack}
                    style={styles.backButton}
                  />
                  <QuestsComponent></QuestsComponent>
                </View>
              )}

              {selectedTab == SelectedTab?.VIEW_KEYS_MARKETPLACE && (
                <>
                  <View
                    style={{
                      paddingVertical: 5,
                      borderRadius: 5,

                      gap: 2,
                      borderColor: theme.theme?.colors?.shadow,
                    }}
                  >
                    <IconButton
                      icon="AnchorBack"
                      size={25}
                      onPress={handleGoBack}
                      style={styles.backButton}
                    />
                    <View style={{ paddingTop: 70, paddingHorizontal: 20 }}>
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
                  </View>
                  <AllKeysComponent isButtonInstantiateEnable={true}></AllKeysComponent>
                </>
              )}

              {selectedTab == SelectedTab.INFOFI_MAIN && (
                <View>
                  <InfoFiComponent isButtonInstantiateEnable={true}></InfoFiComponent>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};
