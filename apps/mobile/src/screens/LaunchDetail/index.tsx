import {useAccount, useProvider} from '@starknet-react/core';
import {useNostrContext} from 'afk_nostr_sdk';
import {useEffect, useState} from 'react';
import {KeyboardAvoidingView, Text, View} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {SafeAreaView} from 'react-native-safe-area-context';

import {TextButton} from '../../components';
import {LaunchActionsForm} from '../../components/LaunchActionsForm';
import {TokenLaunchDetail} from '../../components/pump/TokenLaunchDetail';
import TabSelector from '../../components/TabSelector';
import {useStyles, useTheme, useWaitConnection} from '../../hooks';
import {useBuyCoinByQuoteAmount} from '../../hooks/launchpad/useBuyCoinByQuoteAmount';
import {useDataCoins} from '../../hooks/launchpad/useDataCoins';
import {useSellCoin} from '../../hooks/launchpad/useSellCoin';
import {useWalletModal} from '../../hooks/modals';
import {LaunchDetailScreenProps} from '../../types';
import {TokenLaunchInterface} from '../../types/keys';
import {SelectedTab, TABS_LAUNCH} from '../../types/tab';
import {feltToAddress} from '../../utils/format';
import stylesheet from './styles';

export const LaunchDetail: React.FC<LaunchDetailScreenProps> = ({navigation, route}) => {
  // export const LaunchDetails: React.FC<LaunchpadScreenProps> = () => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);
  const [loading, setLoading] = useState<false | number>(false);
  const {ndk} = useNostrContext();
  const {provider} = useProvider();
  const account = useAccount();
  const {coinAddress, launch: launchParams} = route.params;
  const [launch, setLaunch] = useState<TokenLaunchInterface | undefined>(launchParams);
  const {getCoinLaunchByAddress} = useDataCoins();
  const [firstLoadDone, setFirstLoadDone] = useState(false);
  // const navigation = useNavigation<MainStackNavigationProps>();

  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(
    SelectedTab.LAUNCH_OVERVIEW,
  );
  const {handleSellCoins} = useSellCoin();
  // const { handleBuyKeys } = useBuyKeys()
  const {handleBuyCoins} = useBuyCoinByQuoteAmount();

  const waitConnection = useWaitConnection();
  const walletModal = useWalletModal();
  const [amount, setAmount] = useState<number | undefined>();
  const handleTabSelected = (tab: string | SelectedTab, screen?: string) => {
    setSelectedTab(tab as any);
    if (screen) {
      navigation.navigate(screen as any);
    }
  };

  useEffect(() => {
    const getData = async () => {
      const launchData = await getCoinLaunchByAddress(coinAddress);
      console.log('launchData', launchData);
      setLaunch(launchData);
      setFirstLoadDone(true);
    };

    if (coinAddress && !launch) {
      getData();
    }
  }, [coinAddress]);

  const onConnect = async () => {
    if (!account.address) {
      walletModal.show();

      const result = await waitConnection();
      if (!result) return;
    }
  };
  const sellKeys = async () => {
    if (!amount) return;

    await onConnect();
    if (!account || !account?.account) return;

    if (!launch?.owner) return;

    if (!launch?.token_quote) return;

    // handleSellKeys(account?.account, launch?.owner, Number(amount), launch?.token_quote, undefined)
    handleSellCoins(
      account?.account,
      feltToAddress(BigInt(launch?.token_address)),
      Number(amount),
      launch?.token_quote,
      undefined,
    );
  };

  const buyCoin = async () => {
    if (!amount) return;

    await onConnect();

    if (!account || !account?.account) return;

    if (!launch?.owner) return;

    if (!launch?.token_quote) return;

    console.log('launch', launch);
    // handleBuyKeys(account?.account, launch?.owner, launch?.token_quote, Number(amount),)
    handleBuyCoins(
      account?.account,
      feltToAddress(BigInt(launch?.token_address)),
      Number(amount),
      launch?.token_quote,
    );
  };

  if (!coinAddress) {
    return (
      <>
        <View>
          <Text>No coin address found</Text>
        </View>
      </>
    );
  }

  return (
    <View style={styles.container}>
      {/* <Header showLogo /> */}
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.header}>
        <TextButton style={styles.cancelButton} onPress={navigation.goBack}>
          Back
        </TextButton>
      </SafeAreaView>
      <KeyboardAvoidingView behavior="padding" style={styles.content}>
        <LaunchActionsForm
          onChangeText={(e) => setAmount(Number(e))}
          onBuyPress={buyCoin}
          onSellPress={sellKeys}
        ></LaunchActionsForm>
        <TabSelector
          activeTab={selectedTab}
          handleActiveTab={handleTabSelected}
          buttons={TABS_LAUNCH}
          addScreenNavigation={false}
        ></TabSelector>
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.overview}>
          <ScrollView>
            {selectedTab == SelectedTab.LAUNCH_OVERVIEW && launch && (
              <>
                <TokenLaunchDetail isViewDetailDisabled={true} launch={launch}></TokenLaunchDetail>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* {launch && (
        <TokenLaunchDetail isViewDetailDisabled={true} launch={launch}></TokenLaunchDetail>
      )} */}
    </View>
  );
};
