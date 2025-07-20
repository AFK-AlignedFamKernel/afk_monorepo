'use client';

import { InfoFiComponent } from '@/components/Nostr/InfoFi';

export default function InfoFiPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-2">
        <div className="mb-2 px-4">
          <h1 className="text-md font-bold">
            InfoFi Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 italic">
            Contest for content creator per topic, view user rankings, and interact with the community.
          </p>
        </div>

        <InfoFiComponent isButtonInstantiateEnable={true} />
      </div>
    </div>
  );
} 