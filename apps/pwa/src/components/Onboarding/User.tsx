'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Oauth } from '../profile/Oauth';
import { NostrProfileManagement } from '../Nostr/profile/nostr-profile-management';

export default function User() {
  const router = useRouter();

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col items-center space-y-8 justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <NostrProfileManagement />
        </div>
      </div>
    </div>
  );
}
