'use client'

import useCallback, { useEffect, useMemo, useState } from 'react'
import { useContacts, useEditContacts, useProfile, useAuth } from 'afk_nostr_sdk'
import { NDKKind, NDKRelay } from '@nostr-dev-kit/ndk'

import { FeedTabsProfile } from '@/components/Nostr/feed/FeedTabsProfile'
import { useUIStore } from '@/store/uiStore'
import { useNostrContext } from 'afk_nostr_sdk'

export default function NostrProfilePage({ address }: { address: string }) {
  console.log("address", address)
  const { ndk } = useNostrContext();
  const { publicKey } = useAuth();
  const {
    // data: profile,
    isLoading: profileLoading,
    isError,
  } = useProfile({
    publicKey: address as string,
  })
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (ndk.pool?.connectedRelays().length === 0) {
        await ndk.connect(5000)
      }

      const user = ndk.getUser({ pubkey: address as string });

      console.log("user", user)

      const profileData = await user.fetchProfile();

      console.log("profile fetched", profileData)

      setProfile(profileData);
    };

    fetchProfile();
  }, [address, ndk])
  console.log("profile", profile)

  // const fetchProfile = useMemo(async () => {
  //   const profile = await ndk.fetchEvent({
  //     kinds: [NDKKind.Metadata],
  //     authors: [address as string],
  //   })  
  //   return profile
  // }, [address])

  // console.log("fetched profile", fetchProfile)

  const contacts = useContacts({
    authors: [address as string]
  })
  console.log("contacts of profile", contacts?.data)

  const myContacts = useContacts({
    authors: [publicKey]
  })

  console.log("myContacts", myContacts?.data)

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
      {/* {profile &&
      } */}
      <ProfileHeader profile={profile} contacts={myContacts?.data} address={address} myContacts={myContacts?.data} />

      <FeedTabsProfile authors={[address as string]}></FeedTabsProfile>
    </div>
  )
}


const ProfileHeader = (props?: any) => {
  const { profile, contacts, address, myContacts } = props

  const [showMore, setShowMore] = useState(false)
  // if (!profile) {
  //   return null
  // }

  const editContact = useEditContacts()



  const contactsData = contacts?.data
  const [isFollowinNow, setIsFollowinNow] = useState(false)

  const isFollowing = contactsData?.some((contact) => contact === profile?.pubkey)

  const { showToast } = useUIStore()
  const handleFollow = async () => {

    let res: Set<any> | null = new Set()
    console.log("isFollowing", isFollowing)
    if (isFollowing) {
      res = await editContact.mutateAsync({
        pubkey: profile?.pubkey,
        type: "remove"
      })
    } else {
      res = await editContact.mutateAsync({
        pubkey: profile?.pubkey,
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
        {profile?.picture && (
          <img
            src={profile?.picture}
            alt="Profile"
            className="w-32 h-32 rounded-full mb-4"
          />
        )}
        <div>
          <p className="text-2xl font-bold mb-4">
            {profile?.display_name || profile?.name || 'Anonymous'}
          </p>
          {profile?.lud06 && (
            <p className="text-sm font-bold mb-4 text-gray-500">
              {profile?.lud06}
            </p>
          )}
          {profile?.lud16 && (
            <p className="text-sm font-bold mb-4 text-gray-500">
              {profile?.lud16}
            </p>
          )}
        </div>
      </div>

      {profile?.about && (
        <div>
          <p className="text-gray-600 mb-4">
            {profile?.about.length > 30 ? (
              <>
                {showMore ? profile?.about : profile?.about.slice(0, 30)}...
                <button
                  className="text-blue-500 hover:underline ml-1"
                  onClick={() => setShowMore(!showMore)}
                >
                  {showMore ? 'View less' : 'View more'}
                </button>
              </>
            ) : (
              profile?.about
            )}
          </p>
        </div>
      )}
      {profile?.website && (
        <a
          href={profile?.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {profile?.website}
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
