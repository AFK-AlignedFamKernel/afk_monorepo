import { useAccount } from '@starknet-react/core';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { Button } from '../../components';
import Loading from '../../components/Loading';
import { TokenCard } from '../../components/search/TokenCard';
import { TokenLaunchCard } from '../../components/search/TokenLaunchCard';
import { useStyles, useWindowDimensions } from '../../hooks';
import { useMyLaunchCreated } from '../../hooks/api/indexer/useMyLaunchCreated';
import { useMyTokensCreated } from '../../hooks/api/indexer/useMyTokensCreated';
import { useTokens } from '../../hooks/api/indexer/useTokens';
import { useWalletModal } from '../../hooks/modals';
import { useTokenCreatedModal } from '../../hooks/modals/useTokenCreateModal';
import { useCombinedTokenData } from '../../hooks/useCombinedTokens';
import { useLaunchpadStore } from '../../store/launchpad';
import stylesheet from './styles';

interface AllKeysComponentInterface {
  isButtonInstantiateEnable?: boolean;
}
export const LaunchpadComponent: React.FC<AllKeysComponentInterface> = ({
  isButtonInstantiateEnable,
}) => {
  const styles = useStyles(stylesheet);
  const account = useAccount();
  const { launches: launchesData, isLoading, isFetching } = useCombinedTokenData();
  const { data: tokens } = useTokens();
  console.log('tokens data', tokens);

  const { show: showModal } = useTokenCreatedModal();
  const { width } = useWindowDimensions();
  const walletModal = useWalletModal();
  const isDesktop = width >= 1024 ? true : false;
  const { tokens: tokensStore, setTokens, setLaunches, launches: launchesStore } = useLaunchpadStore();
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'liquidity'>('recent');
  const [tokenOrLaunch, setTokenOrLaunch] = useState<
    'TOKEN' | 'LAUNCH' | 'MY_DASHBOARD' | 'MY_LAUNCH_TOKEN'
  >('LAUNCH');

  console.log("launchesStore", launchesStore);
  console.log("launchesData", launchesData);

  useEffect(() => {
    if (!launchesData) return;
    const sortedLaunches = [...launchesData];
    switch (sortBy) {
      case 'recent':
        sortedLaunches.sort((a, b) => {
          const dateA = new Date(a?.block_timestamp || 0);
          const dateB = new Date(b?.block_timestamp || 0);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'oldest':
        sortedLaunches.sort((a, b) => {
          const dateA = new Date(a?.block_timestamp || 0);
          const dateB = new Date(b?.block_timestamp || 0);
          return dateA.getTime() - dateB.getTime();
        });
        break;
      case 'liquidity':
        sortedLaunches.sort((a, b) => {
          const liquidityA = Number(a?.liquidity_raised || 0);
          const liquidityB = Number(b?.liquidity_raised || 0);
          return liquidityB - liquidityA;
        });
        break;
    }
    // setTokens(sortedTokens);
    setLaunches(sortedLaunches);
  }, [sortBy, launchesData, setTokens, setLaunches]);


  useEffect(() => {
    if (!tokens) return;
    const sortedTokens = [...tokens];
    switch (sortBy) {
      case 'recent':
        sortedTokens.sort((a, b) => {
          const dateA = new Date(a?.block_timestamp || 0);
          const dateB = new Date(b?.block_timestamp || 0);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'oldest':
        sortedTokens.sort((a, b) => {
          const dateA = new Date(a?.block_timestamp || 0);
          const dateB = new Date(b?.block_timestamp || 0);
          return dateA.getTime() - dateB.getTime();
        });
        break;
      // case 'liquidity':
      //   sortedTokens.sort((a, b) => {
      //     const liquidityA = Number(a.liquidity_raised || 0);
      //     const liquidityB = Number(b.liquidity_raised || 0);
      //     return liquidityB - liquidityA;
      //   });
      //   break;
    }
    setTokens(sortedTokens);
    // setLaunches(sortedTokens);
  }, [sortBy, tokens, setTokens]);

  useEffect(() => {
    if (tokens?.length != tokensStore?.length) {
      setTokens(tokens);
      setLaunches(launchesData);
    }
    console.log('tokens', tokens);
    console.log('tokensStore', tokensStore);
  }, [tokens, launchesData, tokensStore, account.address, setTokens, setLaunches]);

  const onConnect = async () => {
    if (!account?.address) {
      walletModal.show();
      // const result = await waitConnection();
      // if (!result) return;
    }
  };

  return (
    <View style={styles.container}>
      {isButtonInstantiateEnable && (
        <Button
          onPress={() => {
            showModal();
          }}
          variant="primary"
          style={styles.createTokenButton}
          textStyle={styles.createTokenButtonText}
        >
          <Text>Create your token</Text>
        </Button>
      )}

      <ScrollView
        style={styles.actionToggle}
        horizontal showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <Button
          style={[styles.toggleButton, tokenOrLaunch == 'LAUNCH' && styles.activeToggle]}
          textStyle={styles.toggleButtonText}
          onPress={() => setTokenOrLaunch('LAUNCH')}
        >
          Launches
        </Button>
        <Button
          style={[styles.toggleButton, tokenOrLaunch == 'TOKEN' && styles.activeToggle]}
          textStyle={styles.toggleButtonText}
          onPress={() => setTokenOrLaunch('TOKEN')}
        >
          Tokens
        </Button>

        <Button
          style={[styles.toggleButton, tokenOrLaunch == 'MY_DASHBOARD' && styles.activeToggle]}
          textStyle={styles.toggleButtonText}
          onPress={() => setTokenOrLaunch('MY_DASHBOARD')}
        >
          My Tokens
        </Button>

        <Button
          style={[styles.toggleButton, tokenOrLaunch == 'MY_LAUNCH_TOKEN' && styles.activeToggle]}
          textStyle={styles.toggleButtonText}
          onPress={() => setTokenOrLaunch('MY_LAUNCH_TOKEN')}
        >
          My Launched Tokens
        </Button>
      </ScrollView>



      <View style={styles.filterContainer}>
        <Button
          style={[styles.filterButton, styles.filterAccordion]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>Filter & Sort</Text>
          <Text>{showFilters ? '▼' : '▶'}</Text>
        </Button>


        {showFilters && (
          <ScrollView
            // style={styles.filterOptions}
            horizontal
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={[styles.filterOption, sortBy === 'recent' && styles.activeFilter]}
              onPress={() => {
                setSortBy('recent');
                const sorted = [...launchesData].sort((a, b) => {
                  const timestampA = a?.block_timestamp || 0;
                  const timestampB = b?.block_timestamp || 0;
                  return Number(timestampB) - Number(timestampA);
                });
                setLaunches(sorted);
              }}
            >
              <Text style={styles.filterOptionText}>Most Recent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterOption, sortBy === 'oldest' && styles.activeFilter]}
              onPress={() => {
                setSortBy('oldest');
                // const sorted = [...launchesData].sort((a, b) => a.block_timestamp - b.block_timestamp);
                const sorted = [...launchesData].sort((a, b) => {
                  const timestampA = a?.block_timestamp || 0;
                  const timestampB = b?.block_timestamp || 0;
                  return Number(timestampA) - Number(timestampB);
                });

                setLaunches(sorted);
              }}
            >
              <Text style={styles.filterOptionText}>Oldest First</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterOption, sortBy === 'liquidity' && styles.activeFilter]}
              onPress={() => {
                setSortBy('liquidity');
                const sorted = [...launchesData].sort((a, b) => {
                  const liqA = a?.liquidity_raised || 0;
                  const liqB = b?.liquidity_raised || 0;
                  return Number(liqB) - Number(liqA);
                });
                setLaunches(sorted);
              }}
            >
              <Text style={styles.filterOptionText}>Highest Liquidity</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {isLoading ? (
        <Loading />
      ) : (

        // <ScrollView
        //   showsVerticalScrollIndicator={false}
        // >

        <>
          {tokenOrLaunch == 'LAUNCH' && (
            <FlatList
              contentContainerStyle={styles.flatListContent}
              // data={launchesData}
              data={launchesStore}
              keyExtractor={(item) => item.token_address}
              key={`flatlist-${isDesktop ? 3 : 1}`}
              numColumns={isDesktop ? 3 : 1}
              renderItem={({ item }) => {
                return <TokenLaunchCard key={item.token_address} token={item} />;
              }}
              refreshControl={<RefreshControl refreshing={isFetching} />}
            />
          )}

          {tokenOrLaunch == 'TOKEN' && (
            <FlatList
              contentContainerStyle={styles.flatListContent}
              data={tokens?.data}
              // data={tokenOrLaunch == "TOKEN" ? tokens: tokens}
              keyExtractor={(item, i) => i.toString()}
              key={`flatlist-${isDesktop ? 3 : 1}`}
              numColumns={isDesktop ? 3 : 1}
              renderItem={({ item, index }) => {
                return <TokenCard key={index} token={item} isTokenOnly={true} />;
              }}
              refreshControl={<RefreshControl refreshing={isFetching} />}
            />
          )}

          {tokenOrLaunch === 'MY_DASHBOARD' && (
            <TokenDashboard
              address={account.address}
              onConnect={onConnect}
              isDesktop={isDesktop}
              isFetching={isFetching}
              tokenOrLaunch={tokenOrLaunch}
            />
          )}

          {tokenOrLaunch === 'MY_LAUNCH_TOKEN' && (
            <TokenDashboard
              address={account.address}
              onConnect={onConnect}
              isDesktop={isDesktop}
              isFetching={isFetching}
              tokenOrLaunch={tokenOrLaunch}
            />
          )}
        </>
        // </ScrollView>

      )}
    </View>
  );
};

export function TokenDashboard({
  tokenOrLaunch,
  isDesktop,
  isFetching,
  address,
  onConnect,
}: {
  tokenOrLaunch: any;
  isDesktop: boolean;
  isFetching: boolean;
  address: any;
  onConnect: () => void;
}) {
  const styles = useStyles(stylesheet);

  const { data: myTokens } = useMyTokensCreated(address);
  const { data: myLaunchs } = useMyLaunchCreated(address);

  const renderContent = () => {
    if (!address) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={[styles.text, { fontSize: 16, marginBottom: 4 }]}>
            Connect wallet to see your tokens
          </Text>
          <Button onPress={onConnect}>Connect Wallet</Button>
        </View>
      );
    }

    const data = tokenOrLaunch === 'MY_DASHBOARD' ? myTokens : myLaunchs;

    if (!data || data?.data?.length === 0) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={[styles.text, { fontSize: 16 }]}>No tokens found</Text>
        </View>
      );
    }

    return (
      <FlatList
        contentContainerStyle={styles.flatListContent}
        data={data?.data}
        keyExtractor={(item, i) => i.toString()}
        key={`flatlist-${isDesktop ? 3 : 1}`}
        numColumns={isDesktop ? 3 : 1}
        renderItem={({ item, index }) => {
          if (tokenOrLaunch === 'MY_DASHBOARD') {
            return <TokenCard key={index} token={item} isTokenOnly={true} />;
          }
          return <TokenLaunchCard key={item.token_address} token={item} />;
        }}
        refreshControl={<RefreshControl refreshing={isFetching} />}
      />
    );
  };

  return <View style={{ marginTop: 14 }}>{renderContent()}</View>;
}
