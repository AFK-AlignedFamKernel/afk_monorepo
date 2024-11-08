import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useAccount } from 'wagmi';

import { useStyles, useWaitConnection } from '../../../hooks';
import { useGetShares } from '../../../hooks/api/indexer/useUserShare';
import { useWalletModal } from '../../../hooks/modals';
import { TokenStatsInterface, UserShareInterface } from '../../../types/keys';
import Loading from '../../Loading';
import { Text } from '../../Text';
import stylesheet from './styles';

export type UserShareProps = {
  loading: boolean;
  coinAddress: string;
  shares?: UserShareInterface[];
  share?: UserShareInterface;
};

export const UserShare: React.FC<UserShareProps> = ({ shares, share, loading, coinAddress }) => {
  const styles = useStyles(stylesheet);
  const [stats, setStats] = useState<TokenStatsInterface | undefined>();
  const [sharesState, setShares] = useState<UserShareInterface | undefined>(share);
  console.log('share', share);
  console.log('sharesState', sharesState);

  const account = useAccount();
  const {
    data: sharesData,
    isLoading: sharesLoading,
    refetch,
  } = useGetShares(coinAddress, account?.address);

  const waitConnection = useWaitConnection();
  const walletModal = useWalletModal();
  const onConnect = async () => {
    if (!account.address) {
      walletModal.show();

      const result = await waitConnection();
      if (!result) return;
    }
  };
  // console.log('sharesData', sharesData);
  // useEffect(() => {
  //   setShares(sharesData);
  // }, [sharesData]);

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
      {share ? (
        <View style={[styles.container, styles.borderBottom]}>
          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Amount to claim
            </Text>
            <Text fontSize={14}>
              {Number(share?.total_buy) - Number(share?.total_sell)}
              {/* {Number(share?.total_buy) - Number(share?.total_sell)} */}
            </Text>
          </View>

          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Total sell
            </Text>
            <Text fontSize={14}>{share?.total_sell}</Text>
          </View>

          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Total Buy
            </Text>
            <Text fontSize={14}>{share?.total_buy}</Text>
          </View>
          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Quote amount paid
            </Text>
            <Text fontSize={14}>{sharesState?.quote_amount}</Text>
          </View>
        </View>
      ) :
        sharesState &&
        <View style={[styles.container, styles.borderBottom]}>
          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Total
            </Text>
            <Text fontSize={14}>
              {sharesState?.total ? Number(sharesState?.total) : Number(sharesState?.total_buy) - Number(sharesState?.total_sell)}
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
              Total Buy
            </Text>
            <Text fontSize={14}>{sharesState?.total_buy}</Text>
          </View>
          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Quote amount paid
            </Text>
            <Text fontSize={14}>{sharesState?.quote_amount}</Text>
          </View>
        </View>
      }
      {/* {sharesState && (
        <View style={[styles.container, styles.borderBottom]}>
          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Total
            </Text>
            <Text fontSize={14}>
              {sharesState?.total ? Number(sharesState?.total) : Number(sharesState?.total_buy) - Number(sharesState?.total_sell)}
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
              Total Buy
            </Text>
            <Text fontSize={14}>{sharesState?.total_buy}</Text>
          </View>
          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Quote amount paid
            </Text>
            <Text fontSize={14}>{sharesState?.quote_amount}</Text>
          </View>
        </View>
      )} */}

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
