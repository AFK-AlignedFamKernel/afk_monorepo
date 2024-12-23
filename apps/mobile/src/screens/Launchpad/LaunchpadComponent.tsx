import {useAccount} from '@starknet-react/core';
import {useAuth} from 'afk_nostr_sdk';
import {useEffect, useState} from 'react';
import {FlatList, RefreshControl, ScrollView, Text, View} from 'react-native';

import {Button} from '../../components';
import Loading from '../../components/Loading';
import {TokenCard} from '../../components/search/TokenCard';
import {TokenLaunchCard} from '../../components/search/TokenLaunchCard';
import {useStyles, useTheme, useWindowDimensions} from '../../hooks';
import {useMyTokensCreated} from '../../hooks/api/indexer/useMyTokensCreated';
import {useTokens} from '../../hooks/api/indexer/useTokens';
import {useTokenCreatedModal} from '../../hooks/modals/useTokenCreateModal';
import {useCombinedTokenData} from '../../hooks/useCombinedTokens';
import {FormLaunchToken} from '../../modules/LaunchTokenPump/FormLaunchToken';
import {useLaunchpadStore} from '../../store/launchpad';
import stylesheet from './styles';
import {useMyLaunchCreated} from '../../hooks/api/indexer/useMyLaunchCreated';

interface AllKeysComponentInterface {
  isButtonInstantiateEnable?: boolean;
}
export const LaunchpadComponent: React.FC<AllKeysComponentInterface> = ({
  isButtonInstantiateEnable,
}) => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);
  const account = useAccount();
  const {launches: launchesData, isLoading, isFetching} = useCombinedTokenData();
  const {data: tokens, isLoading: isLoadingTokens, isFetching: isFetchingTokens} = useTokens();
  console.log('tokens data', tokens);
  const {
    data: myTokens,
    isLoading: isLoadingMyTokens,
    isFetching: isFetchingMyTokens,
  } = useMyTokensCreated(account?.address);
  const {
    data: myLaunchs,
    isLoading: isLoadingMyLaunchs,
    isFetching: isFetchingMyLaunchs,
  } = useMyLaunchCreated(account?.address);

  const {show: showModal} = useTokenCreatedModal();
  const {publicKey} = useAuth();
  const {width} = useWindowDimensions();
  const isDesktop = width >= 1024 ? true : false;
  const {
    tokens: tokensStore,
    setTokens,
    setLaunches,
    launches,
    setMyTokens,
    setMyLaunches,
  } = useLaunchpadStore();

  const [tokenOrLaunch, setTokenOrLaunch] = useState<'TOKEN' | 'LAUNCH' | 'MY_DASHBOARD'>('LAUNCH');

  useEffect(() => {
    if (tokens?.length != tokensStore?.length) {
      setTokens(tokens);
      setLaunches(launchesData);
    }

    if (myLaunchs) {
      setMyLaunches(myLaunchs);
    }

    if (myTokens) {
      setMyTokens(myTokens);
    }
    console.log('tokens', tokens);
    console.log('tokensStore', tokensStore);
  }, [tokens, launchesData, tokensStore, account?.address]);

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

      <ScrollView style={styles.actionToggle} horizontal showsHorizontalScrollIndicator={false}>
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
      </ScrollView>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          {tokenOrLaunch == 'LAUNCH' && (
            <FlatList
              contentContainerStyle={styles.flatListContent}
              data={launchesData}
              keyExtractor={(item) => item.token_address}
              key={`flatlist-${isDesktop ? 3 : 1}`}
              numColumns={isDesktop ? 3 : 1}
              renderItem={({item}) => {
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
              renderItem={({item, index}) => {
                return <TokenCard key={index} token={item} isTokenOnly={true} />;
              }}
              refreshControl={<RefreshControl refreshing={isFetching} />}
            />
          )}

          {tokenOrLaunch == 'MY_DASHBOARD' && (
            <>
              <Text>My tokens deployed</Text>
              <FlatList
                contentContainerStyle={styles.flatListContent}
                data={myTokens}
                keyExtractor={(item, i) => i.toString()}
                key={`flatlist-${isDesktop ? 3 : 1}`}
                numColumns={isDesktop ? 3 : 1}
                renderItem={({item, index}) => {
                  return <TokenCard key={index} token={item} isTokenOnly={true} />;
                }}
                refreshControl={<RefreshControl refreshing={isFetching} />}
              />
            </>
          )}
        </>
      )}
    </View>
  );
};
