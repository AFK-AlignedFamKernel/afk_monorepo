'use client'
import NostrProfilePage from '@/components/Nostr/profile/NostrProfilePage'
import CryptoLoading from '@/components/small/crypto-loading'
import { useParams } from 'next/navigation'
import { nip19 } from 'nostr-tools'

export default function ProfilePage() {
  const { address } = useParams()
  console.log("address", address)

  if (!address) {
    return <div>No address</div>
  }

  let pubkey: string | undefined;

  if (typeof address === "string") {
    if (address.includes("npub") || address.includes("nprofile")) {
      const decoded = nip19.decode(address);
      // Handle both string and object cases
      if (typeof decoded.data === "string") {
        pubkey = decoded.data;
      } else if (decoded.data && typeof decoded.data === "object" && "pubkey" in decoded.data) {
        pubkey = (decoded.data as any).pubkey;
      }
    } else {
      pubkey = address;
    }
  } else if (typeof address === "object" && address !== null) {
    // If address is an object, try to extract pubkey property
    if ("pubkey" in address) {
      pubkey = (address as any).pubkey;
    }
  }

  if (!pubkey) {
    return <div>
      <p>Invalid address. Please wait or retry</p>
      <div className="flex justify-center items-center">
        <CryptoLoading />
      </div>
    </div>
  }

  return <NostrProfilePage address={pubkey} />


}