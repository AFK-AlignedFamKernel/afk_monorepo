'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Oauth } from '../profile/Oauth';
import { useAppStore } from '@/store/app';
import SocialAccountLinker from '../profile/SocialAccountLinker';
import SupabaseLink from '../profile/SupabaseLink';
import CreatorProfile from '../profile/CreatorProfile';

export default function Brand() {
  const router = useRouter();
  const { user, session, setUser, setSession, isInitialFetchUser, setIsInitialFetchUser } = useAppStore();

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col items-center space-y-8 justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <Oauth />

          {user && session &&
            <>
              <SupabaseLink />

              <CreatorProfile />
              {/* <SocialAccountLinker /> */}
            </>
          }
        </div>
      </div>
    </div>
  );
}
