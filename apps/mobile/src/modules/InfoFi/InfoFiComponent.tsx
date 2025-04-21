import { useAccount } from '@starknet-react/core';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { Button } from '../../components';
import Loading from '../../components/Loading';
import { useStyles, useTheme, useWindowDimensions } from '../../hooks';
import { useWalletModal } from '../../hooks/modals';

import stylesheet from './styles';
import { TokenDeployInterface, TokenLaunchInterface } from '../../types/keys';
import { useNavigation } from '@react-navigation/native';
import { MainStackNavigationProps } from 'src/types';
import { useNamespace } from '../../hooks/infofi/useNamespace';
import { useDataInfoMain, useGetEpochState, useGetAllTipUser, useGetAllTipByUser, useOverallState } from 'src/hooks/infofi/useDataInfoMain';
import { UserCard } from './UserCard';
import { useDepositRewards } from 'src/hooks/infofi/useDeposit';
import { Input } from 'src/components/Input';
import { formatUnits } from 'viem';
import { AllSubsComponent } from './AllSub';
import { AfkSubCard } from './afk/AfkSubCard';
import { AfkSubMain } from './afk/AfkSubMain';
interface AllKeysComponentInterface {
  isButtonInstantiateEnable?: boolean;
}

export const InfoFiComponent: React.FC<AllKeysComponentInterface> = ({
  isButtonInstantiateEnable,
}) => {
  const styles = useStyles(stylesheet);
  const { account } = useAccount();
  const { allData, isLoading, isFetching } = useDataInfoMain();
  const { data: allUsers, isLoading: isLoadingUsers } = useGetAllTipUser();
  const { width } = useWindowDimensions();
  const walletModal = useWalletModal();
  const isDesktop = width >= 1024 ? true : false;
  const { theme } = useTheme();
  const navigation = useNavigation<MainStackNavigationProps>();
  const { handleLinkNamespaceFromNostrScore, handleLinkNamespace } = useNamespace();
  const { handleDepositRewards } = useDepositRewards();

  const [isOpenAfkMain, setIsOpenAfkMain] = useState(false);

  const [amount, setAmount] = useState<string>('');
  const [nostrAddress, setNostrAddress] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleSubscription = async () => {
    const resNamespace = await handleLinkNamespace();
    console.log('resNamespace', resNamespace);
  };

  const handleDeposit = async () => {
    await handleDepositRewards({
      nostr_address: nostrAddress,
      vote: 'good',
      is_upvote: true,
      upvote_amount: Number(amount),
      downvote_amount: 0,
      amount: Number(amount),
      amount_token: Number(amount),
    });
  };

  const formatDecimal = (value: any) => {
    if (!value) return '0';
    return formatUnits(BigInt(Math.floor(Number(value) * 1e18)), 18);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Add any refresh logic here
    setRefreshing(false);
  };

  if (isLoading || isLoadingUsers) {
    return (
      <View style={styles.container}>
        <Loading />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>

      <View>
        {isButtonInstantiateEnable && (
          <Button
            onPress={handleSubscription}
            variant="primary"
            style={styles.createTokenButton}
            textStyle={styles.createTokenButtonText}
          >
            <Text>Subscribe to InfoFi</Text>
          </Button>
        )}


        <AfkSubCard subInfo={allData?.aggregations}
          onPress={() => setIsOpenAfkMain(!isOpenAfkMain)}
        ></AfkSubCard>


        {isOpenAfkMain && (
          <AfkSubMain></AfkSubMain>
        )}


        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Total AI Score</Text>
              <Text style={styles.overviewValue}>
                {formatDecimal(allData?.aggregations.total_ai_score)}
              </Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Total Vote Score</Text>
              <Text style={styles.overviewValue}>
                {formatDecimal(allData?.aggregations.total_vote_score)}
              </Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Total Tips</Text>
              <Text style={styles.overviewValue}>
                {formatDecimal(allData?.aggregations.total_tips)}
              </Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Total Deposits</Text>
              <Text style={styles.overviewValue}>
                {formatDecimal(allData?.aggregations.total_amount_deposit)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Epoch States</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {allData?.contract_states[0]?.epochs.map((epoch: any) => (
              <View key={epoch.epoch_index} style={styles.epochCard}>
                <Text style={styles.epochTitle}>Epoch {epoch.epoch_index}</Text>
                <View style={styles.epochStats}>
                  <View style={styles.epochStat}>
                    <Text style={styles.epochStatLabel}>AI Score</Text>
                    <Text style={styles.epochStatValue}>{formatDecimal(epoch.total_ai_score)}</Text>
                  </View>
                  <View style={styles.epochStat}>
                    <Text style={styles.epochStatLabel}>Vote Score</Text>
                    <Text style={styles.epochStatValue}>{formatDecimal(epoch.total_vote_score)}</Text>
                  </View>
                  <View style={styles.epochStat}>
                    <Text style={styles.epochStatLabel}>Deposits</Text>
                    <Text style={styles.epochStatValue}>{formatDecimal(epoch.total_amount_deposit)}</Text>
                  </View>
                  <View style={styles.epochStat}>
                    <Text style={styles.epochStatLabel}>Tips</Text>
                    <Text style={styles.epochStatValue}>{formatDecimal(epoch.total_tip)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deposit Rewards</Text>
          <View style={styles.depositContainer}>
            <Input
              placeholder="Amount to deposit"
              value={amount}
              onChangeText={setAmount}
              style={styles.depositInput}
            />
            <Input
              placeholder="Nostr Address"
              value={nostrAddress}
              onChangeText={setNostrAddress}
              style={styles.depositInput}
            />
            <Button onPress={handleDeposit} style={styles.depositButton}>
              <Text style={styles.depositButtonText}>Deposit Rewards</Text>
            </Button>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Rankings</Text>
          <FlatList
            data={allUsers?.data}
            renderItem={({ item }) => (
              <UserCard
                userInfo={item}
              // userInfo={{
              //   nostr_id: item.nostr_id,
              //   total_ai_score: item.total_ai_score,
              //   total_vote_score: item.total_vote_score,
              //   // starknet_address: item.starknet_address,
              //   // is_add_by_admin: item.is_add_by_admin,
              //   // epoch_states: item.epoch_states
              // }}
              />
            )}
            keyExtractor={(item) => item.nostr_id}
            style={styles.userList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </View> */}

        <AllSubsComponent></AllSubsComponent>
      </View>

    </ScrollView>
  );
};
