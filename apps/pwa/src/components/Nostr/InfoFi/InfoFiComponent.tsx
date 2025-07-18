'use client';

import { useState } from 'react';
import { useAccount } from '@starknet-react/core';
import { useProfile } from 'afk_nostr_sdk';
import { formatUnits } from 'viem';
import styles from '@/styles/nostr/infofi-nostr.module.scss';
import { AfkSubCard } from './AfkSubCard';
import { AfkSubMain } from './AfkSubMain';
import { AllSubsComponent } from './AllSubsComponent';
import { UserCard } from './UserCard';

interface InfoFiComponentProps {
  isButtonInstantiateEnable?: boolean;
}

// Mock data interfaces - replace with actual API calls
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

// Mock data - replace with actual API calls
const mockData: InfoFiData = {
  aggregations: {
    total_ai_score: "1000000000000000000000", // 1000 tokens
    total_vote_score: "500000000000000000000", // 500 tokens
    total_tips: "200000000000000000000", // 200 tokens
    total_amount_deposit: "300000000000000000000", // 300 tokens
    name: "AFK",
    main_tag: "cypherpunk",
    contract_address: "0x1234567890abcdef"
  },
  contract_states: [{
    epochs: [
      {
        epoch_index: 1,
        total_ai_score: "100000000000000000000",
        total_vote_score: "50000000000000000000",
        total_amount_deposit: "30000000000000000000",
        total_tip: "20000000000000000000"
      },
      {
        epoch_index: 2,
        total_ai_score: "200000000000000000000",
        total_vote_score: "100000000000000000000",
        total_amount_deposit: "60000000000000000000",
        total_tip: "40000000000000000000"
      }
    ]
  }]
};

const mockUsers: UserData[] = [
  {
    nostr_id: "npub1example1",
    total_ai_score: "100000000000000000000",
    total_vote_score: "50000000000000000000"
  },
  {
    nostr_id: "npub1example2",
    total_ai_score: "200000000000000000000",
    total_vote_score: "100000000000000000000"
  }
];

export const InfoFiComponent: React.FC<InfoFiComponentProps> = ({
  isButtonInstantiateEnable = true,
}) => {
  const { account } = useAccount();
  const [isOpenAfkMain, setIsOpenAfkMain] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock loading state - replace with actual API calls
  const allData = mockData;
  const allUsers = { data: mockUsers };

  const handleSubscription = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement actual subscription logic
      console.log('Subscribing to InfoFi...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Subscription successful');
    } catch (error) {
      console.error('Subscription failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDecimal = (value: any) => {
    if (!value) return '0';
    return formatUnits(BigInt(Math.floor(Number(value) * 1e18)), 18);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainCard}>
        {isButtonInstantiateEnable && (
          <button
            onClick={handleSubscription}
            className={styles.subscribeButton}
            disabled={isLoading}
          >
            {isLoading ? 'Subscribing...' : 'Subscribe to InfoFi'}
          </button>
        )}

        <AfkSubCard
          subInfo={allData?.aggregations}
          onPress={() => setIsOpenAfkMain(!isOpenAfkMain)}
        />

        {isOpenAfkMain && (
          <AfkSubMain
            allData={allData}
            allUsers={allUsers}
            isButtonInstantiateEnable={isButtonInstantiateEnable}
          />
        )}

        <AllSubsComponent />
      </div>
    </div>
  );
}; 