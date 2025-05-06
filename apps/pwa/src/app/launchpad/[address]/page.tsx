'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Overview } from '@/components/launchpad/Overview';
import { Holders } from '@/components/launchpad/Holders';
import { Transactions } from '@/components/launchpad/Transactions';
// import { Chart } from '@/components/launchpad/Chart';

interface LaunchpadDetailProps {
  params: {
    address: string;
  };
}

export default function LaunchpadDetailPage({ params }: LaunchpadDetailProps) {
  const { address } = params;
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [launchData, setLaunchData] = useState<any>(null);
  const [holders, setHolders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const launchResponse = await fetch(`${process.env.NEXT_PUBLIC_INDEXER_BACKEND_URL}/deploy-launch/stats/${address}`);
        const launchData = await launchResponse.json();
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
        console.log(launchData);
        setLaunchData(launchData);
        // setHolders(holdersData);
        // setTransactions(txData);
        // setChartData(chartData);
      } catch (error) {
        console.error('Error fetching launchpad data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchData();
    }
  }, [address]);

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Launchpad Details</h1>
        <p className="text-gray-600">Address: {address}</p>
      </div>

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
  );
} 