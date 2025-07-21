'use client';

import React, { ReactNode } from 'react';
import { NostrEventBase, formatTimestamp, truncate } from '@/types/nostr';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import ProfileCardOverview from './ProfileCardOverview';
import Image from 'next/image';
import styles from '@/styles/nostr/feed.module.scss';
import { logClickedEvent } from '@/lib/analytics';
interface NostrEventCardBaseProps extends NostrEventBase {
  children?: ReactNode;
  className?: string;
}

export const NostrEventCardBase: React.FC<NostrEventCardBaseProps> = ({
  event,
  profile,
  isLoading = false,
  children,
  className,
}) => {
  const router = useRouter();
  const { showModal } = useUIStore()

  if (isLoading) {
    return (
      <div className="nostr-feed__card--skeleton">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10  rounded-full"></div>
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

  const displayName = profile?.displayName || profile?.name || truncate(event?.pubkey ?? '', 8);
  const timestamp = formatTimestamp(event?.created_at ?? 0);

  return (
    <div
      className={styles.eventCard + ' ' + styles.postEventCard + ' p-2 sm:p-3' + ' ' + className}
    // className="event-card p-2 sm:p-3 rounded-xl border border-gray-200 dark:border-gray-800"
    // className="event-card p-2 sm:p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"

    >
      <header className={"flex items-center mb-2 cursor-pointer rounded-lg p-1 transition"}
        onClick={() => {
          showModal(<>
            <ProfileCardOverview event={event} profile={profile} profilePubkey={event?.pubkey} isLinkToProfile={true} />
          </>
          );
          logClickedEvent('view_profile_modal_event', 'Interaction', 'Button Click', 1);
        }}
      >
        {profile?.picture ? (
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-400 flex-shrink-0">
            <img
              // unoptimized
              // src={encodeURIComponent(profile.picture)}
              src={profile.picture}
              alt={displayName}
              width={40}
              height={40}
              className={styles.profileAvatarImage + ' object-cover w-10 h-10'}
            />
            {/* <Image
              unoptimized
              // src={encodeURIComponent(profile.picture)}
              src={profile.picture}
              alt={displayName}
              width={40}
              height={40}
              className={styles.profileAvatarImage + ' object-cover w-10 h-10'}
            /> */}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 flex-shrink-0">
            <span className="text-lg mono truncate-ellipsis" aria-label="No profile image">🕵️</span>
          </div>
        )}
        <div className="ml-2 min-w-0">
          <div className={styles.username + ' truncate-ellipsis font-semibold'} title={displayName}>{displayName}</div>
          <div className="text-xs flex items-center">
            <time className={styles.timestamp} dateTime={String(event?.created_at)} aria-label="Post timestamp">{timestamp}</time>
            {profile?.nip05 && (
              <span className="ml-1 text-blue-500" aria-label="Verified">✓</span>
            )}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
};

export default NostrEventCardBase; 