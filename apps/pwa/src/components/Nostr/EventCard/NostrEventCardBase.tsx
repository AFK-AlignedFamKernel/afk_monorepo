'use client';

import React, { ReactNode } from 'react';
import { NostrEventBase, formatTimestamp, truncate } from '@/types/nostr';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import ProfileCardOverview from './ProfileCardOverview';
interface NostrEventCardBaseProps extends NostrEventBase {
  children?: ReactNode;
}

export const NostrEventCardBase: React.FC<NostrEventCardBaseProps> = ({
  event,
  profile,
  isLoading = false,
  children,
}) => {
  const router = useRouter();
  const {showModal} = useUIStore()

  if (isLoading) {
    return (
      <div className="nostr-feed__card--skeleton">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          <div className="ml-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mt-1"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const displayName = profile?.displayName || profile?.name || truncate(event.pubkey, 8);
  const timestamp = formatTimestamp(event.created_at || 0);

  return (
    <div className="event-card">
      <div className="flex items-center mb-8"
        onClick={() => {
          showModal(<>
            <ProfileCardOverview event={event} profile={profile} profilePubkey={event.pubkey} isLinkToProfile={true} />
          </>)
          // router.push(`/nostr/profile/${event.pubkey}`)
        }}
      >
        {profile?.picture ? (
          <div className="w-30 h-30 rounded-full overflow-hidden">
            <img
              src={profile.picture}
              alt={displayName}
              width={50}
              height={50}
              // className="object-cover w-10 h-10"
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-gray-600 dark:text-gray-300 text-sm">
              {displayName.substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <div className="ml-2">
          <div className="font-medium text-gray-900 dark:text-white">{displayName}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <span className="text-xs">{timestamp}</span>
            {profile?.nip05 && (
              <span className="ml-1 text-blue-500">✓</span>
            )}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
};

export default NostrEventCardBase; 