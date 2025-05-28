import Link from "next/link";

export default function ProfileAfk() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">Identity Management</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-contrast-100 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Decentralized Identities</h2>
          <div className="space-y-4">
            <Link href="/nostr/my-profile" className="btn btn-gradient-blue w-full flex items-center justify-between">
              <div>
                <p className="font-semibold">Nostr Profile</p>
                <p className="text-sm opacity-80">Manage your decentralized social identity</p>
              </div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <button className="btn btn-gradient-purple w-full flex items-center justify-between" disabled>
              <div>
                <p className="font-semibold">Farcaster Protocol</p>
                <p className="text-sm opacity-80">Coming soon - Web3 social networking</p>
              </div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button className="btn btn-gradient-green w-full flex items-center justify-between" disabled>
              <div>
                <p className="font-semibold">Lens Protocol</p>
                <p className="text-sm opacity-80">Coming soon - Web3 social networking</p>
              </div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-contrast-100 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Connected Accounts</h2>
          <div className="space-y-4">
            <div className="p-4 border border-contrast-200 rounded-lg">
              <p className="text-lg font-medium mb-2">Social Connections</p>
              <p className="text-sm text-contrast-500">Connect your existing social media accounts to enhance your presence across platforms.</p>
            </div>
            
            <div className="p-4 border border-contrast-200 rounded-lg">
              <p className="text-lg font-medium mb-2">Wallet Connections</p>
              <p className="text-sm text-contrast-500">Link your crypto wallets to access web3 features and manage digital assets.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}