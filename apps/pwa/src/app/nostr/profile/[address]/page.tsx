'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useNostrContext, useProfile } from 'afk_nostr_sdk'
import { NDKUserProfile } from '@nostr-dev-kit/ndk'
import { FeedTabsProfile } from '@/components/Nostr/feed/FeedTabsProfile'

export default function ProfilePage() {
  const { address } = useParams()
  const { ndk } = useNostrContext()
  const router = useRouter()
  const { data: profile, isLoading: profileLoading, isError, isFetching } = useProfile({
    publicKey: address as string,
  })

  // console.log('profile', profile)
  if (profileLoading) {
    return <div>Loading profile...</div>
  }

  if (isError) {
    return <div>
      Error: {isError}
    </div>
  }

  // if (!profile && !profileLoading) {
  //   return <div>Profile not found</div>
  // }

  return (
    <div className="p-4">
      {profile &&
        <ProfileHeader profile={profile} />
      }
      {profile &&
        <FeedTabsProfile authors={[address as string]}></FeedTabsProfile>
      }
    </div>
  )
}


const ProfileHeader = (props?: any) => {
  const { profile } = props

  const [showMore, setShowMore] = useState(false)
  if (!profile) {
    return null
  }

  return (
    <div>
      <div className="flex items-center">
        {profile.picture && (
          <img
            src={profile.picture}
            alt="Profile"
            className="w-32 h-32 rounded-full mb-4"
          />
        )}
        <p className="text-2xl font-bold mb-4">
          {profile?.displayName || profile?.name || 'Anonymous'}
        </p>
        <p className="text-2xl font-bold mb-4">
          {profile?.lud06 || profile?.lud16 || 'Anonymous'}
        </p>

      </div>

      {profile.about && (
        <div>
          <p className="text-gray-600 mb-4">
            {profile.about.length > 30 ? (
              <>
                {showMore ? profile.about : profile.about.slice(0, 30)}...
                <button
                  className="text-blue-500 hover:underline ml-1"
                  onClick={() => setShowMore(!showMore)}
                >
                  {showMore ? 'View less' : 'View more'}
                </button>
              </>
            ) : (
              profile.about
            )}
          </p>
        </div>
      )}
      {profile?.website && (
        <a
          href={profile.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {profile.website}
        </a>
      )}
    </div>
  )
}
