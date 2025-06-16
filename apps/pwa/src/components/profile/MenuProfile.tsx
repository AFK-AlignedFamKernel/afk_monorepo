import Link from "next/link";

export default function MenuProfile() {



  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Identity Management</h1>
      <div>

      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-contrast-100 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 italic">Decentralized Identities</h2>
          <div
            className="space-y-4">
            <Link href="/nostr/my-profile" className="btn w-full flex items-center justify-between border-2 border-contrast-200 rounded-lg">
              <div>
                <p className="font-semibold">Nostr Profile</p>
                <p className="text-sm opacity-80">Manage your decentralized social identity</p>
              </div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

          </div>
        </div>

        <div className="bg-contrast-100 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 italic">Connected Accounts</h2>
          <div className="space-y-4">


            <Link href="/brand/management" className="btn w-full flex items-center justify-between">
              <div>
                <p className="font-semibold">Brand Profile</p>
                <p className="text-sm opacity-80">Manage your brand identity</p>
              </div>
            </Link>



            <Link href="/content-creator" className="btn w-full flex items-center justify-between">
              <div>
                <p className="font-semibold">Content Creator</p>
                <p className="text-sm opacity-80">Manage your content creator identity</p>
              </div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* <Link href="/brand" className="btn btn-gradient-blue w-full flex items-center justify-between">
              <div>
                <p className="font-semibold">Brand Profile</p>
                <p className="text-sm opacity-80">Manage your brand identity</p>
              </div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link> */}

            {/* <div className="p-4 border border-contrast-200 rounded-lg">
              <p className="text-lg font-medium mb-2">Social Connections</p>
              <p className="text-sm text-contrast-500">Connect your existing social media accounts to enhance your presence across platforms.</p>
            </div>

            <div className="p-4 border border-contrast-200 rounded-lg">
              <p className="text-lg font-medium mb-2">Wallet Connections</p>
              <p className="text-sm text-contrast-500">Link your crypto wallets to access web3 features and manage digital assets.</p>
            </div> */}
          </div>
        </div>
        <div className="bg-contrast-100 p-6 rounded-lg shadow-lg">

          <p className="text-lg font-medium mb-2">Coming soon</p>

          <button className="btn  w-full flex items-center justify-between" disabled>
            <div>
              <p className="font-semibold">Farcaster Protocol</p>
              <p className="text-sm opacity-80">Coming soon</p>
            </div>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button className="btn w-full flex items-center justify-between" disabled>
            <div>
              <p className="font-semibold">Lens Protocol</p>
              <p className="text-sm opacity-80">Coming soon</p>
            </div>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="btn w-full flex items-center justify-between" disabled>
            <div>
              <p className="font-semibold">ZK Passport</p>
              <p className="text-sm opacity-80">Coming soon</p>
            </div>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

        </div>
      </div>
    </div>
  );
}