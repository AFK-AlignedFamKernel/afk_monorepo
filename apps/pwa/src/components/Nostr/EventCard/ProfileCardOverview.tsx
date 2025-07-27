'use client';

import React, { ReactNode, useMemo, useState } from 'react';
import { NostrEventBase, formatTimestamp, truncate } from '@/types/nostr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/small/icon-component';
import { useUIStore } from '@/store/uiStore';
import { TipNostrUser } from '../tips/tip-user';
import { logClickedEvent } from '@/lib/analytics';
import Image from 'next/image';
import styles from '@/styles/nostr/feed.module.scss';
import { ButtonPrimary } from '@/components/button/Buttons';
import { useEditContacts } from '../../../../../../packages/afk_nostr_sdk/src/hooks/useEditContacts';
import { useContacts } from '../../../../../../packages/afk_nostr_sdk/src/hooks/useContacts';
import { useAuth } from 'afk_nostr_sdk';
interface IProfileCardOverviewProps extends NostrEventBase {
  children?: ReactNode;
  profileParent?: string;
  profilePubkey?: string;
  isLinkToProfile?: boolean;
  isVideo?: boolean;
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
  const { showModal, showToast } = useUIStore();

  if (!profileParent && !profilePubkey && !profile) {
    return null;
  }


  const { publicKey } = useAuth();
  const contacts = useContacts({
    authors: [profilePubkey || event?.pubkey as string]
  })
  // console.log("contacts of profile", contacts?.data)

  const { data: myContacts } = useContacts({
    authors: [publicKey]
  })


  const editContact = useEditContacts()
  const [isFollowinNow, setIsFollowinNow] = useState(myContacts?.some((contact) => contact === (profilePubkey || event?.pubkey)))

  const isFollowing = useMemo(() => {
    // console.log("myContacts", myContacts)
    // console.log("profile?.pubkey", profile?.pubkey)
    // console.log("address", address)
    return isFollowinNow
    // return myContacts?.some((contact) => contact === (profile?.pubkey ?? address))
  }, [myContacts, profilePubkey, event?.pubkey, isFollowinNow])

