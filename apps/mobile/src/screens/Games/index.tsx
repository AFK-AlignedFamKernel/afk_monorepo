import { useState } from 'react';
import { KeyboardAvoidingView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextButton } from '../../components';
import TabSelector from '../../components/TabSelector';
import { useStyles } from '../../hooks';
import { GameSreenProps } from '../../types';
import { SelectedTab, TABS_MENU } from '../../types/tab';
import stylesheet from './styles';
import { AllKeysComponent } from '../KeysMarketplace/AllKeysComponent';

export const Games: React.FC<GameSreenProps> = ({ navigation }) => {
  const styles = useStyles(stylesheet);
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(SelectedTab.VIEW_KEYS_MARKETPLACE);
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
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.content}>
          <Text>Moarr features coming soon</Text>
          {selectedTab == SelectedTab?.VIEW_KEYS_MARKETPLACE &&
            <>
              <Text>Key pass for Starknet user</Text>
              <Text> Buy or sell the keys of content creator to get perks and rewards from them.</Text>
              <AllKeysComponent isButtonInstantiateEnable={true}></AllKeysComponent>
            </>
          }
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};
