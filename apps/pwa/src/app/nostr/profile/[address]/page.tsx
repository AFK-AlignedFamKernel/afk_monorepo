'use client'
import NostrProfilePage from '@/components/Nostr/profile/NostrProfilePage'
import { useParams } from 'next/navigation'

export default function ProfilePage() {
  const {address} = useParams()
  console.log("address", address)

  if (!address) {
    return <div>No address</div>
  }

  return <NostrProfilePage address={address as string} />
}

