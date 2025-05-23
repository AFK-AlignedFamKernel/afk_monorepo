'use client';

import { useState } from 'react';
import Link from 'next/link';

interface KeywordData {
  keyword: string;
  volume: number;
  difficulty: number;
  relevance: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const MetricCard = ({ title, value, subtitle, trend }: MetricCardProps) => (
  <div className="bg-white rounded-xl p-5 shadow-sm">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className="text-3xl font-semibold text-gray-800 mt-1">{value}</p>
    {trend ? (
      <p className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'} mt-1 flex items-center`}>
        <span className="material-icons text-sm mr-1">
          {trend.isPositive ? 'arrow_upward' : 'arrow_downward'}
        </span>
        {trend.value}
      </p>
    ) : (
      <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
    )}
  </div>
);

const ProgressBar = ({ value }: { value: number }) => (
  <div className="flex items-center">
    <div className="bg-gray-200 rounded-full w-24 mr-2 h-2">
      <div 
        className="bg-indigo-600 rounded-full h-2" 
        style={{ width: `${value}%` }}
      />
    </div>
    <span>{value}/100</span>
  </div>
);

const keywordData: KeywordData[] = [
  {
    keyword: 'Newsletter platform for creators',
    volume: 1200,
    difficulty: 35,
    relevance: 95
  },
  {
    keyword: 'Best X integration for e-commerce',
    volume: 850,
    difficulty: 20,
    relevance: 92
  },
  {
    keyword: 'Tiktok ad spend optimization',
    volume: 1500,
    difficulty: 60,
    relevance: 88
  },
  {
    keyword: 'Nostr client for iOS developers',
    volume: 400,
    difficulty: 45,
    relevance: 75
  },
  {
    keyword: 'Affordable Google Ads management',
    volume: 2200,
    difficulty: 70,
    relevance: 90
  }
];

const AnalyticsKeyword = () => {
  const [activeTab, setActiveTab] = useState('Long-tail Recommendations');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">Keyword Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive analysis of branded and non-branded keywords, including recommendations from various sources.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <MetricCard 
            title="Total Keywords"
            value={42}
            subtitle=""
            trend={{ value: '+10% from previous month', isPositive: true }}
          />
          <MetricCard 
            title="Avg. Monthly Traffic"
            value="14,580"
            subtitle=""
            trend={{ value: '+15% from previous month', isPositive: true }}
          />
          <MetricCard 
            title="Avg. Keyword Difficulty"
            value="36"
            subtitle="Medium Competition"
          />
          <MetricCard 
            title="Long-tail Opportunities"
            value={20}
            subtitle="High-potential keywords"
          />
        </div>

        <div className="mb-6 md:mb-8">
          <div className="flex border-b border-gray-200 space-x-2">
            {['Overview', 'Long-tail Recommendations', 'Existing Keywords'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-lg font-medium cursor-pointer transition-colors ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg mb-6 md:mb-8">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Newsletter platform for creators</h2>
            <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
              Close <span className="material-icons text-lg ml-1">open_in_new</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-700 font-medium mb-1">Search Volume</p>
              <p className="text-2xl font-bold text-blue-800">1200</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs text-green-700 font-medium mb-1">Difficulty</p>
              <p className="text-2xl font-bold text-green-800">35<span className="text-lg text-green-600">/100</span></p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-xs text-yellow-700 font-medium mb-1">Relevance</p>
              <p className="text-2xl font-bold text-yellow-800">95%</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-700 mb-2">Content Opportunities:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 pl-2">
              <li>Create in-depth guide targeting "Newsletter platform for creators"</li>
              <li>Develop case studies showing results</li>
              <li>Create comparison content with competitors</li>
              <li>Build landing page optimized for this term</li>
            </ul>
          </div>

          <div>
            <h3 className="text-md font-semibold text-gray-700 mb-2">Recommendation:</h3>
            <p className="text-sm text-gray-600">
              This keyword has medium competition with good search volume. Consider creating content around this term as a priority.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3 md:mb-0">Long-tail Keyword Recommendations</h2>
            <div className="relative w-full md:w-auto">
              <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
              <input
                className="pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Search keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-xs uppercase tracking-wider text-left">Keyword</th>
                  <th className="py-3 px-4 text-xs uppercase tracking-wider text-left">Est. Volume</th>
                  <th className="py-3 px-4 text-xs uppercase tracking-wider text-left">Difficulty</th>
                  <th className="py-3 px-4 text-xs uppercase tracking-wider text-left">Relevance</th>
                  <th className="py-3 px-4 text-xs uppercase tracking-wider text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {keywordData.map((item, index) => (
                  <tr key={index}>
                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.keyword}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{item.volume}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                      <ProgressBar value={item.difficulty} />
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{item.relevance}%</td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <Link 
                        href="#" 
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center"
                      >
                        View Details <span className="material-icons text-md ml-1">arrow_forward</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
              View all recommendations <span className="material-icons text-lg ml-1">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsKeyword;