'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { TokenCreateForm } from '@/components/launchpad/TokenCreateForm';

export default function CreateTokenPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/launchpad');
  };

  const handleError = (error: Error) => {
    console.error('Error creating token:', error);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-shade-900 dark:text-shade-100 mb-8">
          Create New Token
        </h1>
        <div className="bg-white dark:bg-shade-800 rounded-lg shadow p-6">
          <TokenCreateForm
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      </div>
    </div>
  );
} 