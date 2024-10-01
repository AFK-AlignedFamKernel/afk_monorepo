import { useAccount, useProvider } from '@starknet-react/core';
import { useNostrContext } from 'afk_nostr_sdk';
import { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TextButton } from '../../components';
import { LaunchActionsForm } from '../../components/LaunchActionsForm';
import { TokenLaunchDetail } from '../../components/pump/TokenLaunchDetail';
import TabSelector from '../../components/TabSelector';
import { useStyles, useTheme, useWaitConnection } from '../../hooks';
import { useGetHoldings } from '../../hooks/api/indexer/useHoldings';
import { useBuyCoinByQuoteAmount } from '../../hooks/launchpad/useBuyCoinByQuoteAmount';
import { useDataCoins } from '../../hooks/launchpad/useDataCoins';
import { useSellCoin } from '../../hooks/launchpad/useSellCoin';
import { useWalletModal } from '../../hooks/modals';
import { LaunchDetailScreenProps } from '../../types';
import {
  TokenDeployInterface,
  TokenHoldersInterface,
  TokenStatsInterface,
  TokenTxInterface,
} from '../../types/keys';
import { SelectedTab, TABS_LAUNCH } from '../../types/tab';
import { feltToAddress } from '../../utils/format';
import stylesheet from './styles';
import { TokenTx } from '../../components/LaunchPad/TokenTx';
import { useGetTransactions } from '../../hooks/api/indexer/useTransactions';
import { TokenHolderDetail } from '../../components/LaunchPad/TokenHolderDetail';
import { TokenStats } from '../../components/LaunchPad/TokenStats';
import { useGetTokenStats } from '../../hooks/api/indexer/useTokenStats';
import { useGetDeployToken } from '../../hooks/api/indexer/useDeployToken';

export const LaunchDetail: React.FC<LaunchDetailScreenProps> = ({ navigation, route }) => {
  // export const LaunchDetails: React.FC<LaunchpadScreenProps> = () => {
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);
  const [loading, setLoading] = useState<false | number>(false);
  const { ndk } = useNostrContext();
  const { provider } = useProvider();
  const account = useAccount();


  const { coinAddress, launch: launchParams } = route.params;

  const [tokens, setTokens] = useState<TokenDeployInterface[] | undefined>([]);

  const [holdings, setHoldings] = useState<TokenHoldersInterface | undefined>();
  const [transactions, setTransaction] = useState<TokenTxInterface[]>([]);
  const [stats, setStats] = useState<TokenStatsInterface | undefined>();


  const [firstLoadDone, setFirstLoadDone] = useState(false);
  // const navigation = useNavigation<MainStackNavigationProps>();


  const { data: deployTokenData, isLoading: deployLoading } = useGetDeployToken(coinAddress)

  const { data: holdingsData, isLoading: holdingsLoading } = useGetHoldings(coinAddress);
  const { data: transactionData, isLoading: txLoading } = useGetTransactions(
    coinAddress,
    '',
  );
  const { data: statsData, isLoading: statsLoading } = useGetTokenStats(coinAddress);

  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(
    SelectedTab.LAUNCH_OVERVIEW,
  );
  const { handleSellCoins } = useSellCoin();
  // const { handleBuyKeys } = useBuyKeys()
  const { handleBuyCoins } = useBuyCoinByQuoteAmount();
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
    if (deployTokenData && deployTokenData.data) {
      setTokens(deployTokenData.data)
    }
  }, [deployTokenData]);



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

  // const onConnect = async () => {
  //   if (!account.address) {
  //     walletModal.show();

  //     const result = await waitConnection();
  //     if (!result) return;
  //   }
  // };

  // const sellKeys = async () => {
  //   if (!amount) return;

  //   await onConnect();
  //   if (!account || !account?.account) return;

  //   if (!launch?.owner) return;

  //   if (!launch?.token_quote) return;

  //   handleSellCoins(
  //     account?.account,
  //     feltToAddress(BigInt(launch?.memecoin_address)),
  //     Number(amount),
  //     launch?.token_quote,
  //     undefined,
  //   );
  // };

  // const buyCoin = async () => {
  //   if (!amount) return;

  //   await onConnect();

  //   if (!account || !account?.account) return;

  //   if (!launch?.owner) return;

  //   if (!launch?.token_quote) return;
  //   // handleBuyKeys(account?.account, launch?.owner, launch?.token_quote, Number(amount),)
  //   handleBuyCoins(
  //     account?.account,
  //     feltToAddress(BigInt(launch?.memecoin_address)),
  //     Number(amount),
  //     launch?.token_quote,
  //   );
  // };



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
          onBuyPress={() => {}}
          onSellPress={() => {}}
        ></LaunchActionsForm>

        <TabSelector
          activeTab={selectedTab}
          handleActiveTab={handleTabSelected}
          buttons={TABS_LAUNCH}
          addScreenNavigation={false}
        ></TabSelector>

        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.overview}>
          <ScrollView>
            {selectedTab == SelectedTab.LAUNCH_OVERVIEW && tokens && (
              <>


                <FlatList
                  contentContainerStyle={styles.flatListContent}
                  data={tokens}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  // keyExtractor={(item, i) => {`${item.owner + item?.created_at}`}}
                  keyExtractor={(item, i) => i.toString()}
                  // numColumns={isDesktop ? 3 : 1}
                  renderItem={({ item, index }) => {
                    return <TokenLaunchDetail isViewDetailDisabled={true} launch={item} />
                  }}

                // onEndReached={() => queryDataLaunch.fetchNextPage()}
                />


              </>
            )}
            {selectedTab == SelectedTab.LAUNCH_HOLDERS && (
              <>
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
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};
