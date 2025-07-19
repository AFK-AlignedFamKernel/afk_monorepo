'use client';

import { useState } from 'react';
import { formatUnits } from 'viem';
import styles from '@/styles/nostr/infofi-nostr.module.scss';
import { SubCard } from './SubCard';
import { useGetAllSubs } from '@/hooks/infofi';
import { SubPage } from './SubPage';
import { Icon } from '@/components/small/icon-component';

interface SubData {
  contract_address: string;
  name: string;
  about: string;
  main_tag: string;
  total_amount_deposit: string;
}

interface AllSubsComponentProps { }



export const AllSubsComponent: React.FC<AllSubsComponentProps> = () => {
  const [refreshing, setRefreshing] = useState(false);

  // Use real hook instead of mock data
  const { data: allSubs, isLoading, isError, refetch } = useGetAllSubs();


  const [selectedSub, setSelectedSub] = useState<any>(null);
  console.log("allSubs", allSubs);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSubPress = (subAddress: string) => {
    // TODO: Navigate to sub page
    console.log('Navigate to sub:', subAddress);
    setSelectedSub(subAddress);
  };

  const formatDecimal = (value: any) => {
    if (!value) return '0';
    return formatUnits(BigInt(Math.floor(Number(value) * 1e18)), 18);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading subscriptions...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>Error loading subscriptions</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className={styles.epochTitle}>All Subscriptions</h3>
      <div className="space-y-4">

        {!selectedSub && (
          allSubs?.map((sub: any) => (
            <SubCard
              key={sub.contract_address}
              subInfo={{
                contract_address: sub.contract_address,
                name: sub.name,
                about: sub.about,
                main_tag: sub.main_tag,
                total_amount_deposit: sub.total_amount_deposit,
              }}
              onPress={() => handleSubPress(sub)}
            />
          ))
        )}




        {selectedSub && (
          <>
            <button onClick={() => setSelectedSub(null)} className="mb-4">
              <Icon name="BackIcon" size={24} />
            </button>
            <SubPage
              subInfo={selectedSub}
            />
          </>
        )}
      </div>

      {refreshing && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Refreshing...</span>
        </div>
      )}
    </div>
  );
}; 