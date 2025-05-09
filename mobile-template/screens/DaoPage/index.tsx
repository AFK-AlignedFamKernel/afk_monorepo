import { useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text, TextButton } from '../../components';
import TabSelector from '../../components/TabSelector';
import { useStyles } from '../../hooks';
import { useDao } from '../../hooks/api/indexer/useDaos';
import { useDimensions } from '../../hooks/useWindowDimensions';
import { DaoDetail } from '../../modules/Dao/DaoDetail';
import { DaoProposals } from '../../modules/Dao/DaoProposals';
import { DAOPageProps } from '../../types';
import stylesheet from './styles';

enum DaoTabs {
  DAO_OVERVIEW,
  PROPOSALS,
}

const TABS_DAO: { screen?: string; title: string; tab: DaoTabs }[] = [
  {
    title: 'Overview',
    screen: 'DAO',
    tab: DaoTabs.DAO_OVERVIEW,
  },
  {
    title: 'Proposals',
    screen: 'DAO',
    tab: DaoTabs.PROPOSALS,
  },
];

export const DaoPage: React.FC<DAOPageProps> = ({ navigation, route }) => {
  const styles = useStyles(stylesheet);
  const { isMobile } = useDimensions();

  const { daoAddress } = route.params;
  const { data: dao } = useDao(daoAddress);

  const [selectedTab, setSelectedTab] = useState<DaoTabs | undefined>(DaoTabs.DAO_OVERVIEW);

  const handleTabSelected = (tab: string | DaoTabs, screen?: string) => {
    setSelectedTab(tab as any);
    if (screen) {
      navigation.navigate(screen as any);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.header}>
        <TextButton style={styles.cancelButton} onPress={navigation.goBack}>
          Back
        </TextButton>
      </SafeAreaView>

      {isMobile ? (
        // Mobile Layout
        <ScrollView style={styles.mobileContent}>
          <ScrollView style={styles.tabContent}>
            {selectedTab == DaoTabs.DAO_OVERVIEW && dao && <DaoDetail dao={dao} />}
            {selectedTab == DaoTabs.PROPOSALS && dao && <DaoProposals dao={dao} />}
          </ScrollView>
          <View style={styles.mobileTabBar}>
            <TabSelector
              activeTab={selectedTab}
              handleActiveTab={handleTabSelected}
              buttons={TABS_DAO}
              addScreenNavigation={false}
            />
          </View>
        </ScrollView>
      ) : (
        // Web Layout (keep existing layout)
        <View style={styles.mainContent}>
          <View style={styles.leftColumn}>
            <Text>Something here !</Text>
          </View>
          <View style={styles.rightColumn}>
            <TabSelector
              activeTab={selectedTab}
              handleActiveTab={handleTabSelected}
              buttons={TABS_DAO}
              addScreenNavigation={false}
            />
            <ScrollView style={styles.tabContent}>
              {selectedTab == DaoTabs.DAO_OVERVIEW && dao && <DaoDetail dao={dao} />}
              {selectedTab == DaoTabs.PROPOSALS && dao && <DaoProposals dao={dao} />}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};
