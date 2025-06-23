"use client"

import ListBrand from "@/components/Brand/ListBrand";
import TableBrand from "@/components/Brand/TableBrand";
import { useState } from "react";
import TableCreators from "@/components/ContentCreator/TableCreators";
import { FeedTabs } from "@/components/Nostr/feed";
import { logClickedEvent } from "@/lib/analytics";
import PumpComponent from "../launchpad/PumpComponent";

export default function DiscoverComponent() {

  // const searchParams = useSearchParams()
  // const query = searchParams.get("query")

  const [activeTab, setActiveTab] = useState<"brand" | "creator" | "topic" | "feed" | "launchpad">("feed");

  return (
    <div className="flex flex-col gap-1">

      <div className="p-4">

        <div className="flex flex-row gap-1 overflow-x-auto scrollbar-hide shadow-md">
          <button className={`p-2 rounded-md ${activeTab === "feed" ? "border border-green-500" : ""}`} onClick={() => {
            setActiveTab("feed")
            logClickedEvent("discover_feed", "click", "discover_feed")

          }}>Feed</button>
          <button className={`p-2 rounded-md ${activeTab === "brand" ? "border border-green-500" : ""}`} onClick={() => {
            setActiveTab("brand")
            logClickedEvent("discover_brand", "click")
          }}>Brands</button>
          <button className={`p-2 rounded-md ${activeTab === "creator" ? "border border-green-500" : ""}`} onClick={() => {
            setActiveTab("creator")
            logClickedEvent("discover_creator", "click")

          }}>Creators</button>
          <button className={`px-4 py-2 rounded-md ${activeTab === "launchpad" ? "border border-green-500" : ""}`} onClick={() => {
            setActiveTab("launchpad")
            logClickedEvent("discover_launchpad", "click", "discover_launchpad")
          }}>Tokens</button>
          {/* <button className={`px-4 py-2 rounded-md ${activeTab === "topic" ? "bg-blue-700 text-white" : "border border-gray-300"}`} onClick={() => setActiveTab("topic")}>Topics</button> */}

        </div>


      </div>


      {activeTab === "brand" && (
        <>
          <TableBrand />
          {/* <ListBrand /> */}
        </>
      )}

      {activeTab === "creator" && (
        <>
          {/* <AllCreators /> */}
          <TableCreators />
        </>
      )}

      {activeTab === "topic" && (
        <>
          <h2 className="text-xl font-bold">Topics</h2>
          <p>
            More topics coming soon
          </p>
        </>
      )}

      {activeTab === "feed" && (
        <>
          {/* <p>
            More feeds coming soon
          </p> */}
          <div className="flex flex-row gap-4">
            <FeedTabs />

          </div>
        </>
      )}

      {activeTab === "launchpad" && (
        <div className="px-4">
          <PumpComponent />
        </div>
      )}

    </div>
  );
}