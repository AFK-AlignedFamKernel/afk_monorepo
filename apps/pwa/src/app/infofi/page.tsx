'use client';

import { InfoFiComponent } from '@/components/Nostr/InfoFi';

export default function InfoFiPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            InfoFi Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your InfoFi subscriptions, view user rankings, and interact with the community.
          </p>
        </div>
        
        <InfoFiComponent isButtonInstantiateEnable={true} />
      </div>
    </div>
  );
} 