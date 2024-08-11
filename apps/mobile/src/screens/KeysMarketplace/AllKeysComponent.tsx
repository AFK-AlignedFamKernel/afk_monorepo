import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View, Text } from 'react-native';
import { Button, Divider, IconButton, Menu } from '../../components';
import { useStyles, useTheme } from '../../hooks';
import stylesheet from './styles';
import { useQueryAllKeys } from '../../hooks/keys/useQueryAllKeys';
import { KeyUser } from '../../components/KeysUser';
import { useKeyModal } from '../../hooks/modals/useKeyModal';
import { KeyModalAction } from '../../modules/KeyModal';
import { useAccount } from '@starknet-react/core';
import { useAuth } from 'afk_nostr_sdk';


interface AllKeysComponentInterface {
  isButtonInstantiateEnable?: boolean
}
export const AllKeysComponent: React.FC<AllKeysComponentInterface> = ({ isButtonInstantiateEnable }) => {
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);
  const account = useAccount()
  const [loading, setLoading] = useState<false | number>(false);
  const queryDataKeys = useQueryAllKeys()
  // console.log("queryDataKeys", queryDataKeys)
  // const keys = useKeysEvents()
  // console.log("keys", keys)
  // const { ndk } = useNostrContext();
  // const navigation = useNavigation<MainStackNavigationProps>();
  const { show: showKeyModal } = useKeyModal();
  const [menuOpen, setMenuOpen] = useState(false);

  const { publicKey } = useAuth()

  return (
    <View style={styles.container}>
      {queryDataKeys?.isLoading && <ActivityIndicator></ActivityIndicator>}

      {isButtonInstantiateEnable &&
        <Button
          onPress={() => {
            showKeyModal(publicKey as any, account?.address, KeyModalAction.INSTANTIATE);
            // setMenuOpen(false);
          }}>
          <Text>Instantiate key</Text>
        </Button>
      }

      <FlatList
        contentContainerStyle={styles.flatListContent}
        data={queryDataKeys.data ?? []}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item) => item.owner}
        renderItem={({ item }) => {
          return (
            <>
              <KeyUser keyUser={item}></KeyUser>
              {/* <View style={styles.tip}>
                <View style={styles.tokenInfo}>
                </View>
                <Divider direction="horizontal" />
              </View> */}
            </>

          );
        }}
        refreshControl={<RefreshControl refreshing={queryDataKeys.isFetching} onRefresh={queryDataKeys.refetch} />}
        // onEndReached={() => queryDataKeys.fetchNextPage()}

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
