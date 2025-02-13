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
import { TokenDeployInterface, TokenLaunchInterface } from '../../types/keys';

interface AllKeysComponentInterface {
  isButtonInstantiateEnable?: boolean;
}
export const LaunchpadComponent: React.FC<AllKeysComponentInterface> = ({
  isButtonInstantiateEnable,
}) => {
  const styles = useStyles(stylesheet);
  const account = useAccount();
  const { launches: launchesData, isLoading, isFetching, tokens: tokensData, setTokens: setTokensData, setLaunches: setLaunchesData } = useCombinedTokenData();
  const { data: tokens } = useTokens();
  const { show: showModal } = useTokenCreatedModal();
  const { width } = useWindowDimensions();
  const walletModal = useWalletModal();
  const isDesktop = width >= 1024 ? true : false;
  const { tokens: tokensStore, setTokens, setLaunches, launches: launchesStore } = useLaunchpadStore();
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'liquidity' | 'graduated'>('recent');
  const [tokenOrLaunch, setTokenOrLaunch] = useState<
    'TOKEN' | 'LAUNCH' | 'MY_DASHBOARD' | 'MY_LAUNCH_TOKEN'
  >('LAUNCH');

  const [sortedTokens, setSortedTokens] = useState<TokenDeployInterface[]>([]);
  const [sortedLaunches, setSortedLaunches] = useState<TokenLaunchInterface[]>([]);
  // console.log("launchesStore", launchesStore);
  // console.log("launchesData", launchesData);

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
      case 'graduated':
        sortedLaunches.filter((item) => {
          if (item?.is_liquidity_added) {
            return item;
          }
          return null;
        });
        break;
    }
    console.log("sortedLaunches", sortedLaunches);
    // setTokens(sortedTokens);
    setLaunches(sortedLaunches);
    setSortedLaunches(sortedLaunches);
    // setLaunchesData(sortedLaunches);
  }, [sortBy, launchesData]);


  useEffect(() => {


    console.log("sort tokens by filter")
    console.log('tokens data call', tokens);
    console.log('tokensData', tokensData);
    console.log('tokensStore', tokensStore);

    //  if (!tokensStore) return;
    // const sortedTokens = [...tokensStore];
    if (!tokensData && !tokens?.data) return;
    const sortedTokens = tokensData ? [...tokensData] : [...tokens?.data];
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
    console.log("sortedTokens", sortedTokens);
    setTokens(sortedTokens);
    setTokensData(sortedTokens);
    setSortedTokens(sortedTokens);
    // setLaunches(sortedTokens);
  }, [sortBy, tokens, setTokens, tokensData]);

  useEffect(() => {
    if (tokens?.length != tokensStore?.length) {
      setTokens(tokens?.data);
      setLaunches(launchesData);
      setTokensData(tokens?.data);
    }
    console.log('tokens', tokens);
    console.log('tokensStore', tokensStore);
  }, [tokens, launchesData, tokensStore, account.address, setTokens, setLaunches]);


  // const [isLaunchedView, setIsLaunchedView] = useState(false);

  const isLaunchedView = tokenOrLaunch === "LAUNCH" || tokenOrLaunch === "MY_LAUNCH_TOKEN";

  // const isLauc
  useEffect(() => {
    if (tokenOrLaunch === "LAUNCH") {
      // setIsLaunchedView(true);
      // setIsLaunchedView(true);  
    } else if (tokenOrLaunch === "MY_LAUNCH_TOKEN") {
      // setIsLaunchedView(true);
      // setIsLaunchedView(true);
    } else {
      // setIsLaunchedView(false);
      // setIsLaunchedView(false);
    }

    console.log("isLaunchedView", isLaunchedView);

  }, [tokenOrLaunch]);

  const onConnect = async () => {
    if (!account?.address) {
      walletModal.show();
      // const result = await waitConnection();
      // if (!result) return;
    }
  };

  console.log("isLaunchedView", isLaunchedView);


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
          onPress={() => {
            setTokenOrLaunch('TOKEN')
            if (sortBy === 'liquidity') {
              setSortBy('recent');
            } else if (sortBy === 'graduated') {
              setSortBy('recent');
            }
          }}
        >
          Tokens
        </Button>

        <Button
          style={[styles.toggleButton, tokenOrLaunch == 'MY_DASHBOARD' && styles.activeToggle]}
          textStyle={styles.toggleButtonText}
          onPress={() => {
            setTokenOrLaunch('MY_DASHBOARD')
            if (sortBy === 'liquidity') {
              setSortBy('recent');
            } else if (sortBy === 'graduated') {
              setSortBy('recent');
            }
          }}
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


            {isLaunchedView == true &&

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>

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
                    setSortedLaunches(sorted);
                  }}
                >
                  <Text style={styles.filterOptionText}>Liquidity</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterOption, sortBy === "graduated" && styles.activeFilter]}
                  onPress={() => {
                    setSortBy('graduated');
                    const sorted = [...launchesData].filter((item) => {
                      if (item?.is_liquidity_added) {
                        return item;
                      }
                      return null;
                    });
                    setLaunches(sorted);
                    // setSortedLaunches(sorted);
                  }}
                >
                  <Text style={styles.filterOptionText}>Graduated</Text>

                </TouchableOpacity>

              </View>
            }

          </ScrollView>
        )
        }
      </View >

      {
        isLoading ? (
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
                // data={launchesStore}
                data={sortedLaunches}
                // data={launchesData}
                // data={sortedLaunches && sortedLaunches?.length > 0 ? sortedLaunches : launchesStore && launchesStore?.length > 0 ? launchesStore : launchesData}
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
                // data={tokens?.data}
                data={sortedTokens && sortedTokens?.length > 0 ? sortedTokens : tokensStore && tokensStore?.length > 0 ? tokensStore : tokensData}
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
    </View >
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
  // const { tokens: myTokens, launches: myLaunchs } = useLaunchpadStore();
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

  return renderContent();
}
