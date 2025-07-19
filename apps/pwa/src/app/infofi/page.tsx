'use client';

import { InfoFiComponent } from '@/components/Nostr/InfoFi';

export default function InfoFiPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8">
        <div className="mb-8 p-4">
          <h1 className="text-3xl font-bold dark:text-white mb-2">
            InfoFi Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Contest for content creator per topic, view user rankings, and interact with the community.
          </p>
        </div>

        <InfoFiComponent isButtonInstantiateEnable={true} />
      </div>
    </div>
  );
} 