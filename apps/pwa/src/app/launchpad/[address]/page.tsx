'use client';

import React, { useEffect, useState } from 'react';
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
// import { Chart } from '@/components/launchpad/Chart';

interface LaunchpadDetailProps {
  params: {
    address: string;
  };
}

export default function LaunchpadDetailPage() {
  const { address } = useParams()

  const { account } = useAccount();
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [launchData, setLaunchData] = useState<any>(null);
  const [holders, setHolders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [userShare, setUserShare] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { handleBuyCoins } = useBuyCoin();
  const { handleSellCoins } = useSellCoin();
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const launchResponse = await fetch(`${process.env.NEXT_PUBLIC_INDEXER_BACKEND_URL}/deploy-launch/stats/${address}`);
        const launchData = await launchResponse.json();
        console.log("launchData", launchData);
        // TODO: Replace with your actual API calls
        // const [launchResponse, holdersResponse, txResponse, chartResponse] = await Promise.all([
        //   fetch(`${process.env.NEXT_PUBLIC_INDEXER_BACKEND_URL}/deploy-launch/${address}`),
        //   fetch(`${process.env.NEXT_PUBLIC_INDEXER_BACKEND_URL}/token-distribution-holders/${address}`),
        //   fetch(`${process.env.NEXT_PUBLIC_INDEXER_BACKEND_URL}/transactions/${address}`),
        //   fetch(`${process.env.NEXT_PUBLIC_INDEXER_BACKEND_URL}/chart/${address}`),
        // ]);
        // const [launchData, holdersData, txData, chartData] = await Promise.all([
        //   launchResponse.json(),
        //   holdersResponse.json(),
        //   txResponse.json(),
        //   chartResponse.json(),
        // ]);
        setLaunchData(launchData?.data?.launch);
        setHolders(launchData?.data?.holders);
        setTransactions(launchData?.data?.transactions);
        // setChartData(chartData);
      } catch (error) {
        console.error('Error fetching launchpad data:', error);
        showToast({ title: 'Error loading data', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchData();
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
    { name: 'Holders', component: <Holders holders={holders} loading={loading} /> },
    { name: 'Transactions', component: <Transactions transactions={transactions} loading={loading} /> },
    // { name: 'Chart', component: <Chart data={chartData} loading={loading} /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer
        toasts={toasts.map(toast => ({
          id: toast.id || Date.now(),
          title: toast.title,
          type: toast.type,
        }))}
        onRemove={removeToast}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Launchpad Details</h1>
          <p className="text-gray-600">Address: {address}</p>
        </div>
        <div className="lg:col-span-1">
          <LaunchActionsForm
            launch={launchData}
            onBuyPress={handleBuy}
            onSellPress={handleSell}
            userShare={userShare}
            loading={actionLoading}
            memecoinAddress={address as string}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {/* Custom Tab Navigation */}
              <div className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.name}
                    onClick={() => setSelectedTab(index)}
                    className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors
                      ${selectedTab === index
                        ? 'bg-white text-blue-700 shadow'
                        : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                      }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="rounded-xl bg-white p-3 shadow-lg">
                {tabs[selectedTab].component}
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
} 