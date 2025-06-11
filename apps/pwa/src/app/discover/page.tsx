"use client"

import ListBrand from "@/components/Brand/ListBrand";
import TableBrand from "@/components/Brand/TableBrand";
import DiscoveryComponent from "@/components/Discovery";
import AllCreators from "@/components/ContentCreator/AllCreators";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import TableCreators from "@/components/ContentCreator/TableCreators";
import { FeedTabs } from "@/components/Nostr/feed";

export default function DiscoverPage() {

  // const searchParams = useSearchParams()
  // const query = searchParams.get("query")

  const [activeTab, setActiveTab] = useState<"brand" | "creator" | "topic" | "feed">("brand");

  return (
    <div className="flex flex-col gap-4">


      <div className="p-4">

        <h1 className="text-3xl font-bold">Discover</h1>

        <div className="flex flex-row gap-4">
          <button className={`px-4 py-2 rounded-md ${activeTab === "brand" ? "bg-blue-700 text-white" : "border border-gray-300"}`} onClick={() => setActiveTab("brand")}>Brands</button>
          <button className={`px-4 py-2 rounded-md ${activeTab === "creator" ? "bg-blue-700 text-white" : "border border-gray-300"}`} onClick={() => setActiveTab("creator")}>Creators</button>
          {/* <button className={`px-4 py-2 rounded-md ${activeTab === "topic" ? "bg-blue-700 text-white" : "border border-gray-300"}`} onClick={() => setActiveTab("topic")}>Topics</button> */}
          <button className={`px-4 py-2 rounded-md ${activeTab === "feed" ? "bg-blue-700 text-white" : "border border-gray-300"}`} onClick={() => setActiveTab("feed")}>Feeds</button>
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

          </div>
          <FeedTabs />
        </>
      )}


    </div>
  );
}