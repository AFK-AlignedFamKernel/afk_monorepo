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
import { useDepositRewards } from 'src/hooks/infofi/useDeposit';
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
  // console.log("userInfo", userInfo);
  // console.log("profile", profile);
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
