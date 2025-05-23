'use client';
import React from 'react';
// import { TokenCreateForm } from '@/components/launchpad/TokenCreateForm';
import { useUIStore } from '@/store/uiStore';
import dynamic from 'next/dynamic';

const TokenCreateForm = dynamic(() => import('@/components/launchpad/TokenCreateForm').then(mod => mod.TokenCreateForm), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function CreateTokenPage() {

  const {showToast} = useUIStore();
 
  const handleSuccess = () => {
    console.log('Token created successfully');
    showToast({message: 'Token created successfully', type: 'success'});
  };
  const handleError = (error: Error) => {
    showToast({message: 'Error creating token', type: 'error'});
    console.error('Error creating token:', error);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-shade-900 dark:text-shade-100 mb-8">
          Create New Token
        </h1>
        <div className="rounded-lg shadow p-6">
          <TokenCreateForm
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      </div>
    </div>
  );
} 