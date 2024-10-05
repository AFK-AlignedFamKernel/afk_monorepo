import { useAccount, useProvider } from '@starknet-react/core';
import { useNostrContext } from 'afk_nostr_sdk';
import { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TextButton } from '../../components';
import { LaunchActionsForm } from '../../components/LaunchActionsForm';
import { TokenLaunchDetail } from '../../components/pump/TokenLaunchDetail';
import TabSelector from '../../components/TabSelector';
import { useStyles, useTheme } from '../../hooks';
import { useGetHoldings } from '../../hooks/api/indexer/useHoldings';
import { useBuyCoinByQuoteAmount } from '../../hooks/launchpad/useBuyCoinByQuoteAmount';
import { useSellCoin } from '../../hooks/launchpad/useSellCoin';
import { useWalletModal } from '../../hooks/modals';
import { LaunchDetailScreenProps } from '../../types';

import {
  TokenDeployInterface,
  TokenHoldersInterface,
  TokenLaunchInterface,
  TokenStatsInterface,
  TokenTxInterface,
  UserShareInterface,
} from '../../types/keys';
import { SelectedTab, TABS_LAUNCH } from '../../types/tab';
import stylesheet from './styles';
import { TokenTx } from '../../components/LaunchPad/TokenTx';
import { useGetTransactions } from '../../hooks/api/indexer/useTransactions';
import { TokenHolderDetail } from '../../components/LaunchPad/TokenHolderDetail';
import { TokenStats } from '../../components/LaunchPad/TokenStats';
import { useGetTokenStats } from '../../hooks/api/indexer/useTokenStats';
import { useGetDeployToken } from '../../hooks/api/indexer/useDeployToken';
import { UserShare } from '../../components/LaunchPad/UserShare';
import { useGetShares } from '../../hooks/api/indexer/useUserShare';
import { feltToAddress } from 'common';
import { Text } from '../../components';
import { useGetTokenLaunch } from '../../hooks/api/indexer/useLaunchTokens';

export const LaunchDetail: React.FC<LaunchDetailScreenProps> = ({ navigation, route }) => {
  // export const LaunchDetails: React.FC<LaunchpadScreenProps> = () => {
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);
  const [loading, setLoading] = useState<false | number>(false);
  const account = useAccount();


  console.log(account, "account")


  const { coinAddress, } = route.params;

  const [tokens, setTokens] = useState<TokenDeployInterface[] | undefined>([]);

  const [token, setToken] = useState<TokenDeployInterface | undefined>();

  const [holdings, setHoldings] = useState<TokenHoldersInterface | undefined>();

  const [totalHoldersAddress, setTotalHoldersAddress] = useState<number>(0);

  const [transactions, setTransaction] = useState<TokenTxInterface[]>([]);

  const [shares, setShares] = useState<UserShareInterface[]>([]);

  const [stats, setStats] = useState<TokenStatsInterface | undefined>();

  const [firstLoadDone, setFirstLoadDone] = useState(false);
  // const navigation = useNavigation<MainStackNavigationProps>();

  const { data: holdingsData, isLoading: holdingsLoading } = useGetHoldings(coinAddress);

  const { data: transactionData, isLoading: txLoading } = useGetTransactions(coinAddress);

  const { data: statsData, isLoading: statsLoading } = useGetTokenStats(coinAddress);

  const { data: sharesData, isLoading: sharesLoading } = useGetShares(coinAddress, account?.address ?? "");

  const { data: tokenData, isLoading: tokenLoading } = useGetTokenLaunch(coinAddress)

  console.log("tokenData",tokenData)
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(
    SelectedTab.LAUNCH_OVERVIEW,
  );
  const { handleSellCoins } = useSellCoin();
  const { handleBuyCoins } = useBuyCoinByQuoteAmount();

  const walletModal = useWalletModal();

  const [amount, setAmount] = useState<number | undefined>();

  const handleTabSelected = (tab: string | SelectedTab, screen?: string) => {
    setSelectedTab(tab as any);
    if (screen) {
      navigation.navigate(screen as any);
    }
  };


  useEffect(() => {
    if (tokenData && tokenData.data) {
      setTokens(tokenData.data)
      setToken(tokenData)
    }
  }, [tokenData]);


  useEffect(() => {
    setHoldings(holdingsData);
  }, [holdingsData]);

  useEffect(() => {
    const data = transactionData || [];
    setTransaction(data);
  }, [transactionData]);

  useEffect(() => {
    setStats(statsData);
  }, [statsData]);


  useEffect(() => {
    const data = sharesData || [];
    setStats(data);
  }, [sharesData]);

  // useEffect(() => {
  //   const latestToken = tokens?.sort((a, b) => Number(b.created_at) - Number(a.created_at))[0];
  //   setToken(latestToken)
  // }, [tokens])


  const onConnect = async () => {
    if (!account.address) {
      walletModal.show();

      // const result = await waitConnection();
      // if (!result) return;
    }
  };

  const sellKeys = async () => {
    if (!amount) return;

    await onConnect();
    if (!account || !account?.account) return;

    if (!token?.owner) return;

    if (!token?.quote_token) return;

    handleSellCoins(
      account?.account,
      feltToAddress(BigInt(token?.memecoin_address)),
      Number(amount),
      token?.quote_token,
      undefined,
    );
  };

  const buyCoin = async () => {
    if (!amount) return;

    await onConnect();

    if (!account || !account?.account) return;

    console.log("token",token)

    if (!token?.owner) return;

    if (!token?.token_quote) return;
    // handleBuyKeys(account?.account, token?.owner, token?.token_quote, Number(amount),)
    handleBuyCoins(
      account?.account,
      feltToAddress(BigInt(token?.memecoin_address)),
      Number(amount),
      token?.quote_token,
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
          {selectedTab == SelectedTab.LAUNCH_OVERVIEW && tokens && (
            <>
              <TokenLaunchDetail isViewDetailDisabled={true} launch={tokenData} />
            </>
          )}

          <ScrollView>

            {selectedTab == SelectedTab.LAUNCH_HOLDERS && (
              <>
                <View style={styles.holdersTotal} >
                  <Text weight="medium" fontSize={14}  >Total Owner Address:</Text>
                  <Text weight='bold' fontSize={14}>{holdings?.data?.[0]?._count.owner_address ?? 0}</Text>
                </View>
                <TokenHolderDetail holders={holdings} loading={holdingsLoading} />
              </>
            )}

            {selectedTab == SelectedTab.LAUNCH_TX && transactions && (
              <>
                <TokenTx tx={transactions} loading={txLoading} />
              </>
            )}

            {selectedTab == SelectedTab.TOKEN_STATS && transactions && (
              <>
                <TokenStats loading={statsLoading} stats={stats} />
              </>
            )}


            {selectedTab == SelectedTab.USER_SHARE && shares && (
              <>
                <UserShare loading={sharesLoading} shares={shares} />
              </>
            )}


          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};

