"use client"

import ListBrand from "@/components/Brand/ListBrand";
import TableBrand from "@/components/Brand/TableBrand";
import { useState } from "react";
import TableCreators from "@/components/ContentCreator/TableCreators";
import { FeedTabs } from "@/components/Nostr/feed";
import { logClickedEvent } from "@/lib/analytics";
import PumpComponent from "../launchpad/PumpComponent";
import CommunitiesList from "../Communities";

export default function DiscoverComponent() {

  // const searchParams = useSearchParams()
  // const query = searchParams.get("query")

  const [activeTab, setActiveTab] = useState<"brand" | "creator" | "topic" | "feed" | "launchpad" | "communities" >("feed");

  return (
    <div className="flex flex-col gap-1">

      <div className="p-4">

        <div className="flex flex-row gap-2 overflow-x-auto scrollbar-hide rounded-xl p-2 shadow-md w-max justify-start ">
          {[
            { key: "feed", label: "Feed" },
            { key: "brand", label: "Brands" },
            { key: "creator", label: "Creators" },
            { key: "launchpad", label: "Tokens" },
            { key: "communities", label: "Communities" },
            // { key: "topic", label: "Topics" },
          ].map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded-full transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-green-400 whitespace-nowrap
                ${activeTab === tab.key
                  ? "bg-green-500 text-white shadow font-semibold"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"}
              `}
              onClick={() => {
                setActiveTab(tab.key as typeof activeTab);
                logClickedEvent(`discover_${tab.key}`, "click", `discover_${tab.key}`);
              }}
            >
              {tab.label}
            </button>
          ))}
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

      {activeTab === "communities" && (
        <div className="px-4">
          <CommunitiesList />
        </div>
      )}

    </div>
  );
}