  const handleFollow = async () => {

    let res: Set<any> | null = new Set()

    const pubkeyAddress = profilePubkey || event?.pubkey
    if (!pubkeyAddress) {
      showToast({
        message: "Error",
        type: "error"
      })
      return
    }
    // console.log("isFollowing", isFollowing)
    if (isFollowing) {
      res = await editContact.mutateAsync({
        pubkey: pubkeyAddress as string,
        type: "remove"
      })
      if (res && res.size > 0) {
        logClickedEvent('unfollow_profile', 'Interaction', 'Button Click', 1);
        showToast({
          message: "Unfollowed",
          type: "success"
        })
        setIsFollowinNow(false)
      } else {
        showToast({
          message: "Error",
          type: "error"
        })
        logClickedEvent('unfollow_profile_error', 'Interaction', 'Button Click', 1);
      }
    } else {
      res = await editContact.mutateAsync({
        pubkey: pubkeyAddress as string,
        type: "add"
      })

      if (res && res.size > 0) {
        console.log("success")
        showToast({
          message: "Followed",
          type: "success"
        })
        logClickedEvent('follow_profile', 'Interaction', 'Button Click', 1);
        setIsFollowinNow(true)
      } else {
        console.log("error")
        showToast({
          message: "Error",
          type: "error"
        })
        logClickedEvent('follow_profile_error', 'Interaction', 'Button Click', 1);
      }
    }
  }
  if (isLoading) {
    return (
      <div className={styles['nostr-feed__card--skeleton']}>
        <div className="flex items-center mb-4">
          <div className="w-10 h-10  rounded-full"></div>
          <div className="ml-2">
            <div className="h-4  rounded w-24"></div>
            <div className="h-3 rounded w-16 mt-1"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 rounded w-full"></div>
          <div className="h-4 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const displayName = profile?.displayName || profile?.name || truncate(event?.pubkey || '', 8);
  const timestamp = event?.created_at ? formatTimestamp(event?.created_at) : '';
  const [isExpandedAbout, setIsExpandedAbout] = useState(false);

  return (
    <div className={styles['event-card'] + ' text-left items-left rounded-xl shadow-lg p-4 max-w-[95vw] w-full'} aria-label="Profile overview modal">
      <div className="flex items-center gap-3 mb-4 cursor-pointer rounded-lg p-1 transition"
        onClick={() => {
          router.push(`/nostr/profile/${event?.pubkey}`)
          logClickedEvent('view_full_profile', 'Interaction', 'Button Click', 1);
        }}
        aria-label="Go to full profile"
      >
        {profile?.picture ? (
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-green-400 flex-shrink-0">
            <Image
              unoptimized
              src={profile.picture}
              alt={displayName}
              width={56}
              height={56}
              className="object-cover w-14 h-14"
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 flex-shrink-0">
            <span className="text-2xl" aria-label="No profile image">🕵️</span>
          </div>
        )}
        <div className="ml-2 min-w-0">
          <div className="font-bold text-lg truncate-ellipsis" title={displayName}>{displayName}</div>
          <div className="text-xs flex items-center">
            {profile?.nip05 && (
              <span className="ml-1 text-blue-500" aria-label="Verified">✓</span>
            )}
          </div>
          <div className="flex flex-row items-left gap-2 mt-1">
            {profile?.displayName && <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate-ellipsis">{profile.displayName}</div>}
            {profile?.name && <div className="text-xs text-gray-500 dark:text-gray-400 truncate-ellipsis">@{profile.name}</div>}
          </div>
          {profile?.nip05 && (
            <div className="text-xs text-green-700 dark:text-green-400 mt-1 truncate-ellipsis">{profile.nip05}</div>
          )}
        </div>
      </div>

      <div>
        <button
          className="py-2 rounded-md shadow-md flex gap-1 items-center"
          onClick={() => {
            handleFollow()
            logClickedEvent(isFollowing ? 'unfollow_profile_button' : 'follow_profile_button', 'Interaction', 'Button Click', 1);
          }}
        >
          <Icon name={isFollowing ? "UnfollowIcon" : "FollowIcon"} size={20} />
          {isFollowing ? "Unfollow" : "Follow"}
        </button>
      </div>

      <div className="mb-4 mt-2">
        {profile?.about && (
          <div className="text-xs rounded p-2" style={{ wordBreak: 'break-word' }}>
            {profile.about.length > 60 && !isExpandedAbout ? (
              <>
                <span>{profile.about.substring(0, 60)}...</span>
                <button
                  className="text-blue-500 ml-1 hover:underline text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsExpandedAbout(true);
                  }}
                  aria-label="Show more about"
                >
                  Show more
                </button>
              </>
            ) : (
              <>
                <span>{profile.about}</span>
                {profile.about.length > 60 && (
                  <button
                    className="text-blue-500 ml-1 hover:underline text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsExpandedAbout(false);
                    }}
                    aria-label="Show less about"
                  >
                    Show less
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-row gap-2 items-center align-end">

        {profile?.lud16 && (
          <div className="text-xs items-center">
            <ButtonPrimary
              className='btn btn-sm btn-primary mt-1'
              onClick={() => {
                if (profile && profile?.lud16) {
                  showModal(<TipNostrUser profile={profile} pubkey={event?.pubkey || ''} />);
                  logClickedEvent('tip_note_modal_open', 'Interaction', 'Button Click', 1);
                }
              }}
              aria-label="Send tip"
            >
              💸 Tip
            </ButtonPrimary>
          </div>
        )}
        {(profilePubkey || event?.pubkey) && (
          <div className="flex flex-row gap-2 items-center">
            <Link href={`/nostr/profile/${profilePubkey ?? event?.pubkey}`}
              className="flex flex-row gap-2 items-center px-3 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg font-semibold shadow hover:bg-green-200 dark:hover:bg-green-800 transition"
              aria-label="View full profile"
              onClick={() => {
                logClickedEvent('view_full_profilet', 'Interaction', 'Button Click', 1);
              }}
            >
              <Icon name="UserIcon" size={18} />
              View Full Profile
            </Link>
          </div>
        )}
      </div>

      {children}
    </div>
  );
};

export default ProfileCardOverview; 