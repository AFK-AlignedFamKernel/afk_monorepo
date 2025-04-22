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
import { UserNostrCard } from './UserNostrCard';
import { useDepositRewards } from 'src/hooks/infofi/useDeposit';
import { formatUnits } from 'viem';

interface AllKeysComponentInterface {
  isButtonInstantiateEnable?: boolean;
  userInfo?: NostrProfileInfoFiInterface;
  contractAddress?: string;
}

export const UserCard: React.FC<AllKeysComponentInterface> = ({
  isButtonInstantiateEnable,
  userInfo,
  contractAddress
}) => {
  const styles = useStyles(stylesheet);
  const { theme } = useTheme();
  const { account } = useAccount();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024 ? true : false;

  const { data: profile } = useProfile({ publicKey: userInfo?.nostr_id });

  const formatDecimal = (value: any) => {
    if (!value) return '0';
    return formatUnits(BigInt(Math.floor(Number(value) * 1e18)), 18);
  };

  return (
    <View style={[styles.container, {
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      marginVertical: 8,
      marginHorizontal: 16,
      padding: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3
    }]}>
      <View style={[styles.card, {
        borderRadius: 12,
        overflow: 'hidden'
      }]}>
        <UserNostrCard 
          profile={profile} 
          profileIndexer={userInfo} 
          contractAddressSubScore={contractAddress} 
        />
        
        {/* <View style={[styles.statsContainer, {
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: theme.colors.cardBorder,
          marginTop: 12
        }]}>
          <View style={[styles.statItem, {
            alignItems: 'center',
            flex: 1
          }]}>
            <Text style={[styles.statLabel, {
              fontSize: 14,
              color: theme.colors.text,
              opacity: 0.7,
              marginBottom: 4
            }]}>AI Score</Text>
            <Text style={[styles.statValue, {
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.primary
            }]}>{formatDecimal(userInfo?.total_ai_score)}</Text>
          </View>
          
          <View style={[styles.statItem, {
            alignItems: 'center',
            flex: 1,
            borderLeftWidth: 1,
            borderLeftColor: theme.colors.inputBorder
          }]}>
            <Text style={[styles.statLabel, {
              fontSize: 14,
              color: theme.colors.text,
              opacity: 0.7,
              marginBottom: 4
            }]}>Vote Score</Text>
            <Text style={[styles.statValue, {
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.primary
            }]}>{formatDecimal(userInfo?.total_vote_score)}</Text>
          </View>
        </View> */}

        {isButtonInstantiateEnable && (
          <Button
            onPress={() => {}}
            style={[styles.subscribeButton, {
              backgroundColor: theme.colors.primary,
              paddingVertical: 12,
              borderRadius: 8,
              marginTop: 16
            }]}
          >
            <Text style={[styles.subscribeButtonText, {
              color: theme.colors.white,
              fontSize: 16,
              fontWeight: '600',
              textAlign: 'center'
            }]}>Subscribe</Text>
          </Button>
        )}
      </View>
    </View>
  );
};
