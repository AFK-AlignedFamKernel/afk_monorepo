import {useAccount} from '@starknet-react/core';
import {useAuth} from 'afk_nostr_sdk';
import {useState} from 'react';
import {ActivityIndicator, Dimensions, FlatList, RefreshControl, Text, View} from 'react-native';

import {Button} from '../../components';
import {KeyCardUser} from '../../components/KeyCardUser';
import {useStyles, useTheme} from '../../hooks';
import {useQueryAllKeys} from '../../hooks/keys/useQueryAllKeys';
import {useKeyModal} from '../../hooks/modals/useKeyModal';
import {KeyModalAction} from '../../modules/KeyModal';
import stylesheet from './styles';

interface AllKeysComponentInterface {
  isButtonInstantiateEnable?: boolean;
}
export const AllKeysComponent: React.FC<AllKeysComponentInterface> = ({
  isButtonInstantiateEnable,
}) => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);
  const account = useAccount();
  const [loading, setLoading] = useState<false | number>(false);
  const queryDataKeys = useQueryAllKeys();
  const {show: showKeyModal} = useKeyModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const {publicKey} = useAuth();
  const width = Dimensions.get('window').width;
  const isDesktop = width >= 1024;

  return (
    <View style={styles.container}>
      {queryDataKeys?.isLoading && <ActivityIndicator></ActivityIndicator>}

      <View style={styles.buttonContainer}>
      {isButtonInstantiateEnable && (
         <Button onPress={() => {
            showKeyModal(publicKey as any, account?.address, KeyModalAction.INSTANTIATE);
            // setMenuOpen(false);
          }}>
           <Text>Instantiate key</Text>
        </Button>
      )}
      </View>

      <FlatList
        contentContainerStyle={styles.flatListContent}
        data={queryDataKeys.data ?? []}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        // keyExtractor={(item, i) => {`${item.owner + item?.created_at}`}}
        keyExtractor={(item, i) => i.toString()}
        numColumns={isDesktop ? 2 : 1}
        renderItem={({item}) => {
          // console.log("key item", item)
          return (
            <>
              <KeyCardUser keyUser={item}></KeyCardUser>
              {/* <View style={styles.tip}>
                <View style={styles.tokenInfo}>
                </View>
                <Divider direction="horizontal" />
              </View> */}
            </>
          );
        }}
        refreshControl={
          <RefreshControl refreshing={queryDataKeys.isFetching} onRefresh={queryDataKeys.refetch} />
        }
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
