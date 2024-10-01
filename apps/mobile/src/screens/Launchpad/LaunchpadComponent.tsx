import { useAccount } from '@starknet-react/core';
import { useAuth } from 'afk_nostr_sdk';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';

import { Button } from '../../components';
import { TokenLaunchCard } from '../../components/search/TokenLaunchCard';
import { useStyles, useTheme, useWindowDimensions } from '../../hooks';
import { useQueryAllLaunch } from '../../hooks/launchpad/useQueryAllLaunch';
import { useKeyModal } from '../../hooks/modals/useKeyModal';
import { useTokenCreatedModal } from '../../hooks/modals/useTokenCreateModal';
import { FormLaunchToken } from '../../modules/LaunchTokenPump/FormLaunchToken';
import stylesheet from './styles';
import { useGetDeployToken } from '../../hooks/api/indexer/useDeployToken';
import { TokenDeployInterface } from '../../types/keys';
import Loading from '../../components/Loading';

interface AllKeysComponentInterface {
  isButtonInstantiateEnable?: boolean;
}
export const LaunchpadComponent: React.FC<AllKeysComponentInterface> = ({
  isButtonInstantiateEnable,
}) => {
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);
  const account = useAccount();
  const [loading, setLoading] = useState<false | number>(false);
  const [deployTokens, setDeployTokens] = useState<TokenDeployInterface[]>([])
  const queryDataLaunch = useQueryAllLaunch();


  const { data: deployTokenData, isLoading: deployLoading } = useGetDeployToken();


  const { show: showKeyModal } = useKeyModal();
  const { show: showModal } = useTokenCreatedModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const { publicKey } = useAuth();
  const { width } = useWindowDimensions();
  console.log('width', width);
  const isDesktop = width >= 1024 ? true : false;
  console.log('isDesktop', isDesktop);


  useEffect(() => {
    setDeployTokens(deployTokenData?.data)
  }, [deployTokenData])


  return (
    <View style={styles.container}>
      {queryDataLaunch?.isLoading && <ActivityIndicator></ActivityIndicator>}

      {isButtonInstantiateEnable && (
        <Button
          onPress={() => {
            // showKeyModal(publicKey as any, account?.address, KeyModalAction.INSTANTIATE);
            showModal();
            // setMenuOpen(!menuOpen);
          }}
        >
          <Text>Create token</Text>
        </Button>
      )}
      {menuOpen && <FormLaunchToken></FormLaunchToken>}

      {
        deployLoading ? <Loading /> : <FlatList
          contentContainerStyle={styles.flatListContent}
          data={deployTokens}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyExtractor={(item, i) => i.toString()}
          key={`flatlist-${isDesktop ? 3 : 1}`}
          numColumns={isDesktop ? 3 : 1}
          renderItem={({ item, index }) => {
            return <TokenLaunchCard key={index} token={item}></TokenLaunchCard>;
          }}
          refreshControl={
            <RefreshControl
              refreshing={queryDataLaunch.isFetching}
              onRefresh={queryDataLaunch.refetch}
            />
          }
        // onEndReached={() => queryDataLaunch.fetchNextPage()}
        />
      }

      {/* <FlatList
        contentContainerStyle={styles.flatListContent}
        data={keys.data ?? []}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item) => item.event.transaction_hash}
        renderItem={({ item }) => {
          return (
            <View style={styles.tip}>
              <View style={styles.tokenInfo}>
                <View style={styles.token}>
            
                </View>

              </View>

              <Divider direction="horizontal" />
            </View>
          );
        }}
        refreshControl={<RefreshControl refreshing={keys.isFetching} onRefresh={keys.refetch} />}
      /> */}
    </View>
  );
};
