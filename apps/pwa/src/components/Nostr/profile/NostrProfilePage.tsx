'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useContacts, useEditContacts, useNostrContext, useProfile } from 'afk_nostr_sdk'
import { NDKRelay, NDKUserProfile } from '@nostr-dev-kit/ndk'
import { FeedTabsProfile } from '@/components/Nostr/feed/FeedTabsProfile'
import { useUIStore } from '@/store/uiStore'

export default function NostrProfilePage({ address }: { address: string }) {
  const { ndk } = useNostrContext()
  const router = useRouter()
  const { data: profile, isLoading: profileLoading, isError, isFetching } = useProfile({
    publicKey: address as string,
  })

  const contacts = useContacts({
    authors: [address as string]
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
        <ProfileHeader profile={profile} contacts={contacts} />
      }
      {profile &&
        <FeedTabsProfile authors={[address as string]}></FeedTabsProfile>
      }
    </div>
  )
}


const ProfileHeader = (props?: any) => {
  const { profile, contacts } = props

  const [showMore, setShowMore] = useState(false)
  if (!profile) {
    return null
  }

  const editContact = useEditContacts()



  const contactsData = contacts?.data
  const [isFollowinNow, setIsFollowinNow] = useState(false)

  const isFollowing = contactsData?.some((contact) => contact === profile.pubkey)

  const { showToast } = useUIStore()
  const handleFollow = async () => {

    let res: Set<NDKRelay> | null = new Set()
    if (isFollowing) {
      res = await editContact.mutateAsync({
        pubkey: profile.pubkey,
        type: "remove"
      })
    } else {
      res = await editContact.mutateAsync({
        pubkey: profile.pubkey,
        type: "add"
      })
      console.log("res", res)

      if (res && res.size > 0) {
        console.log("success")
        showToast({
          message: "Followed",
          type: "success"
        })
      } else {
        console.log("error")
        showToast({
          message: "Error",
          type: "error"
        })
      }
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        {profile.picture && (
          <img
            src={profile.picture}
            alt="Profile"
            className="w-32 h-32 rounded-full mb-4"
          />
        )}
        <div>
          <p className="text-2xl font-bold mb-4">
            {profile?.displayName || profile?.name || 'Anonymous'}
          </p>
          {profile?.lud06 && (
            <p className="text-sm font-bold mb-4">
              {profile?.lud06}
            </p>
          )}
          {profile?.lud16 && (
            <p className="text-sm font-bold mb-4">
              {profile?.lud16}
            </p>
          )}
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


      <div className="flex items-center gap-4 mt-4">

        <button className="bg-gray-500 text-white px-4 py-2 rounded-md"


          onClick={() => {
            handleFollow()
          }}
        >

          Follow
        </button>
        <button className="bg-gray-500 text-white px-4 py-2 rounded-md">
          Message
        </button>
      </div>
    </div>
  )
}
