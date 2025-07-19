'use client';

import { useState } from 'react';
import { useAccount } from '@starknet-react/core';
import { formatUnits } from 'viem';
import styles from '@/styles/nostr/infofi-nostr.module.scss';
import { UserCard } from './UserCard';
import { useNamespace, useDepositRewards } from '@/hooks/infofi';

interface AggregationsData {
  total_ai_score?: string;
  total_vote_score?: string;
  total_tips?: string;
  total_amount_deposit?: string;
  name?: string;
  main_tag?: string;
  contract_address?: string;
}

interface ContractState {
  epochs: Array<{
    epoch_index: number;
    total_ai_score: string;
    total_vote_score: string;
    total_amount_deposit: string;
    total_tip: string;
  }>;
}

interface UserData {
  nostr_id: string;
  total_ai_score: string;
  total_vote_score: string;
  starknet_address?: string;
  is_add_by_admin?: boolean;
  epoch_states?: any[];
}

interface InfoFiData {
  aggregations: AggregationsData;
  contract_states: ContractState[];
}

interface AfkSubMainProps {
  allData: InfoFiData;
  allUsers: { data: UserData[] };
  isButtonInstantiateEnable?: boolean;
}

export const AfkSubMain: React.FC<AfkSubMainProps> = ({
  allData,
  allUsers,
  isButtonInstantiateEnable = true,
}) => {
  const { account } = useAccount();
  const [amount, setAmount] = useState<string>('');
  const [nostrAddress, setNostrAddress] = useState<string>('');
  const { handleLinkNamespace, isLinkingNamespace } = useNamespace();
  const { handleDepositRewards, isDepositing } = useDepositRewards();

  const handleSubscription = async () => {
    try {
      await handleLinkNamespace();
    } catch (error) {
      console.error('Subscription failed:', error);
    }
  };

  const handleDeposit = async () => {
    try {
      await handleDepositRewards({
        nostr_address: nostrAddress,
        vote: 'good',
        is_upvote: true,
        upvote_amount: amount,
        downvote_amount: '0',
        amount: amount,
        amount_token: amount,
      });
      setAmount('');
      setNostrAddress('');
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  const formatDecimal = (value: any) => {
    if (!value) return '0';
    return formatUnits(BigInt(Math.floor(Number(value) * 1e18)), 18);
  };

  return (
    <div className="mt-6 space-y-6">
              {isButtonInstantiateEnable && (
          <button
            onClick={handleSubscription}
            className={styles.subscribeButton}
            disabled={isLinkingNamespace}
          >
            {isLinkingNamespace ? 'Subscribing...' : 'Subscribe to InfoFi'}
          </button>
        )}

      {/* Overview Section */}
      <div className={styles.epochSection}>
        <h3 className={styles.epochTitle}>Overview</h3>
        <div className={styles.overviewGrid}>
          <div className={styles.overviewItem}>
            <span className={styles.overviewLabel}>Total AI Score</span>
            <div className={styles.overviewValue}>
              {formatDecimal(allData?.aggregations.total_ai_score)}
            </div>
          </div>
          <div className={styles.overviewItem}>
            <span className={styles.overviewLabel}>Total Vote Score</span>
            <div className={styles.overviewValue}>
              {formatDecimal(allData?.aggregations.total_vote_score)}
            </div>
          </div>
          <div className={styles.overviewItem}>
            <span className={styles.overviewLabel}>Total Tips</span>
            <div className={styles.overviewValue}>
              {formatDecimal(allData?.aggregations.total_tips)}
            </div>
          </div>
          <div className={styles.overviewItem}>
            <span className={styles.overviewLabel}>Total Deposits</span>
            <div className={styles.overviewValue}>
              {formatDecimal(allData?.aggregations.total_amount_deposit)}
            </div>
          </div>
        </div>
      </div>

      {/* Epoch States Section */}
      <div className={styles.epochSection}>
        <h3 className={styles.epochTitle}>Epoch States</h3>
        <div className={styles.epochScroll}>
          {allData?.contract_states[0]?.epochs.map((epoch) => (
            <div key={epoch.epoch_index} className={styles.epochCard}>
              <h4 className={styles.epochCardTitle}>Epoch {epoch.epoch_index}</h4>
              <div className={styles.epochStats}>
                <div className={styles.epochStat}>
                  <span className={styles.epochStatLabel}>AI Score</span>
                  <div className={styles.epochStatValue}>
                    {formatDecimal(epoch.total_ai_score)}
                  </div>
                </div>
                <div className={styles.epochStat}>
                  <span className={styles.epochStatLabel}>Vote Score</span>
                  <div className={styles.epochStatValue}>
                    {formatDecimal(epoch.total_vote_score)}
                  </div>
                </div>
                <div className={styles.epochStat}>
                  <span className={styles.epochStatLabel}>Deposits</span>
                  <div className={styles.epochStatValue}>
                    {formatDecimal(epoch.total_amount_deposit)}
                  </div>
                </div>
                <div className={styles.epochStat}>
                  <span className={styles.epochStatLabel}>Tips</span>
                  <div className={styles.epochStatValue}>
                    {formatDecimal(epoch.total_tip)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deposit Section */}
      <div className={styles.depositSection}>
        <h3 className={styles.epochTitle}>Deposit Rewards</h3>
        <div className={styles.depositContainer}>
          <input
            type="number"
            placeholder="Amount to deposit"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.depositInput}
          />
          <input
            type="text"
            placeholder="Nostr Address"
            value={nostrAddress}
            onChange={(e) => setNostrAddress(e.target.value)}
            className={styles.depositInput}
          />
                      <button
              onClick={handleDeposit}
              className={styles.depositButton}
              disabled={isDepositing || !amount}
            >
              {isDepositing ? 'Depositing...' : 'Deposit Rewards'}
            </button>
        </div>
      </div>

      {/* User Rankings Section */}
      <div className={styles.epochSection}>
        <h3 className={styles.epochTitle}>User Rankings</h3>
        <div className="space-y-4">
          {allUsers?.data?.map((user) => (
            <UserCard
              key={user.nostr_id}
              userInfo={user}
              isButtonInstantiateEnable={isButtonInstantiateEnable}
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 