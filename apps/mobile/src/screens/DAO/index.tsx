import {useState} from 'react';
import {KeyboardAvoidingView, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {TextButton} from '../../components';
import {useStyles, useTheme} from '../../hooks';
import { DAOScreenProps} from '../../types';
import {SelectedTab, TABS_CONSOLE} from '../../types/tab';
import stylesheet from './styles';
import { DAOComponent } from '../../modules/DAO';

export const DAOScreen: React.FC<DAOScreenProps> = ({navigation}) => {
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
     
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.viewContent}>
          <ScrollView>
            <DAOComponent />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};
