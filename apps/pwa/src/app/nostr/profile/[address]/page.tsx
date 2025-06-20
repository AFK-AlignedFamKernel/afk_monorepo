'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useContacts, useEditContacts, useNostrContext, useProfile } from 'afk_nostr_sdk'
import { NDKRelay, NDKUserProfile } from '@nostr-dev-kit/ndk'
import { FeedTabsProfile } from '@/components/Nostr/feed/FeedTabsProfile'
import { useUIStore } from '@/store/uiStore'
import NostrProfilePage from '@/components/Nostr/profile/NostrProfilePage'

export default function ProfilePage() {

  const { address } = useParams()


  // console.log('profile', profile)
 

  // if (!profile && !profileLoading) {
  //   return <div>Profile not found</div>
  // }

  return (
    <NostrProfilePage
      address={address as string}
    />
  )
}

