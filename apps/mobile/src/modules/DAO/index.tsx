import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { View, Text } from 'react-native';
import { useStyles, useTheme } from '../../hooks';
import { MainStackNavigationProps } from '../../types';
import { SelectedTab, TABS_COMMUNITY, TABS_TIP_LIST } from '../../types/tab';
import stylesheet from './styles';
import { Button, Input, Modal } from '../../components';

export const DAOComponent: React.FC = () => {
  const styles = useStyles(stylesheet);
  const theme = useTheme();
  const navigation = useNavigation<MainStackNavigationProps>();
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(SelectedTab.ALL_GROUP);
  const handleTabSelected = (tab: string | SelectedTab, screen?: string) => {
    setSelectedTab(tab as any);
    if (screen) {
      navigation.navigate(screen as any);
    }
  };


  const [isFormCreateDao, setIsFormCreateDao] = useState(false);
  const handleFormCreateDao = () => {

    setIsFormCreateDao(!isFormCreateDao);
    // navigation.navigate('MainStack', { screen: 'CreateForm' });
  }

  const handleCallbackCreateDao = () => {

  }
  return (
    <View style={styles.container}>

      {isFormCreateDao && (
        <View>
          <Text style={styles.text}>Create DAO</Text>
          <Modal
            style={{ height: "80%" }}
          // style={styles.modal}
          >
            <View style={styles.modalContent}>


              <Input>
              </Input>


              <Button
                onPress={handleCallbackCreateDao}
              >
                <Text>Create</Text>
              </Button>
            </View>
          </Modal>
        </View>
      )}

     <View style={styles.modalContents} >
     <Text style={styles.text}>DAO coming soon</Text>
<Button
  onPress={handleFormCreateDao}
>
  <Text>Create DAO</Text>
  </Button>  </View>
    </View>
  );
};
