import {useNavigation} from '@react-navigation/native';
import {useAccount, useProvider} from '@starknet-react/core';
import {useNostrContext} from 'afk_nostr_sdk';
import {useState} from 'react';
import {Text, View} from 'react-native';

// import {useNostrContext} from '../../context/NostrContext';
import {useStyles, useTheme, useWaitConnection} from '../../hooks';
import {useClaim, useEstimateClaim} from '../../hooks/api';
import {useTips} from '../../hooks/api/indexer/useTips';
import {useToast, useTransaction, useTransactionModal, useWalletModal} from '../../hooks/modals';
import {KeysMarketplaceSreenProps, MainStackNavigationProps} from '../../types';
import {SelectedTab} from '../../types/tab';
import {AllKeysComponent} from './AllKeysComponent';
import stylesheet from './styles';

export const KeysMarketplace: React.FC<KeysMarketplaceSreenProps> = () => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);
  const [loading, setLoading] = useState<false | number>(false);

  const tips = useTips();
  const {ndk} = useNostrContext();

  const {provider} = useProvider();
  const account = useAccount();
  const {sendTransaction} = useTransaction({});
  const claim = useClaim();
  const estimateClaim = useEstimateClaim();
  const walletModal = useWalletModal();
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
      {/* <Header showLogo /> */}
      <Text style={styles.text}>Key pass for Starknet user</Text>
      <Text style={{...styles.text, marginBottom: 1}}>
        {' '}
        Buy or sell the keys of content creator to get perks and rewards from them.
      </Text>
      <AllKeysComponent isButtonInstantiateEnable={true}></AllKeysComponent>
      {/* {selectedTab == SelectedTab.TIPS ? (
        <TipsComponent></TipsComponent>
      ) : selectedTab == SelectedTab.CHANNELS ? (
        <>
          <ChannelComponent></ChannelComponent>
        </>
      ) : (
        <></>
      )} */}
    </View>
  );
};
