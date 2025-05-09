import {useNavigation} from '@react-navigation/native';
import {useAccount, useProvider} from '@starknet-react/core';
import {useNostrContext} from 'afk_nostr_sdk';
import {useState} from 'react';
import {Text, View} from 'react-native';

import {useStyles, useTheme, useWaitConnection} from '../../hooks';
import {useToast, useTransaction, useTransactionModal} from '../../hooks/modals';
import {AllSubsScreenProps, MainStackNavigationProps} from '../../types';
import {SelectedTab} from '../../types/tab';
import {AllSubsComponent} from '../../modules/InfoFi/sub/AllSub';
import stylesheet from '../../modules/InfoFi/styles';

export const AllSubsScreen: React.FC<AllSubsScreenProps> = () => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);

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
      <AllSubsComponent></AllSubsComponent>
    </View>
  );
};
