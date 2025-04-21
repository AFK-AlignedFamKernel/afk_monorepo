import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useStyles } from '../../../hooks';
import stylesheet from './styles';
import { MainStackNavigationProps } from '../../../types';
import { useScoreFactoryData } from '../../../hooks/infofi/useSubFactoryData';
import Loading from '../../../components/Loading';
import { formatUnits } from 'viem';
import { Button, Input } from 'src/components';
import { useNamespace } from 'src/hooks/infofi/useNamespace';
import { useDepositRewards } from 'src/hooks/infofi/useDeposit';
import { useAccount } from '@starknet-react/core';
import { useGetAllTipUser } from 'src/hooks/infofi/useDataInfoMain';
import { UserCard } from '../UserCard';
import { useTheme } from 'src/hooks';

interface SubPageRouteParams {
  subAddress: string;
}

export const SubPageComponent: React.FC<SubPageRouteParams> = ({ subAddress }) => {
  const styles = useStyles(stylesheet);
  const { theme } = useTheme();
  const navigation = useNavigation<MainStackNavigationProps>();
  const route = useRoute();
  const { subDetails, subProfiles, epochProfiles, isLoading, isError, refetch } = useScoreFactoryData(subAddress);
  const [refreshing, setRefreshing] = useState(false);
  const { handleLinkNamespaceFromNostrScore, handleLinkNamespace } = useNamespace();
  const { handleDepositRewards } = useDepositRewards();
  const { account } = useAccount();
  const { data: allUsers, isLoading: isLoadingUsers } = useGetAllTipUser();

  const [amount, setAmount] = useState<string>('');
  const [nostrAddress, setNostrAddress] = useState('');

  const handleSubscription = async () => {
    const resNamespace = await handleLinkNamespace();
    console.log('resNamespace', resNamespace);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDecimal = (value: any) => {
    if (!value) return '0';
    return formatUnits(BigInt(Math.floor(Number(value) * 1e18)), 18);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading sub information</Text>
      </View>
    );
  }

  const handleDeposit = async () => {
    await handleDepositRewards({
      nostr_address: nostrAddress,
      vote: 'good',
      is_upvote: true,
      upvote_amount: Number(amount),
      downvote_amount: 0,
      amount: Number(amount),
      amount_token: Number(amount),
    },
      subAddress as string
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>{subDetails.name}</Text>
        <Text style={styles.subtitle}>{subDetails.main_tag}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total AI Score</Text>
          <Text style={styles.statValue}>
            {formatDecimal(subDetails.total_ai_score)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Vote Score</Text>
          <Text style={styles.statValue}>
            {formatDecimal(subDetails.total_vote_score)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Tips</Text>
          <Text style={styles.statValue}>
            {formatDecimal(subDetails.total_tips)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Deposits</Text>
          <Text style={styles.statValue}>
            {formatDecimal(subDetails.total_amount_deposit)}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Button 
          onPress={handleSubscription}
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>Subscribe</Text>
        </Button>

        <View style={styles.depositSection}>
          <Text style={styles.sectionTitle}>Deposit Rewards</Text>
          <Input
            placeholder="Amount to deposit"
            value={amount}
            onChangeText={setAmount}
            style={styles.depositInput}
            keyboardType="numeric"
          />
          <Button 
            onPress={handleDeposit}
            style={styles.depositButton}
          >
            <Text style={styles.depositButtonText}>Deposit</Text>
          </Button>
        </View>
      </View>

      <View style={styles.usersSection}>
        <Text style={styles.sectionTitle}>User Profiles</Text>
        <FlatList
          data={allUsers?.data}
          renderItem={({ item }) => (
            <UserCard
              userInfo={item}
              contractAddress={subAddress}
            />
          )}
          keyExtractor={(item) => item.nostr_id}
          style={styles.userList}
        />
      </View>
    </ScrollView>
  );
};
