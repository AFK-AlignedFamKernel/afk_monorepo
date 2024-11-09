import {useAccount} from '@starknet-react/core';
import {feltToAddress} from 'common';
import {useEffect, useState} from 'react';
import {StyleProp, useWindowDimensions, View, ViewStyle} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Button, TextButton} from '../../components';
import {Text} from '../../components';
import {LaunchActionsForm} from '../../components/LaunchActionsForm';
import {TokenLaunchDetail} from '../../components/pump/TokenLaunchDetail';
import TabSelector from '../../components/TabSelector';
import {useStyles, useTheme} from '../../hooks';
import {useGetHoldings} from '../../hooks/api/indexer/useHoldings';
import {useGetTokenLaunch} from '../../hooks/api/indexer/useLaunchTokens';
import {useGetTokenStats} from '../../hooks/api/indexer/useTokenStats';
import {useGetTransactions} from '../../hooks/api/indexer/useTransactions';
import {useGetShares} from '../../hooks/api/indexer/useUserShare';
import {useBuyCoinByQuoteAmount} from '../../hooks/launchpad/useBuyCoinByQuoteAmount';
import {useSellCoin} from '../../hooks/launchpad/useSellCoin';
import {useToast, useWalletModal} from '../../hooks/modals';
import {LaunchDetailScreenProps} from '../../types';
import {
  LaunchDataMerged,
  TokenDeployInterface,
  TokenHoldersInterface,
  TokenStatsInterface,
  TokenTxInterface,
  UserShareInterface,
} from '../../types/keys';
import {SelectedTab, TABS_LAUNCH} from '../../types/tab';
import stylesheet from './styles';
import { TokenHolderDetail } from '../../components/LaunchPad/TokenHolderDetail';
import { TokenTx } from '../../components/LaunchPad/TokenTx';
import { TokenStats } from '../../components/LaunchPad/TokenStats';
import { UserShare } from '../../components/LaunchPad/UserShare';

interface LaunchDetailStyles {
  holdersTotal: ViewStyle;
  container: ViewStyle;
  header: ViewStyle;
  cancelButton: ViewStyle;
  mainContent: ViewStyle;
  leftColumn: ViewStyle;
  rightColumn: ViewStyle;
  tabContent: ViewStyle;
  mobileContent: ViewStyle;
  mobileTabBar: ViewStyle;
}

