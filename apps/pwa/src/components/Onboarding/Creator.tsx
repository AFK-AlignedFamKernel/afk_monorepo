'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Oauth } from '../profile/Oauth';
import { useAppStore } from '@/store/app';
import SocialAccountLinker from '../profile/SocialAccountLinker';
import SupabaseLink from '../profile/SupabaseLink';
import CreatorProfile from '../profile/CreatorProfile';
import Accordion from '../small/accordion';
import ManageCreatorProfile from '../profile/ManageCreatorProfile';
import NostrCreateAccountComponent from '../Nostr/login/NostrCreateAccount';

export default function Creator() {
  const router = useRouter();
  const { user, session, setUser, setSession, isInitialFetchUser, setIsInitialFetchUser } = useAppStore();

  return (
    <div className="sm:max-w-md w-full mx-auto">
      <div 
      // className="flex flex-col items-center space-y-8 justify-center p-4 sm:p-8"
      >

        {!user && !session &&
          <div>
            <NostrCreateAccountComponent />
            <p>Connect your to manage your creator profile</p>
            <p className='text-sm italic'>You can create your creator profile later</p>
            <Oauth />
          </div>
        }

        {user && session &&
          <div>

            {/* <SupabaseLink /> */}
            <NostrCreateAccountComponent />
            <p className='text-sm italic'>You can create your creator profile later</p>
            <ManageCreatorProfile />
            {/* <Accordion className='w-full' items={[
              { title: 'Link your social accounts', content: <SocialAccountLinker /> },
              { title: 'Manage your creator profile', content: <ManageCreatorProfile /> }
            ]} /> */}

            {/* <SocialAccountLinker /> */}
          </div>
        }
      </div>
    </div>
  );
}
