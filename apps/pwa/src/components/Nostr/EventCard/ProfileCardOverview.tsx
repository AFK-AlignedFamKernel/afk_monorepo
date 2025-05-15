'use client';

import React, { ReactNode, useState } from 'react';
import { NostrEventBase, formatTimestamp, truncate } from '@/types/nostr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/small/icon-component';
import { useUIStore } from '@/store/uiStore';
import { TipNostrUser } from '../tips/tip-user';
interface IProfileCardOverviewProps extends NostrEventBase {
  children?: ReactNode;
  profileParent?: string;
  profilePubkey?: string;
  isLinkToProfile?: boolean;
}

export const ProfileCardOverview: React.FC<IProfileCardOverviewProps> = ({
  event,
  profile,
  isLoading = false,
  children,
  profileParent,
  profilePubkey,
  isLinkToProfile = true,
}) => {
  const router = useRouter();
  const { showModal } = useUIStore();

  if (!profileParent && !profilePubkey && !profile) {
    return null;
  }

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
  const [isExpandedAbout, setIsExpandedAbout] = useState(false);

  return (
    <div className="event-card">
      <div className="flex items-center mb-8"
        onClick={() => {
          router.push(`/nostr/profile/${event.pubkey}`)
        }}
      >
        {profile?.picture ? (
          <div
            className="rounded-full overflow-hidden w-30 h-30"
          // className="w-10 h-10 rounded-full overflow-hidden"
          >
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
            <span className="text-gray-600 dark:text-gray-300 text-lg">
              {displayName.substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <div className="ml-2">
          <div className="font-medium text-gray-900 dark:text-white">{displayName}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            {profile?.nip05 && (
              <span className="ml-1 text-blue-500">✓</span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <span>{profile?.displayName}</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <span>{profile?.name}</span>
            </div>
          </div>

        </div>
      </div>

      <div className="flex items-center mb-8">
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
          <p>{profile?.nip05}</p>
        </div>
        <button onClick={() => {
          showModal(<TipNostrUser profile={profile} pubkey={profilePubkey} />);
          // router.push(`/nostr/profile/${profilePubkey}`)
        }}>
          {/* <Icon name="UserIcon" size={16} /> */}
          Tips
        </button>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
        {profile?.about && (
          <span className="about-text" style={{ whiteSpace: 'normal', overflow: 'hidden', wordBreak: 'break-word' }}>
            {profile.about.length > 30 ? (
              <>
                <span>{profile.about.substring(0, 30)}...</span>
                <button
                  className="text-blue-500 ml-1 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsExpandedAbout(!isExpandedAbout);
                  }}
                >
                  {isExpandedAbout ? 'Show less' : 'Show more'}
                </button>
                {isExpandedAbout && <span
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsExpandedAbout(!isExpandedAbout);
                  }}
                  style={{ display: 'block', wordBreak: 'break-word' }}>{profile.about.substring(30)}</span>}
              </>
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsExpandedAbout(!isExpandedAbout);
                }} style={{ wordBreak: 'break-word' }}>{profile.about}</span>
            )}
          </span>
        )}
      </div>

      {isLinkToProfile && (
        <div className="flex items-center mb-8">
          <Link href={`/nostr/profile/${profilePubkey}`}>
            <Icon name="UserIcon" size={16} />
            View Profile
          </Link>
        </div>
      )}

      {children}
    </div>
  );
};

export default ProfileCardOverview; 