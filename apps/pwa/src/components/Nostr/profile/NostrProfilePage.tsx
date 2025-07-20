'use client'

import { useEffect, useMemo, useState } from 'react'
import { useContacts, useEditContacts, useProfile, useAuth } from 'afk_nostr_sdk'
import { FeedTabsProfile } from '@/components/Nostr/feed/FeedTabsProfile'
import { useUIStore } from '@/store/uiStore'
import { useNostrContext } from 'afk_nostr_sdk'
import { logClickedEvent } from '@/lib/analytics'
import { Icon } from '@/components/small/icon-component'
import Image from 'next/image'

export default function NostrProfilePage({ address }: { address: string }) {
  // console.log("address", address)
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
      // console.log("user", user)
      const profileData = await user.fetchProfile();
      // console.log("profile fetched", profileData)

      setProfile(profileData);
    };
    fetchProfile();
  }, [address, ndk])
  // console.log("profile", profile)

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
  // console.log("contacts of profile", contacts?.data)

  const {data: myContacts} = useContacts({
    authors: [publicKey]
  })

  // console.log("myContacts", myContacts)
// 
  // console.log("myContacts", myContacts?.data)
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
      <ProfileHeader profile={profile} contacts={contacts} address={address} myContacts={myContacts ?? []} />

      <FeedTabsProfile authors={[address as string]}></FeedTabsProfile>
    </div>
  )
}

const ProfileHeader = (props?: any) => {
  const { profile, contacts, address, myContacts } = props

  // console.log("myContacts", myContacts)
  const [showMore, setShowMore] = useState(false)
  // if (!profile) {
  //   return null
  // }

  const { ndk } = useNostrContext();
  const { showModal } = useUIStore()

  const editContact = useEditContacts()
  const [isFollowinNow, setIsFollowinNow] = useState(myContacts?.some((contact) => contact === (profile?.pubkey ?? address)))

  const isFollowing = useMemo(() => {
    // console.log("myContacts", myContacts)
    // console.log("profile?.pubkey", profile?.pubkey)
    // console.log("address", address)
    return isFollowinNow
    // return myContacts?.some((contact) => contact === (profile?.pubkey ?? address))
  }, [myContacts, profile?.pubkey, address, isFollowinNow])

  // console.log("isFollowing", isFollowing)
  // console.log("isFollowinNow", isFollowinNow)
  const { showToast } = useUIStore()
  // console.log("profile", profile)
  const handleFollow = async () => {

    let res: Set<any> | null = new Set()

    const pubkeyAddress = profile?.pubkey ?? address
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
        pubkey: pubkeyAddress,
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
        pubkey: pubkeyAddress,
        type: "add"
      })

      // let contacts = await ndk.fetchEvent({
      //   kinds: [NDKKind.Contacts],
      //   authors: [pubkeyAddress],
      // });

      // console.log("ndk.signer", ndk.signer)

      // console.log("contacts", contacts)
      // if (!contacts) {
      //   contacts = new NDKEvent(ndk);
      //   contacts.kind = NDKKind.Contacts;
      //   contacts.content = '';
      //   contacts.tags = [];
      // }

      // const connectedRelays = ndk?.pool?.connectedRelays()
      // console.log("connectedRelays", connectedRelays)
      // if (connectedRelays.length === 0) {
      //   console.log("connecting to relays")
      //   await ndk.connect(5000)
      // }

      // // Resetting the id and created_at to avoid conflicts
      // contacts.id = undefined as any;
      // // contacts.created_at = undefined;

      // console.log("contacts", contacts)

      // if (data.type === 'add') {
      //   contacts.tags.push(['p', data.pubkey, '', '']);
      // } else {
      //   contacts.tags = contacts.tags.filter((tag) => tag[1] !== data.pubkey);
      // }

      // Remove duplicates before adding new contact
      // const existingContact = contacts.tags.find((tag) => tag[1] === pubkeyAddress);
      // if (!existingContact) {
      //   contacts.tags.push(['p', pubkeyAddress, '', '']);
      // }
      // // if (data.type === 'add') {

      // // } else {
      // //   contacts.tags = contacts.tags.filter((tag) => tag[1] !== data.pubkey);
      // // }
      // await contacts.sign();

      // const res = await contacts.publish();
      // console.log("res", res)
      // console.log("res", res)

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


  // console.log("profile", profile)
  return (
    <div>
      <div className="flex items-center gap-4">
        {profile?.picture && (
          <Image
            src={profile?.picture}
            alt="Profile"
            width={128}
            height={128}
            className="w-32 h-32 rounded-full mb-4"
          />
        )}
        <div>
          <p className="text-2xl font-bold mb-4">
            {profile?.displayName || profile?.name || profile?.username || profile?.userName || 'Anonymous'}
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
        <div
          onClick={() => setShowMore(!showMore)}
        >
          <p className="text-gray-600 mb-4 cursor-pointer"
            onClick={() => setShowMore(!showMore)}
          >
            {profile?.about.length > 30 ? (
              <>
                {showMore ? profile?.about : profile?.about.slice(0, 30)}...
                <button
                  className="hover:underline ml-1"
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

      {/* {profile?.lud16 && (
        <div className="text-xs items-center">
          <button
            className='btn btn-sm btn-primary'
            onClick={() => {
              console.log("address", address);
              if (address) {
                showModal(<TipNostrUser profile={profile} pubkey={address} />);
              }
            }}>
            Tips
          </button>
        </div>
      )} */}

      <div className="flex items-center gap-4 my-2">

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
        <button 
        // className="py-2 rounded-md shadow-md flex gap-1 items-center shadow border border-gray-200 dark:border-gray-800 p-4"
        className="py-2 rounded-md shadow-md flex gap-1 items-center"
          onClick={() => {
            logClickedEvent('message_profile', 'Interaction', 'Button Click', 1);
          }}
        >
          <Icon name="MessageIcon" size={20} />
          {/* Message */}
        </button>
      </div>
    </div>
  )
}
