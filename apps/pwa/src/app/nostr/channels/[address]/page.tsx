'use client'
import ChannelDetail from '@/components/Nostr/Channel/ChannelDetail'
import { useParams } from 'next/navigation'

export default function ChannelPage() {
  const {address} = useParams()
  console.log("address", address)

  if (!address) {
    return <div>No address</div>
  }

  return <ChannelDetail channelId={address as string} />
}

