import { useAccount } from '@starknet-react/core';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { Button } from '../../components';
import Loading from '../../components/Loading';
import { TokenCard } from '../../components/search/TokenCard';
import { TokenLaunchCard } from '../../components/search/TokenLaunchCard';
import { useStyles, useTheme, useWindowDimensions } from '../../hooks';
import { useMyLaunchCreated } from '../../hooks/api/indexer/useMyLaunchCreated';
import { useMyTokensCreated } from '../../hooks/api/indexer/useMyTokensCreated';
import { useTokens } from '../../hooks/api/indexer/useTokens';
import { useWalletModal } from '../../hooks/modals';
import { useTokenCreatedModal } from '../../hooks/modals/useTokenCreateModal';
import { useCombinedTokenData } from '../../hooks/useCombinedTokens';
import { useLaunchpadStore } from '../../store/launchpad';
import stylesheet from './styles';
import { LaunchDataMerged, TokenDeployInterface, TokenLaunchInterface } from '../../types/keys';
import { AddPostIcon } from 'src/assets/icons';
import { useNavigation } from '@react-navigation/native';
import { MainStackNavigationProps } from 'src/types';
import { useNamespace } from '../../hooks/infofi/useNamespace';
import { feltToAddress, NAMESPACE_ADDRESS, NOSTR_FI_SCORING_ADDRESS } from 'common';
import { constants } from 'starknet';
import { useDataInfoMain } from 'src/hooks/infofi/useDataInfoMain';
import { NostrProfileInfoFiInterface } from 'src/types/infofi';
import { useProfile } from 'afk_nostr_sdk';
import { PostCard } from '../PostCard';
import { UserNostrCard } from '../UserNostrCard';
interface AllKeysComponentInterface {
  isButtonInstantiateEnable?: boolean;
  userInfo?: NostrProfileInfoFiInterface
}
export const UserCard: React.FC<AllKeysComponentInterface> = ({
  isButtonInstantiateEnable,
  userInfo
}) => {
  const styles = useStyles(stylesheet);
  const { account } = useAccount();
  const { width } = useWindowDimensions();
  const walletModal = useWalletModal();
  const isDesktop = width >= 1024 ? true : false;

  const {data: profile} = useProfile({publicKey: userInfo?.nostr_id})
  console.log("userInfo", userInfo);
  console.log("profile", profile);
  const { theme } = useTheme();



  return (
    <View style={styles.container}>

      <View>
    

        <UserNostrCard profile={profile} profileIndexer={userInfo} />
      </View>

      {/* {isButtonInstantiateEnable && (
        <Button
          onPress={handleSubscription}
          variant="primary"
          style={styles.createTokenButton}
          textStyle={styles.createTokenButtonText}
        >
          <Text>Subscribe to InfoFi</Text>
        </Button>
      )} */}
   
      {/* <Pressable
        style={styles.createPostButton}
        onPress={() => {
          showModal();
        }}
      >
        <AddPostIcon width={72} height={72} color={theme.colors.primary} />
      </Pressable> */}

    </View >
  );
};

export function TokenDashboard({
  tokenOrLaunch,
  isDesktop,
  isFetching,
  address,
  onConnect,
  sortBy,
}: {
  tokenOrLaunch: any;
  isDesktop: boolean;
  isFetching: boolean;
  address: any;
  onConnect: () => void;
  sortBy?: string;
}) {
  const styles = useStyles(stylesheet);

  const { data: myTokens } = useMyTokensCreated(address);
  const { data: myLaunchs } = useMyLaunchCreated(address);

  const [sortedMyTokens, setSortedMyTokens] = useState<TokenDeployInterface[]>([]);
  const [sortedMyLaunchs, setSortedMyLaunchs] = useState<LaunchDataMerged[]>([]);

  // console.log("sortBy", sortBy);
  // console.log("sortedMyTokens", sortedMyTokens);
  // console.log("sortedMyLaunchs", sortedMyLaunchs);
  useEffect(() => {
    // console.log("myTokens", myTokens);
    // console.log("myLaunchs", myLaunchs);

    if (!myTokens || !myLaunchs) return;

    const sortedMyTokens = myTokens?.data;
    const sortedMyLaunchs = myLaunchs?.data;


    if (tokenOrLaunch == 'MY_DASHBOARD') {
      switch (sortBy) {
        case 'recent':
          sortedMyTokens.sort((a: any, b: any) => {
            const dateA = new Date(a?.block_timestamp || 0);
            const dateB = new Date(b?.block_timestamp || 0);
            return dateB.getTime() - dateA.getTime();
          });
          break;
        case 'oldest':
          sortedMyTokens.sort((a: any, b: any) => {
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
    } else if (tokenOrLaunch == 'MY_LAUNCH_TOKEN') {
      switch (sortBy) {
        case 'recent':
          sortedMyLaunchs.sort((a: any, b: any) => {
            const dateA = new Date(a?.block_timestamp || 0);
            const dateB = new Date(b?.block_timestamp || 0);
            return dateB.getTime() - dateA.getTime();
          });
          break;
        case 'oldest':
          sortedMyLaunchs.sort((a: any, b: any) => {
            const dateA = new Date(a?.block_timestamp || 0);
            const dateB = new Date(b?.block_timestamp || 0);
            return dateA.getTime() - dateB.getTime();
          });
          break;
      }
    }

    setSortedMyTokens(sortedMyTokens);
    setSortedMyLaunchs(sortedMyLaunchs);
  }, [myTokens, myLaunchs, sortBy, tokenOrLaunch]);
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

    // const data = tokenOrLaunch === 'MY_DASHBOARD' ? myTokens : myLaunchs;
    const data = tokenOrLaunch === 'MY_DASHBOARD' ? sortedMyTokens : sortedMyLaunchs;

    if (!data || data?.length === 0) {
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

    if (tokenOrLaunch == 'MY_DASHBOARD') {
      return (
        <FlatList
          contentContainerStyle={styles.flatListContent}
          data={sortedMyTokens}
          keyExtractor={(item, i) => i.toString()}
          key={`flatlist-${isDesktop ? 2 : 1}`}
          numColumns={isDesktop ? 2 : 1}
          renderItem={({ item, index }) => {
            return <TokenCard key={index} token={item} isTokenOnly={true} />;
          }}
          refreshControl={<RefreshControl refreshing={isFetching} />}
        />
      );
    } else {
      return (
        <FlatList
          contentContainerStyle={styles.flatListContent}
          data={sortedMyLaunchs}
          keyExtractor={(item, i) => i.toString()}
          key={`flatlist-${isDesktop ? 2 : 1}`}
          numColumns={isDesktop ? 2 : 1}
          renderItem={({ item, index }) => {
            return <TokenLaunchCard key={index} token={item} />;
          }}
          // renderItem={({ item, index }) => {

          //   return <TokenLaunchCard key={item?.token_address} token={item} />;
          // }}
          refreshControl={<RefreshControl refreshing={isFetching} />}
        />
      );

    }


  };

  return renderContent();
}
