"use client"
import { useState } from "react";
import MyNostrProfileComponent from "../Nostr/my-profile";
import { Icon } from "../small/icon-component";
import ManageCreatorProfile from "./ManageCreatorProfile";
import ManageBrandProfile from "../Brand/ManageBrandProfile";
import RewardsCenter from "../Rewards/RewardsCenter";
import { NostrMessagesComponent } from "../Nostr/Messages/nip17";
import { useUIStore } from "@/store/uiStore";
import { ProfileManagement } from "./profile-management";
import { logClickedEvent } from "@/lib/analytics";
import MessagesNostrOverview from "../Nostr/Messages/MessagesNostrOverview";

export default function ProfileAfk() {

  const [activeTab, setActiveTab] = useState<"nostr" | "starknet" | "lens" | "farcaster" | "zap" | "brand" | "content-creator" | "dm" | "rewards" | undefined>(undefined);


  const { showModal } = useUIStore();

  const handleTabChange = (tab: "rewards" | "nostr" | "starknet" | "lens" | "farcaster" | "zap" | "brand" | "content-creator" | "dm" | undefined) => {
    setActiveTab(tab);
  };

  return (
    <div className="container py-2">
      <h1 className="text-xl font-bold mb-2 italic text-center">Identity Management</h1>

      {activeTab === undefined && (

        <div className="flex flex-col md:grid md:grid-cols-2 gap-8 overflow-x-auto">


          <div className="bg-contrast-100 p-6 rounded-lg shadow-lg text-left">
            <h2 className="text-sm font-semibold mb-4 italic">Decentralized Identities</h2>
            <div className="flex flex-row gap-2 py-4">

              <button className="btn btn-basic flex items-center gap-2" onClick={() => {
                logClickedEvent("login-button-modal-profile-afk")
                showModal(<ProfileManagement />)
              }}>
                <Icon name="LoginIcon" size={24} />
                Login
              </button>

            </div>
            <div
              className="space-y-4 text-left">
              <button onClick={() => {
                logClickedEvent("nostr--edit-my-profile")
                handleTabChange("nostr")
              }} className="btn w-full flex items-center justify-between border-1 border-contrast-200 rounded-lg">
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


              <button onClick={() => {
                logClickedEvent("brand-profile-selected")
                handleTabChange("brand")
              }} className="btn w-full flex items-center justify-between text-left">
                <div>
                  <p className="font-semibold">Brand Profile</p>
                  <p className="text-sm opacity-80">Manage your brand identity</p>
                </div>
              </button>



              <button onClick={() => {
                logClickedEvent("content-creator-selected")
                handleTabChange("content-creator")
              }} className="btn w-full flex items-center justify-between text-left">
                <div>
                  <p className="font-semibold">Content Creator</p>
                  <p className="text-sm opacity-80">Manage your content creator identity</p>
                </div>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button onClick={() => {
                logClickedEvent("messages-selected")
                handleTabChange("dm")
              }} className="btn w-full flex justify-between border-2 border-contrast-200 rounded-lg">
                <div>
                  <p className="font-semibold">Messages</p>
                  <p className="text-sm opacity-80">Manage your messages</p>
                </div>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

            </div>
          </div>
          <div className="bg-contrast-100 p-6 rounded-lg shadow-lg">
            <h2 className="text-sm font-semibold mb-4 italic">Rewards Center</h2>
            <div className="space-y-4">
              <button onClick={() => {
                logClickedEvent("rewards-selected")
                handleTabChange("rewards")
              }} className="btn w-full flex items-center justify-between border-2 border-contrast-200 rounded-lg">
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
          <button
            className="btn w-full flex items-center justify-between p-2"
            onClick={() => {
              logClickedEvent("back-button-modal-profile-afk")
              setActiveTab(undefined)
            }}>
            <Icon name="BackIcon" size={24} />
          </button>
          {activeTab === "nostr" && <MyNostrProfileComponent />}
          {activeTab === "brand" && <ManageBrandProfile />}
          {activeTab === "content-creator" && <ManageCreatorProfile />}
          {activeTab === "rewards" && <RewardsCenter />}
          {activeTab === "dm" && <MessagesNostrOverview />}
        </div>
      )}

      {/* <div className="mt-8">
        {activeTab === "nostr" && <MyNostrProfileComponent />}
      </div> */}
    </div>
  );
}