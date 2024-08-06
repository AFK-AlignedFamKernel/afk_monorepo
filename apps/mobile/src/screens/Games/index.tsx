import { useState } from 'react';
import { KeyboardAvoidingView, View, Text} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextButton } from '../../components';
import TabSelector from '../../components/TabSelector';
import { useStyles } from '../../hooks';
import {  GameSreenProps } from '../../types';
import { SelectedTab, TABS_FORM_CREATE } from '../../types/tab';
import stylesheet from './styles';

export const Games: React.FC<GameSreenProps> = ({ navigation }) => {
  const styles = useStyles(stylesheet);
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(SelectedTab.CREATE_NOTE);

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
        {/* <TabSelector
          activeTab={selectedTab}
          handleActiveTab={handleTabSelected}
          buttons={TABS_FORM_CREATE}
          addScreenNavigation={false}
        ></TabSelector> */}
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.content}>
          <Text>Coming soon</Text>
     
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};
