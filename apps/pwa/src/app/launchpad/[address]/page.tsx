'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Overview } from '@/components/launchpad/Overview';
import { Holders } from '@/components/launchpad/Holders';
import { Transactions } from '@/components/launchpad/Transactions';
import { LaunchActionsForm } from '@/components/launchpad/LaunchActionsForm';
import { useBuyCoin } from '@/hooks/launchpad/useBuyCoin';
import { useSellCoin } from '@/hooks/launchpad/useSellCoin';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { useAccount } from '@starknet-react/core';
import { Icon } from '@/components/small/icon-component';
import { useUIStore } from '@/store/uiStore';
// import { Chart } from '@/components/launchpad/Chart';

interface LaunchpadDetailProps {
  params: {
    address: string;
  };
}

export default function LaunchpadDetailPage() {
  const { address } = useParams()
  const { showModal } = useUIStore()

  const { account } = useAccount();
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [launchData, setLaunchData] = useState<any>(null);
  const [holders, setHolders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [userShare, setUserShare] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const { handleBuyCoins } = useBuyCoin();
  const { handleSellCoins } = useSellCoin();
  const { toasts, showToast, removeToast } = useToast();

  const [shareUserState, setShareUserState] = useState<any>(null);
  const userShareMemo = useMemo(() => {
    if (holders) {
      let userShare = holders?.find((holder: any) => holder?.owner === account?.address)
      setShareUserState(userShare);
      setUserShare(userShare);
      return userShare;
    }
  }, [holders]);
  const fetchData = async () => {
    try {
      const launchResponse = await fetch(`${process.env.NEXT_PUBLIC_INDEXER_BACKEND_URL}/deploy-launch/stats/${address}`);
      const launchData = await launchResponse.json();
      console.log("launchData", launchData);
      setLaunchData(launchData?.data?.launch);
      setHolders(launchData?.data?.holders);
      setTransactions(launchData?.data?.transactions);
      setChartData(launchData?.data?.chart);
    } catch (error) {
      console.error('Error fetching launchpad data:', error);
      showToast({ title: 'Error loading data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (address) {
      setLoading(true);
      fetchData();
      setLoading(false);
    }
  }, [address, showToast]);

  const handleBuy = async (amount: number) => {
    try {
      setActionLoading(true);
      await handleBuyCoins(
        launchData?.account,
        address as string,
        amount,
        launchData?.quote_token,
      );
      showToast({
        title: 'Successfully bought tokens',
        type: 'success',
      });
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : 'Failed to buy tokens',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSell = async (amount: number) => {
    try {
      setActionLoading(true);
      await handleSellCoins(
        account?.address,
        address as string,
        amount,
        launchData?.quote_token,
      );
      showToast({
        title: 'Successfully sold tokens',
        type: 'success',
      });
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : 'Failed to sell tokens',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { name: 'Overview', component: <Overview data={launchData} /> },
    { name: 'Holders', component: <Holders holders={holders} loading={loading} total_supply={launchData?.total_supply} /> },
    { name: 'Transactions', component: <Transactions transactions={transactions} loading={loading} /> },
    // { name: 'Chart', component: <Chart data={chartData} loading={loading} /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen transition-colors duration-200">
      <ToastContainer
        toasts={toasts.map(toast => ({
          id: toast.id || Date.now(),
          title: toast.title,
          type: toast.type,
        }))}
        onRemove={removeToast}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-end">
          <button onClick={() => {
            fetchData();
          }}>
            <Icon name="RefreshIcon" size={16} className="ml-1" />
            Refresh
          </button>
        </div>
        <div className="lg:col-span-1 mb-8">
          <LaunchActionsForm
            launch={launchData}
            onBuyPress={handleBuy}
            onSellPress={handleSell}
            userShare={userShareMemo}
            loading={actionLoading}
            memecoinAddress={address as string}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <div className="flex space-x-2 rounded-xl p-1.5 dark:bg-gray-800 shadow-sm">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.name}
                    onClick={() => setSelectedTab(index)}
                    className={`w-full rounded-lg py-3 px-4 text-sm font-medium leading-5 transition-all duration-200
                      ${selectedTab === index
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                      }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              <div className="rounded-xl p-6 shadow-lg transition-colors duration-200">
                {tabs[selectedTab].component}
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-4 right-4">
          <button
            onClick={() => {
              showModal(<LaunchActionsForm
                launch={launchData}
                onBuyPress={handleBuy}
                onSellPress={handleSell}
                userShare={userShareMemo}
                loading={actionLoading}
                memecoinAddress={address as string}
              />)
            }}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-500 text-white shadow-lg hover:bg-primary-600 transition-colors duration-200"
          >
            <Icon name="RocketIcon" size={24} color="green-500" />
          </button>
        </div>

      </div>
    </main>
  );
} 