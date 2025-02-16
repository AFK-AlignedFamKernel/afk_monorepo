import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useStyles, useWaitConnection } from '../../../hooks';
import { useGetShares } from '../../../hooks/api/indexer/useUserShare';
import { useToast, useWalletModal } from '../../../hooks/modals';
import { TokenStatsInterface, UserShareInterface } from '../../../types/keys';
import Loading from '../../Loading';
import { Text } from '../../Text';
import stylesheet from './styles';
import { Button } from '../../Button';
import { useClaimToken } from '../../../hooks/launchpad/useClaimToken';
import { useAccount } from '@starknet-react/core';

export type UserShareProps = {
  loading: boolean;
  coinAddress: string;
  shares?: UserShareInterface[];
  share?: { data: UserShareInterface };
};

export const UserShare: React.FC<UserShareProps> = ({ shares, share, loading, coinAddress }) => {
  const styles = useStyles(stylesheet);
  const [stats, setStats] = useState<TokenStatsInterface | undefined>();

  // const { signer } = useAccount();
  const { claimToken } = useClaimToken();
  const account = useAccount();
  const {
    data: sharesData,
    isLoading: sharesLoading,
    refetch,
  } = useGetShares(coinAddress, account?.address);

  const {showToast} = useToast();
  const waitConnection = useWaitConnection();
  const walletModal = useWalletModal();
  const onConnect = async () => {
    if (!account.address) {
      walletModal.show();

      const result = await waitConnection();
      if (!result) return;
    }
  };

  const handleClaim = async () => {
    console.log('Claiming...');

    if (!account.address || !account || !account.account) {
      await onConnect();
      return;
    }

    const tx = await claimToken(account?.account, {coin_address: coinAddress});

    if(tx) {
      showToast({
        title: 'Claimed',
        type:"success"
      });
    } else {
      showToast({
        title: 'Error when claiming',
        type:"error"
      });

    }
  }
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

      {share?.data ? (
        <View style={[styles.container, styles.borderBottom]}>
          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Amount to claim
            </Text>
            <Text fontSize={14}>
              {Number(share?.data?.amount_owned)}
            </Text>
          </View>
          <View>
            <Button onPress={() => handleClaim()}>Claim</Button>
          </View>
          {/* <View style={styles.borderBottom}>
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
          </View> */}
        </View>
      ) : (

        <View style={[styles.container, styles.borderBottom]}>
          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Total
            </Text>
            <Text fontSize={14}>
              0.00
              {/* {sharesState?.total
                  ? Number(sharesState?.total)
                  : Number(sharesState?.total_buy) - Number(sharesState?.total_sell)} */}
            </Text>
          </View>

          {/* <View style={styles.borderBottom}>
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
            </View> */}
        </View>

      )}
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
