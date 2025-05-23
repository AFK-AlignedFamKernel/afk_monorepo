'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const PumpComponent = dynamic(() => import('@/components/launchpad/PumpComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
  ),
});

export default function LaunchpadPage() {
  return (
    <div className="p-4">
      <PumpComponent />
    </div>
  );
} 