"use client"
import Link from "next/link";
import { useState } from "react";
import MyNostrProfileComponent from "../Nostr/my-profile";
import { Icon } from "../small/icon-component";
import ManageCreatorProfile from "./ManageCreatorProfile";
import ManageBrandProfile from "../Brand/ManageBrandProfile";
import RewardsCenter from "../Rewards/RewardsCenter";
import { NostrMessagesComponent } from "../Nostr/Messages/nip17";
import { useUIStore } from "@/store/uiStore";
import { ProfileManagement } from "./profile-management";

export default function ProfileAfk() {

  const [activeTab, setActiveTab] = useState<"nostr" | "starknet" | "lens" | "farcaster" | "zap" | "brand" | "content-creator" | "messages" | "rewards" | undefined>(undefined);


  const { showModal } = useUIStore();

  const handleTabChange = (tab: "rewards" | "nostr" | "starknet" | "lens" | "farcaster" | "zap" | "brand" | "content-creator" | "messages" | undefined) => {
    setActiveTab(tab);
  };

  return (
    <div className="container py-2">
      <h1 className="text-xl font-bold mb-2 italic text-center">Identity Management</h1>

      {activeTab === undefined && (

        <div className="flex flex-col md:grid md:grid-cols-2 gap-8 overflow-x-auto">


          <div className="bg-contrast-100 p-6 rounded-lg shadow-lg text-left">
            <h2 className="text-sm font-semibold mb-4 italic">Decentralized Identities</h2>
            <div>

              <button className="btn btn-basic flex items-center gap-2" onClick={() => {
                showModal(<ProfileManagement />)
              }}>
                <Icon name="LoginIcon" size={24} />
                Login
              </button>

            </div>
            <div
              className="space-y-4 text-left">
              <button onClick={() => handleTabChange("nostr")} className="btn w-full flex items-center justify-between border-2 border-contrast-200 rounded-lg">
                <div className={`${activeTab === "nostr" ? "text-contrast-500" : ""}`}>
                  <p className="font-semibold text-left">Nostr Profile</p>
                  <p className="text-sm opacity-80">Manage your decentralized social identity</p>
                </div>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

            </div>
          </div>

          <div className="bg-contrast-100 p-6 rounded-lg shadow-lg text-left">
            <h2 className="text-sm font-semibold mb-4 italic">Connected Accounts</h2>
            <div className="space-y-4">


              <button onClick={() => handleTabChange("brand")} className="btn w-full flex items-center justify-between text-left">
                <div>
                  <p className="font-semibold">Brand Profile</p>
                  <p className="text-sm opacity-80">Manage your brand identity</p>
                </div>
              </button>



              <button onClick={() => handleTabChange("content-creator")} className="btn w-full flex items-center justify-between text-left">
                <div>
                  <p className="font-semibold">Content Creator</p>
                  <p className="text-sm opacity-80">Manage your content creator identity</p>
                </div>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* <button onClick={() => handleTabChange("messages")} className="btn w-full flex justify-between border-2 border-contrast-200 rounded-lg">
                <div>
                  <p className="font-semibold">Messages</p>
                  <p className="text-sm opacity-80">Manage your messages</p>
                </div>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button> */}

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
            <h2 className="text-sm font-semibold mb-4 italic">Rewards Center</h2>
            <div className="space-y-4">
              <button onClick={() => handleTabChange("rewards")} className="btn w-full flex items-center justify-between border-2 border-contrast-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Icon name="RewardsIcon" size={24} />
                  <p className="font-semibold">Rewards</p>
                </div>
              </button>
            </div>
          </div>
          <div className="bg-contrast-100 p-6 rounded-lg shadow-lg text-left">

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
      )}

      {activeTab && (
        <div className="mt-8">
          <button onClick={() => setActiveTab(undefined)} className="btn w-full flex items-center justify-between">
            <Icon name="BackIcon" size={24} />
          </button>
          {activeTab === "nostr" && <MyNostrProfileComponent />}
          {activeTab === "brand" && <ManageBrandProfile />}
          {activeTab === "content-creator" && <ManageCreatorProfile />}
          {activeTab === "rewards" && <RewardsCenter />}
          {activeTab === "messages" && <NostrMessagesComponent />}
        </div>
      )}

      {/* <div className="mt-8">
        {activeTab === "nostr" && <MyNostrProfileComponent />}
      </div> */}
    </div>
  );
}