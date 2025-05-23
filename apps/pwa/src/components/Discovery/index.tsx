'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TrendItem {
  title: string;
  category: string;
}

interface TopicItem {
  title: string;
  category: string;
}

const trends: TrendItem[] = [
  { title: 'AI advancements', category: 'Trending in Technology' },
  { title: 'Election debates', category: 'Trending in Politics' },
  { title: 'Movie releases', category: 'Trending in Entertainment' },
  { title: 'Football highlights', category: 'Trending in Sports' },
  { title: 'Market updates', category: 'Trending in Business' },
];

const topics: TopicItem[] = [
  { title: 'Artificial Intelligence', category: 'Technology' },
  { title: 'Global Affairs', category: 'Politics' },
  { title: 'Film Industry', category: 'Entertainment' },
  { title: 'Soccer', category: 'Sports' },
  { title: 'Financial Markets', category: 'Business' },
];

const DiscoveryComponent = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('For you');

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-gray-900 justify-between group/design-root overflow-x-hidden">
      <div>
        <div className="flex items-center bg-gray-900 p-4 pb-2 justify-between">
          <button 
            onClick={handleBack}
            className="text-gray-200 flex size-12 shrink-0 items-center hover:text-gray-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
            </svg>
          </button>
          <h2 className="text-gray-200 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">Explore</h2>
        </div>

        <div className="px-4 py-3">
          <label className="flex flex-col min-w-40 h-12 w-full">
            <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
              <div className="text-gray-400 flex border-none bg-gray-800 items-center justify-center pl-4 rounded-l-lg border-r-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                </svg>
              </div>
              <input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-200 focus:outline-0 focus:ring-0 border-none bg-gray-800 focus:border-none h-full placeholder:text-gray-400 px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
              />
            </div>
          </label>
        </div>

        <div className="pb-3">
          <div className="flex border-b border-gray-700 px-4 gap-8">
            {['For you', 'Trending', 'News', 'Sports'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 ${
                  activeTab === tab
                    ? 'border-b-blue-500 text-gray-200'
                    : 'border-b-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <p className="text-sm font-bold leading-normal tracking-[0.015em]">{tab}</p>
              </button>
            ))}
          </div>
        </div>

        <h3 className="text-gray-200 text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Trends for you</h3>
        {trends.map((trend, index) => (
          <div key={index} className="flex items-center gap-4 bg-gray-900 px-4 min-h-[72px] py-2 justify-between hover:bg-gray-800 transition-colors">
            <div className="flex flex-col justify-center">
              <p className="text-gray-200 text-base font-medium leading-normal line-clamp-1">{trend.title}</p>
              <p className="text-gray-400 text-sm font-normal leading-normal line-clamp-2">{trend.category}</p>
            </div>
            <div className="shrink-0">
              <div className="text-gray-400 flex size-7 items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
                </svg>
              </div>
            </div>
          </div>
        ))}

        <h3 className="text-gray-200 text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Topics to follow</h3>
        {topics.map((topic, index) => (
          <div key={index} className="flex items-center gap-4 bg-gray-900 px-4 min-h-[72px] py-2 justify-between hover:bg-gray-800 transition-colors">
            <div className="flex flex-col justify-center">
              <p className="text-gray-200 text-base font-medium leading-normal line-clamp-1">{topic.title}</p>
              <p className="text-gray-400 text-sm font-normal leading-normal line-clamp-2">{topic.category}</p>
            </div>
            <div className="shrink-0">
              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-gray-800 text-gray-200 text-sm font-medium leading-normal w-fit hover:bg-gray-700 transition-colors">
                <span className="truncate">Follow</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default DiscoveryComponent;
