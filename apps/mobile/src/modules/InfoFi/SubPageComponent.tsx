import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useStyles } from '../../hooks';
import stylesheet from './styles';
import { MainStackNavigationProps } from '../../types';
import { useScoreFactoryData } from '../../hooks/infofi/useSubFactoryData';
import Loading from '../../components/Loading';
import { formatUnits } from 'viem';
import { Button, Input } from 'src/components';
import { useNamespace } from 'src/hooks/infofi/useNamespace';
import { useDepositRewards } from 'src/hooks/infofi/useDeposit';
import { useAccount } from '@starknet-react/core';

interface SubPageRouteParams {
  subAddress: string;
}

export const SubPageComponent: React.FC<SubPageRouteParams> = ({ subAddress }) => {
  const styles = useStyles(stylesheet);
  const navigation = useNavigation<MainStackNavigationProps>();
  const route = useRoute();
  const { subDetails, subProfiles, epochProfiles, isLoading, isError, refetch } = useScoreFactoryData(subAddress);
  const [refreshing, setRefreshing] = useState(false);
  const { handleLinkNamespaceFromNostrScore, handleLinkNamespace } = useNamespace();
  const { handleDepositRewards } = useDepositRewards();
  const { account } = useAccount();

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
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{subDetails.name} ({subDetails.main_tag})</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Total AI Score</Text>
            <Text style={styles.overviewValue}>
              {formatDecimal(subDetails.total_ai_score)}
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Total Vote Score</Text>
            <Text style={styles.overviewValue}>
              {formatDecimal(subDetails.total_vote_score)}
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Total Tips</Text>
            <Text style={styles.overviewValue}>
              {formatDecimal(subDetails.total_tips)}
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Total Deposits</Text>
            <Text style={styles.overviewValue}>
              {formatDecimal(subDetails.total_amount_deposit)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Profiles</Text>
        <FlatList
          data={subProfiles}
          renderItem={({ item }) => (
            <View style={styles.activityItem}>
              <Text style={styles.activityText}>Nostr ID: {item.nostr_id}</Text>
              <Text style={styles.activityText}>AI Score: {formatDecimal(item.total_ai_score)}</Text>
              <Text style={styles.activityText}>Vote Score: {formatDecimal(item.total_vote_score)}</Text>
              <Text style={styles.activityDate}>Epoch: {item.epoch_index}</Text>
            </View>
          )}
          keyExtractor={(item) => item.nostr_id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      </View>


      <Button onPress={onRefresh}>
        <Text>Refresh</Text>
      </Button>

      <Button onPress={handleSubscription}>
        <Text>Subscribe</Text>
      </Button>


      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deposit Rewards</Text>
        <Input
          placeholder="Amount to deposit"
          value={amount}
          onChangeText={setAmount}
          style={styles.depositInput}
        />
        {/* <Input
          placeholder="Nostr Address"
          value={nostrAddress}
          onChangeText={setNostrAddress}
          style={styles.depositInput}
        /> */}
        <Button onPress={handleDeposit}>
          <Text>Deposit</Text>
        </Button>
      </View>
    </View>
  );
};
