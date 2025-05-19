'use client'

import { useEffect, useState } from 'react'
import { useNostrContext, useProfile } from 'afk_nostr_sdk'
import { useAuth } from 'afk_nostr_sdk'
import { NostrKeyManager } from 'afk_nostr_sdk'
import { NostrProfileEditForm } from '@/components/Nostr/profile/edit-form'
import { useUIStore } from '@/store/uiStore'
import { FeedTabsProfile } from '@/components/Nostr/feed/FeedTabsProfile'
export default function MyNostrProfileComponent() {
  const { publicKey, setAuth } = useAuth()
  const { ndk } = useNostrContext()
  const { data: profile, isLoading: profileLoading, isError, isFetching } = useProfile({
    publicKey: publicKey as string,
  })
  const [isEditOpen, setIsEditOpen] = useState(false)
  const { showToast, showModal } = useUIStore()


  // console.log('profile', profile)


  useEffect(() => {

    const readNostrStorage = () => {
      const nostrStorageStr = NostrKeyManager.getNostrWalletConnected()

      if (!nostrStorageStr) {
        return
      }

      const nostrStorage = JSON.parse(nostrStorageStr)

      if (nostrStorage && nostrStorage?.publicKey) {
        setAuth(nostrStorage?.publicKey, nostrStorage?.secretKey)
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
        <div className='gap-4 mb-2'>
          <ProfileHeader profile={profile} />
          <button onClick={() => {
            setIsEditOpen(!isEditOpen)
            showModal(<NostrProfileEditForm />)
          }}
          className='bg-blue-500 text-white px-4 py-2 rounded-md'
          >{isEditOpen ? 'Edit' : 'Edit'}</button>
          {/* {isEditOpen && <NostrProfileEditForm />} */}
        </div>
      }
      {profile && (
        <FeedTabsProfile authors={[publicKey as string]} />
      )}
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


export const ProfileHeader = (props?: any) => {
  const { profile } = props

  const [showMore, setShowMore] = useState(false)
  if (!profile) {
    return null
  }

  return (
    <div>
      {profile.banner && (
        <img
          src={profile.banner}
          alt="Profile Banner"
          className="w-full h-32 md:h-48 object-cover rounded-t-lg mb-4"
        />
      )}

      <div className="flex  items-center">
        {profile.picture && (
          <img
            src={profile.picture}
            alt="Profile"
            className="w-32 h-32 rounded-full mb-4"
          />
        )}
        <div>

          <p className="text-2xl font-bold mb-4">
            {profile?.displayName || profile?.name || profile?.username || 'Anonymous'}
          </p>

          <p className="text-2xl font-bold mb-4">
            {profile?.lud06 || profile?.lud16 || 'Anonymous'}
          </p>
        </div>

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
