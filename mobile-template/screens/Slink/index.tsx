import {useState} from 'react';
import {KeyboardAvoidingView, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {TextButton} from '../../components';
import TabSelector from '../../components/TabSelector';
import {useStyles, useTheme} from '../../hooks';
import {GameSreenProps} from '../../types';
import {SelectedTab, TABS_MENU} from '../../types/tab';
import {SlinksMap} from './SlinksMap';
import stylesheet from './styles';

export const Slink: React.FC<GameSreenProps> = ({navigation}) => {
  const theme = useTheme();
  const styles = useStyles(stylesheet);
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(
    SelectedTab.VIEW_KEYS_MARKETPLACE,
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
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.content}>
          <SlinksMap />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};
