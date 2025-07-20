'use client';

import { useState } from 'react';
import { useAccount } from '@starknet-react/core';
import { formatUnits } from 'viem';
import styles from '@/styles/nostr/infofi-nostr.module.scss';
import { AllSubsComponent } from './AllSubsComponent';
import { useDataInfoMain, useGetAllTipUser, useNamespace } from '@/hooks/infofi';
import CryptoLoading from '@/components/small/crypto-loading';
import { AfkSubCard } from './AfkSubCard';
import { AfkSubMain } from './AfkSubMain';
// import { UserCard } from './UserCard';
// import { useProfile } from 'afk_nostr_sdk';

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



export const InfoFiComponent: React.FC<InfoFiComponentProps> = ({
  isButtonInstantiateEnable = true,
}) => {
  const { account } = useAccount();
  const [isOpenAfkMain, setIsOpenAfkMain] = useState(false);

  const [isViewAfkCardMain, setIsViewAfkCardMain] = useState(false);
  // Use real hooks instead of mock data
  const { allData, isLoading: isLoadingData, isError: isErrorData } = useDataInfoMain();
  const { data: allUsers, isLoading: isLoadingUsers, isError: isErrorUsers } = useGetAllTipUser();
  const { handleLinkNamespace, isLinkingNamespace } = useNamespace();

  const isLoading = isLoadingData || isLoadingUsers;
  const isError = isErrorData || isErrorUsers;

  const handleSubscription = async () => {
    try {
      await handleLinkNamespace();
    } catch (error) {
      console.error('Subscription failed:', error);
    }
  };

  const formatDecimal = (value: any) => {
    if (!value) return '0';
    return formatUnits(BigInt(Math.floor(Number(value) * 1e18)), 18);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <CryptoLoading />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>Error loading InfoFi data</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainCard}>
        {/* {isButtonInstantiateEnable && (
          <button
            onClick={handleSubscription}
            className={styles.subscribeButton}
            disabled={isLinkingNamespace}
          >
            {isLinkingNamespace ? 'Subscribing...' : 'Subscribe to InfoFi'}
          </button>
        )} */}

        <AfkSubCard
          subInfo={allData?.aggregations}
          onPress={() => {
            setIsViewAfkCardMain(!isViewAfkCardMain);
            setIsOpenAfkMain(!isOpenAfkMain);
          }}
        />

        {isOpenAfkMain && (
          <AfkSubMain
            allData={allData}
            allUsers={allUsers}
            isButtonInstantiateEnable={isButtonInstantiateEnable}
          />
        )}

        <h3 className={styles.epochTitle}>All contests</h3>

        <AllSubsComponent
          onHandleSubPress={() => setIsOpenAfkMain(!isOpenAfkMain)}
        />
      </div>
    </div>
  );
}; 