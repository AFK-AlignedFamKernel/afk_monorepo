'use client'

import { useEffect, useState } from 'react'
import { useNostrContext, useProfile } from 'afk_nostr_sdk'
import { useAuth } from 'afk_nostr_sdk'
import { NostrKeyManager } from 'afk_nostr_sdk'
import { NostrProfileEditForm } from '@/components/Nostr/profile/edit-form'
import { useUIStore } from '@/store/uiStore'
import { FeedTabsProfile } from '@/components/Nostr/feed/FeedTabsProfile'
import NostrCreateAccountComponent from './login/NostrCreateAccount'
import { NostrProfileManagement } from './profile/nostr-profile-management'
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
    <div className="w-full max-w-full px-4 md:px-6 lg:px-8 overflow-x-hidden h-full">
      {!publicKey && (
        <div className="w-full overflow-y-scroll h-full">
          <p>No public key found</p>
          <NostrCreateAccountComponent />
          <NostrProfileManagement />
        </div>
      )}

      {!profile && publicKey &&
        <div className="w-full">
          <p>Profile not found</p>

          <p className='text-sm overflow-x-scroll whitespace-nowrap'>Public Key: {publicKey}</p>

          <button onClick={() => {
            setIsEditOpen(!isEditOpen)
            showModal(<NostrProfileCreate />)
          }}
            className='bg-blue-500 text-white px-4 py-2 rounded-md'
          >{isEditOpen ? 'Edit' : 'Edit'}</button>
          {/* <NostrProfileCreate /> */}
        </div>
      }
      {profile &&
        <div className='w-full mb-4'>
          <ProfileHeader profile={profile} />
          {/* <button onClick={() => {
            setIsEditOpen(!isEditOpen)
            showModal(<NostrProfileEditForm />)
          }}
            className='bg-blue-500 text-white px-4 py-2 rounded-md'
          >{isEditOpen ? 'Edit' : 'Edit'}</button> */}
        </div>
      }
      {profile && publicKey && (
        <div className="w-full">
          <FeedTabsProfile authors={[publicKey as string]} />
        </div>
      )}
    </div>
  )
}

export const NostrProfileCreate = () => {
  const { publicKey, setAuth } = useAuth()
  return (
    <div>
      <p>Create Nostr Profile</p>
      <p className='text-sm overflow-x-scroll whitespace-nowrap'>Public Key: {publicKey}</p>

      <NostrProfileEditForm />
    </div>
  )
}


export const ProfileHeader = (props?: any) => {
  const { profile } = props

  const { showModal } = useUIStore()
  const [showMore, setShowMore] = useState(false)
  if (!profile) {
    return null
  }

  return (
    <div className="relative rounded-xl shadow-md overflow-hidden mb-4">
      {profile.banner && (
        <img
          src={profile.banner}
          alt="Profile Banner"
          className="w-full h-32 md:h-48 object-cover"
        />
      )}
      <div className="flex flex-col items-center -mt-12 pb-4">
        <img
          src={profile.picture}
          alt="Profile"
          className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 shadow-lg"
        />
        <h2 className="mt-2 text-2xl font-bold">{profile.displayName || 'Anonymous'}</h2>
        <p className="text-gray-500 text-sm">{profile.lud06 || profile.lud16}</p>
        <p className="text-gray-700 dark:text-gray-300 mt-2 text-center max-w-xs">
          {profile.about}
        </p>
        <button
        onClick={() => {
          // setIsEditOpen(!isEditOpen)
          showModal(<NostrProfileEditForm />)
        }}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
          Edit Profile
        </button>
      </div>
    </div>
  )
}
