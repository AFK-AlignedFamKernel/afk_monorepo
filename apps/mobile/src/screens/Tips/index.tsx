import {useNavigation} from '@react-navigation/native';
import {useState} from 'react';
import {Pressable, View} from 'react-native';

import {AddPostIcon} from '../../assets/icons';
import TabSelector from '../../components/TabSelector';
import {useStyles, useTheme} from '../../hooks';
import {MainStackNavigationProps} from '../../types';
import {SelectedTab, TABS_LIST} from '../../types/tab';
import {ChannelsFeedComponent} from '../ChannelsFeed/ChannelsFeedComponent';
import stylesheet from './styles';
import {TipsComponent} from './TipsComponent';

export const Tips: React.FC = () => {
  const styles = useStyles(stylesheet);
  const theme = useTheme();
  const navigation = useNavigation<MainStackNavigationProps>();
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(SelectedTab.TIPS);
  const handleTabSelected = (tab: string | SelectedTab, screen?: string) => {
    setSelectedTab(tab as any);
    if (screen) {
      navigation.navigate(screen as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* <Header showLogo /> */}
      <TabSelector
        activeTab={selectedTab}
        handleActiveTab={handleTabSelected}
        buttons={TABS_LIST}
        addScreenNavigation={false}
      />
      {selectedTab == SelectedTab.TIPS ? (
        <TipsComponent></TipsComponent>
      ) : selectedTab == SelectedTab.CHANNELS ? (
        <>
          <ChannelsFeedComponent></ChannelsFeedComponent>
        </>
      ) : (
        <></>
      )}

      <Pressable
        style={styles.createPostButton}
        onPress={() => navigation.navigate('MainStack', {screen: 'CreateForm'})}
      >
        <AddPostIcon width={72} height={72} color={theme.theme.colors.primary} />
      </Pressable>
    </View>
  );
};
