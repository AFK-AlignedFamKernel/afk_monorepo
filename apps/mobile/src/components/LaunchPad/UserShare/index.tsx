import {FlatList, Pressable, View} from 'react-native';

import {useStyles, useWaitConnection} from '../../../hooks';
import {TokenStatsInterface, UserShareInterface} from '../../../types/keys';
import {Text} from '../../Text';
import stylesheet from './styles';
import Loading from '../../Loading';
import {useGetShares} from '../../../hooks/api/indexer/useUserShare';
import {useAccount} from 'wagmi';
import {useEffect, useState} from 'react';
import {useWalletModal} from '../../../hooks/modals';

export type UserShareProps = {
  loading: boolean;
  coinAddress: string;
  shares?: UserShareInterface[];
};

export const UserShare: React.FC<UserShareProps> = ({shares, loading, coinAddress}) => {
  const styles = useStyles(stylesheet);
  const [stats, setStats] = useState<TokenStatsInterface | undefined>();
  const [sharesState, setShares] = useState<UserShareInterface | undefined>();

  const account = useAccount();
  const {
    data: sharesData,
    isLoading: sharesLoading,
    refetch,
  } = useGetShares(coinAddress, account?.address ?? '');

  const waitConnection = useWaitConnection();
  const walletModal = useWalletModal();
  const onConnect = async () => {
    if (!account.address) {
      walletModal.show();

      const result = await waitConnection();
      if (!result) return;
    }
  };
  console.log('sharesData', sharesData);
  useEffect(() => {
    const data = sharesData || [];
    setStats(data);
    setShares(sharesData);
  }, [sharesData]);

  // return loading ? (
  //   <Loading />
  // )
  return (
    <>
      {sharesLoading && <Loading></Loading>}

      {account && !account?.address && (
        <View>
          <Pressable
            onPress={() => {
              onConnect();
            }}
          >
            <Text>Connect</Text>
          </Pressable>
        </View>
      )}
      {sharesState && (
        <View style={[styles.container, styles.borderBottom]}>
          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Total
            </Text>
            <Text fontSize={14}>
              {Number(sharesState?.total_buy) - Number(sharesState?.total_sell)}
            </Text>
          </View>

          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Total sell
            </Text>
            <Text fontSize={14}>{sharesState?.total_sell}</Text>
          </View>
          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Quote amount paid
            </Text>
            <Text fontSize={14}>{sharesState?.quote_amount}</Text>
          </View>
        </View>
      )}

      {/* <FlatList
        data={stats}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (

      )}
        ListEmptyComponent={<View style={{ paddingTop: 40 }}>
          <Text style={{ textAlign: 'center' }}>No user share available</Text>
        </View>
        }
      /> */}
    </>
  );
};