export const LaunchDetail: React.FC<LaunchDetailScreenProps> = ({navigation, route}) => {
  // export const LaunchDetails: React.FC<LaunchpadScreenProps> = () => {
  const {theme} = useTheme();
  const styles = useStyles<LaunchDetailStyles, []>(stylesheet);
  const [loading, setLoading] = useState(false);
  const account = useAccount();
  const [typeAction, setTypeAction] = useState<'SELL' | 'BUY'>('BUY');

  console.log(account, 'account');

  const {coinAddress} = route.params;

  const [tokens, setTokens] = useState<TokenDeployInterface[] | undefined>([]);

  const [token, setToken] = useState<TokenDeployInterface | undefined>();
  const [launch, setLaunch] = useState<LaunchDataMerged | undefined>();

  const [holdings, setHoldings] = useState<TokenHoldersInterface | undefined>();

  const [totalHoldersAddress, setTotalHoldersAddress] = useState<number>(0);

  const [transactions, setTransaction] = useState<TokenTxInterface[]>([]);

  const [shares, setShares] = useState<UserShareInterface[]>();
  const [share, setShare] = useState<UserShareInterface>();

  const [stats, setStats] = useState<TokenStatsInterface | undefined>();

  const [firstLoadDone, setFirstLoadDone] = useState(false);
  // const navigation = useNavigation<MainStackNavigationProps>();

  const {data: holdingsData, isLoading: holdingsLoading} = useGetHoldings(coinAddress);

  const {data: transactionData, isLoading: txLoading} = useGetTransactions(coinAddress);

  const {data: statsData, isLoading: statsLoading} = useGetTokenStats(coinAddress);

  const {data: sharesData, isLoading: sharesLoading} = useGetShares(coinAddress, account?.address);

  const {data: launchData, isLoading: tokenLoading} = useGetTokenLaunch(coinAddress);

  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(
    SelectedTab.LAUNCH_OVERVIEW,
  );
  const {handleSellCoins} = useSellCoin();
  const {handleBuyCoins} = useBuyCoinByQuoteAmount();

  const {showToast} = useToast();
  const walletModal = useWalletModal();

  const [amount, setAmount] = useState<number | undefined>(0);

  const handleTabSelected = (tab: string | SelectedTab, screen?: string) => {
    setSelectedTab(tab as any);
    if (screen) {
      navigation.navigate(screen as any);
    }
  };

  useEffect(() => {
    if (launchData && launchData.data) {
      setTokens(launchData?.data);
      setToken(launchData?.data);
      setLaunch(launchData.data);
    }
  }, [launchData]);

  useEffect(() => {
    setHoldings(holdingsData);
  }, [holdingsData]);

  useEffect(() => {
    const data = transactionData || [];
    setTransaction(data?.data);
  }, [transactionData]);

  useEffect(() => {
    setStats(statsData);
  }, [statsData]);

  useEffect(() => {
    const data = sharesData || [];
    const dataShare = sharesData;
    setShares(data);
    setShare(dataShare);
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

  const sellCoin = async (amountSellProps?: number) => {
    if (!amount && !amountSellProps) {
      return showToast({title: 'Select an amount to sell', type: 'info'});
    }
    await onConnect();
    if (!account || !account?.account) return;

    if (!token?.memecoin_address) return;
    console.log('token', token);

    // if (!token?.quote_token) return;

    const sellResult = await handleSellCoins(
      account?.account,
      feltToAddress(BigInt(token?.memecoin_address)),
      Number(amount) ?? amountSellProps,
      token?.quote_token,
      undefined,
    );

    if (sellResult && sellResult?.value) {
      return showToast({title: 'Sell done', type: 'success'});
    }
  };

  const buyCoin = async (amountProps?: number) => {
    await onConnect();
    if (!amount) {
      return showToast({title: 'Select an amount to buy', type: 'info'});
    }

    if (!account || !account?.account) return;

    console.log('token', token);

    if (!token?.memecoin_address) return;
    // if (!token?.token_quote) return;
    // handleBuyKeys(account?.account, token?.owner, token?.token_quote, Number(amount),)
    const buyResult = await handleBuyCoins(
      account?.account,
      token?.memecoin_address,
      // feltToAddress(BigInt(token?.memecoin_address)),
      Number(amount),
      token?.quote_token,
    );

    if (buyResult) {
      return showToast({title: 'Buy successful', type: 'success'});
    }
  };

  const handleConnect = async () => {
    await onConnect();

    if (!account || !account?.account) return;
  };

  const onHandleAction = async (amountProps?: number) => {
    if (typeAction == 'BUY') {
      await buyCoin(amountProps);
    } else {
      await sellCoin(amountProps);
    }
  };

  const {width} = useWindowDimensions();
  const isMobile = width < 768; // Common breakpoint for mobile

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
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.header}>
        <TextButton style={styles.cancelButton} onPress={navigation.goBack}>
          Back
        </TextButton>
      </SafeAreaView>

      {isMobile ? (
        // Mobile Layout
        <View style={styles.mobileContent}>
          <LaunchActionsForm
            amount={amount}
            onChangeText={(e) => setAmount(Number(e))}
            onBuyPress={buyCoin}
            onSellPress={sellCoin}
            launch={launch}
            setTypeAction={setTypeAction}
            typeAction={typeAction}
            onHandleAction={onHandleAction}
            userShare={share}
            onSetAmount={setAmount}
          />
          <ScrollView style={styles.tabContent}>
            {selectedTab == SelectedTab.LAUNCH_OVERVIEW && launch && (
              <TokenLaunchDetail
                isViewDetailDisabled={true}
                launch={launch}
                isDisabledInfo={true}
                isDisabledForm
              />
            )}
            
            {selectedTab == SelectedTab.LAUNCH_HOLDERS && (
              <>
                <View style={styles.holdersTotal}>
                  <Text weight="medium" fontSize={14}>
                    Total Owner Address: {holdings?.data?.length}
                  </Text>
                </View>
                <TokenHolderDetail holders={holdings} loading={holdingsLoading} />
              </>
            )}

            {selectedTab == SelectedTab.LAUNCH_TX && transactions && (
              <TokenTx tx={transactions} loading={txLoading} />
            )}

            {selectedTab == SelectedTab.TOKEN_STATS && (
              <TokenStats loading={statsLoading} stats={stats} />
            )}

            {selectedTab == SelectedTab.USER_SHARE && launch?.memecoin_address && account?.address ? (
              <UserShare
                loading={sharesLoading}
                shares={shares}
                share={share}
                coinAddress={launch?.memecoin_address}
              />
            ) : (
              !account?.address &&
              selectedTab == SelectedTab.USER_SHARE && 
              launch?.memecoin_address && (
                <View>
                  <Text>Please connect</Text>
                  <Button onPress={handleConnect}>Connect</Button>
                </View>
              )
            )}

            {selectedTab == SelectedTab.LAUNCH_GRAPH && (
              <View>
                <Text>Graph coming soon</Text>
              </View>
            )}
          </ScrollView>
          <View style={styles.mobileTabBar}>
            <TabSelector
              activeTab={selectedTab}
              handleActiveTab={handleTabSelected}
              buttons={TABS_LAUNCH}
              addScreenNavigation={false}
            />
          </View>
        </View>
      ) : (
        // Web Layout (keep existing layout)
        <View style={styles.mainContent}>
          <View style={styles.leftColumn}>
            <LaunchActionsForm
              amount={amount}
              onChangeText={(e) => setAmount(Number(e))}
              onBuyPress={buyCoin}
              onSellPress={sellCoin}
              launch={launch}
              setTypeAction={setTypeAction}
              typeAction={typeAction}
              onHandleAction={onHandleAction}
              userShare={share}
              onSetAmount={setAmount}
            />
          </View>
          <View style={styles.rightColumn}>
            <TabSelector
              activeTab={selectedTab}
              handleActiveTab={handleTabSelected}
              buttons={TABS_LAUNCH}
              addScreenNavigation={false}
            />
            <ScrollView style={styles.tabContent}>
              {selectedTab == SelectedTab.LAUNCH_OVERVIEW && launch && (
                <TokenLaunchDetail
                  isViewDetailDisabled={true}
                  launch={launch}
                  isDisabledInfo={true}
                  isDisabledForm
                />
              )}
              
              {selectedTab == SelectedTab.LAUNCH_HOLDERS && (
                <>
                  <View style={styles.holdersTotal}>
                    <Text weight="medium" fontSize={14}>
                      Total Owner Address: {holdings?.data?.length}
                    </Text>
                  </View>
                  <TokenHolderDetail holders={holdings} loading={holdingsLoading} />
                </>
              )}

              {selectedTab == SelectedTab.LAUNCH_TX && transactions && (
                <TokenTx tx={transactions} loading={txLoading} />
              )}

              {selectedTab == SelectedTab.TOKEN_STATS && (
                <TokenStats loading={statsLoading} stats={stats} />
              )}

              {selectedTab == SelectedTab.USER_SHARE && launch?.memecoin_address && account?.address ? (
                <UserShare
                  loading={sharesLoading}
                  shares={shares}
                  share={share}
                  coinAddress={launch?.memecoin_address}
                />
              ) : (
                !account?.address &&
                selectedTab == SelectedTab.USER_SHARE && 
                launch?.memecoin_address && (
                  <View>
                    <Text>Please connect</Text>
                    <Button onPress={handleConnect}>Connect</Button>
                  </View>
                )
              )}

              {selectedTab == SelectedTab.LAUNCH_GRAPH && (
                <View>
                  <Text>Graph coming soon</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};
