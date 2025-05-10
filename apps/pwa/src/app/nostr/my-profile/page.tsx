'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useNostrContext, useProfile } from 'afk_nostr_sdk'
import { NDKUserProfile } from '@nostr-dev-kit/ndk'
import { FeedTabs } from '@/components/Nostr/feed'
import { useAuth } from 'afk_nostr_sdk'
import { NostrKeyManager } from 'afk_nostr_sdk'
import { NostrProfileEditForm } from '@/components/Nostr/profile/edit-form'
import { useUIStore } from '@/store/uiStore'
export default function MyNostrProfilePage() {
  const { publicKey, setAuth } = useAuth()
  const { ndk } = useNostrContext()
  const { data: profile, isLoading: profileLoading, isError, isFetching } = useProfile({
    publicKey: publicKey as string,
  })
  const [isEditOpen, setIsEditOpen] = useState(false)
  const { showToast, showModal } = useUIStore()
  

  // console.log('profile', profile)

  console.log('publicKey', publicKey)

  useEffect(() => {

    const readNostrStorage = () => {
      const nostrStorageStr = NostrKeyManager.getNostrWalletConnected()
      console.log('nostrStorageStr', nostrStorageStr)

      if (!nostrStorageStr) {
        return
      }

      const nostrStorage = JSON.parse(nostrStorageStr)
      console.log('nostrStorage', nostrStorage)

      if (nostrStorage && nostrStorage?.publicKey) {
        setAuth(nostrStorage?.publicKey, nostrStorage?.secretKey)
        console.log('nostrStorage', nostrStorage)
      }
    }
    if (!publicKey) {
      readNostrStorage()
    }
  }, [publicKey])
  if (!publicKey) {
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

      {!profile && publicKey &&
        <div>
          <p>Profile not found</p>
          <NostrProfileCreate />
        </div>
      }
      {profile &&
        <>
          <ProfileHeader profile={profile} />
          <button onClick={() => {
            setIsEditOpen(!isEditOpen)
            showModal(<NostrProfileEditForm />)
          }}>{isEditOpen ? 'Close' : 'Edit'} Profile</button>
          {isEditOpen && <NostrProfileEditForm />}
        </>
      }
      {profile &&
        <FeedTabs authors={[publicKey as string]}></FeedTabs>
      }
    </div>
  )
}

export const NostrProfileCreate = () => {
  const { publicKey, setAuth } = useAuth()
  return (
    <div>
      <p>Create Nostr Profile</p>
      <p>Public Key: {publicKey}</p>

      <NostrProfileEditForm />
    </div>
  )
}


const ProfileHeader = (props?: any) => {
  const { profile } = props

  const [showMore, setShowMore] = useState(false)
  console.log('profile', profile)
  if (!profile) {
    return null
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        {profile?.displayName || profile?.name || 'Anonymous'}
      </h1>
      {profile.picture && (
        <img
          src={profile.picture}
          alt="Profile"
          className="w-32 h-32 rounded-full mb-4"
        />
      )}
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
