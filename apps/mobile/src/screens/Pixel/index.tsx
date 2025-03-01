import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '../../components';
import { useStyles, useTheme, useWindowDimensions } from '../../hooks';
import { NameserviceComponent } from '../../modules/nameservice';
import { PixelPeace } from '../../modules/PixelPeace';
import { QuestsComponent } from '../../modules/quests';
import { PixelScreenProps } from '../../types';
import { CONSOLE_TABS_MENU, SelectedTab } from '../../types/tab';
import { DAOComponent } from '../DAO/DaoComponent';
import { AllKeysComponent } from '../KeysMarketplace/AllKeysComponent';
import { LaunchpadComponent } from '../Launchpad/LaunchpadComponent';
import stylesheet from './styles';

export const PixelScreen: React.FC<PixelScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const styles = useStyles(stylesheet);
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(SelectedTab.PIXEL_PEACE);

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

  return (
    <View style={styles.container}>
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

          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
      {/* {!selectedTab ? (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { maxWidth: isDesktop ? '80%' : '100%', gap: isDesktop ? 30 : 15 },
          ]}
          showsVerticalScrollIndicator={false}
        >
    
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

            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      )} */}
    </View>
  );
};
