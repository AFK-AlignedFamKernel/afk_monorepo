import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AddPostIcon } from '../../assets/icons';
import TabSelector from '../../components/TabSelector';
import { useStyles, useTheme } from '../../hooks';
import { DirectMessages } from '../../modules/DirectMessages';
import AllGroupListComponent from '../../modules/Group/all/AllGroup';
import { MainStackNavigationProps } from '../../types';
import { SelectedTab, TABS_COMMUNITY, TABS_TIP_LIST } from '../../types/tab';
import { ChannelsFeedComponent } from '../ChannelsFeed/ChannelsFeedComponent';
import stylesheet from './styles';

export const Community: React.FC = () => {
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

  return (
    <View style={styles.container}>
      {/* <Header showLogo /> */}
      <TabSelector
        activeTab={selectedTab}
        handleActiveTab={handleTabSelected}
        buttons={TABS_COMMUNITY}
        addScreenNavigation={false}
      />
      {selectedTab == SelectedTab.CHANNELS ? (
        <>
          <ChannelsFeedComponent></ChannelsFeedComponent>
        </>
      ) : selectedTab == SelectedTab.ALL_GROUP ? (
        <>
          <AllGroupListComponent></AllGroupListComponent>
        </>
      ) : (
        <DirectMessages />
      )}
      {selectedTab !== SelectedTab.MESSAGES && (
        <Pressable
          style={styles.createPostButton}
          onPress={() => navigation.navigate('MainStack', { screen: 'CreateForm' })}
        >
          <AddPostIcon width={72} height={72} color={theme.theme.colors.primary} />
        </Pressable>
      )}
    </View>
  );
};
