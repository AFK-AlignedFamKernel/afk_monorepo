import {useNavigation} from '@react-navigation/native';
import {useAccount, useProvider} from '@starknet-react/core';
import {useNostrContext} from 'afk_nostr_sdk';
import {useState} from 'react';
import {Text, View} from 'react-native';

import {useStyles, useTheme, useWaitConnection} from '../../hooks';
import {useToast, useTransaction, useTransactionModal} from '../../hooks/modals';
import {LaunchpadScreenProps, MainStackNavigationProps} from '../../types';
import {SelectedTab} from '../../types/tab';
import {LaunchpadComponent} from './LaunchpadComponent';
import stylesheet from './styles';

export const LaunchpadScreen: React.FC<LaunchpadScreenProps> = () => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);
  const [loading, setLoading] = useState<false | number>(false);
  const {ndk} = useNostrContext();

  const {provider} = useProvider();
  const account = useAccount();
  const sendTransaction = useTransaction({});
  const waitConnection = useWaitConnection();
  const {show: showTransactionModal} = useTransactionModal();
  const {showToast} = useToast();
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
      <LaunchpadComponent isButtonInstantiateEnable={true}></LaunchpadComponent>
    </View>
  );
};
