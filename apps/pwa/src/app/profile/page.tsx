import Link from "next/link";

export default function ProfileAfk() {
  return (
    <div>
      <h1>Profile</h1>
      <p>This is the profile page</p>

      <Link href="/nostr/my-profile">
        <p>My Nostr Profile</p>
      </Link>
    </div>
  )
}