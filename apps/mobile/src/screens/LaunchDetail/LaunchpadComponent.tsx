import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View, Text, Platform, Dimensions } from 'react-native';
import { Button, Divider, IconButton, Menu } from '../../components';
import { useStyles, useTheme, useWindowDimensions } from '../../hooks';
import stylesheet from './styles';
import { useQueryAllKeys } from '../../hooks/keys/useQueryAllKeys';
import { KeyCardUser } from '../../components/KeyCardUser';
import { useKeyModal } from '../../hooks/modals/useKeyModal';
import { KeyModalAction } from '../../modules/KeyModal';
import { useAccount } from '@starknet-react/core';
import { useAuth } from 'afk_nostr_sdk';
import { TokenLaunchCard } from '../../components/TokenLaunchCard';
import { useQueryAllCoins } from '../../hooks/launchpad/useQueryAllCoins';
import { useQueryAllLaunch } from '../../hooks/launchpad/useQueryAllLaunch';
import { FormLaunchToken } from '../../modules/LaunchTokenPump/FormLaunchToken';
import { useGetTokenLaunch } from '../../hooks/api/indexer/useLaunchTokens';
import { useDimensions } from '../../hooks/useWindowDimensions';


interface AllKeysComponentInterface {
  isButtonInstantiateEnable?: boolean
}
export const LaunchpadComponent: React.FC<AllKeysComponentInterface> = ({ isButtonInstantiateEnable }) => {
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);
  const account = useAccount()
  const [loading, setLoading] = useState<false | number>(false);
  const queryDataLaunch = useQueryAllLaunch()
  const { show: showKeyModal } = useKeyModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: launchs } = useGetTokenLaunch()
  // console.log("Launchs", launchs)
  const { publicKey } = useAuth()
  // const width = Dimensions.get("window").width
  // const isDesktop = width >= 1024
  const {width} = useWindowDimensions()
  console.log("width",width)
  // const isDesktop = width>= 1024 ? true : false
  // console.log("isDesktop",isDesktop)

  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024
  }, [dimensions]); // Adjust based on your breakpoint for desktop
  return (
    <View style={styles.container}>
      {queryDataLaunch?.isLoading && <ActivityIndicator></ActivityIndicator>}

      {isButtonInstantiateEnable &&
        <Button
          onPress={() => {
            // showKeyModal(publicKey as any, account?.address, KeyModalAction.INSTANTIATE);
            setMenuOpen(!menuOpen);
          }}>
          <Text>Create token</Text>
        </Button>
      }
      {menuOpen &&
        <FormLaunchToken></FormLaunchToken>
      }

      <FlatList
        contentContainerStyle={styles.flatListContent}
        data={queryDataLaunch.data ?? []}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        // keyExtractor={(item, i) => {`${item.owner + item?.created_at}`}}
        keyExtractor={(item, i) => i.toString()}
        numColumns={isDesktop ? 3 : 1}
        renderItem={({ item, index }) => {
          // console.log("key item", item)
          return (
              <TokenLaunchCard key={index} launch={item}></TokenLaunchCard>
          );
        }}
        refreshControl={<RefreshControl refreshing={queryDataLaunch.isFetching} onRefresh={queryDataLaunch.refetch} />}
      // onEndReached={() => queryDataLaunch.fetchNextPage()}

      />

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
