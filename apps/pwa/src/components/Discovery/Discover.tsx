"use client"

import ListBrand from "@/components/Brand/ListBrand";
import TableBrand from "@/components/Brand/TableBrand";
import { useState } from "react";
import TableCreators from "@/components/ContentCreator/TableCreators";
import { FeedTabs } from "@/components/Nostr/feed";
import { logClickedEvent } from "@/lib/analytics";
import PumpComponent from "../launchpad/PumpComponent";
import CommunitiesList from "../Communities";
import ChannelFeed from "../Nostr/Channel/ChannelFeed";
// import { ChatScreen } from "@/components/Bitchat/ChatScreen";

export default function DiscoverComponent() {

  // const searchParams = useSearchParams()
  // const query = searchParams.get("query")

  const [activeTab, setActiveTab] = useState<"brand" | "chat" | "creator" | "topic" | "feed" | "launchpad" | "communities" | "channels">("feed");

  return (
    <div className="flex flex-col gap-1">

      <div className="p-4">

        <div className="flex flex-row gap-2 overflow-x-auto scrollbar-hide rounded-xl p-2 shadow-md justify-start ">
          {[
            { key: "feed", label: "Feed" },
            { key: "brand", label: "Brands" },
            // { key: "chat", label: "Chat" },
            { key: "creator", label: "Creators" },
            { key: "launchpad", label: "Tokens" },
            { key: "channels", label: "Channels" },
            { key: "communities", label: "Communities" },
            // { key: "topic", label: "Topics" },
          ].map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded-full transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-green-400 whitespace-nowrap
                ${activeTab === tab.key
                  ? "bg-green-500  shadow font-semibold"
                  :  "hover:bg-gray-200 dark:hover:bg-gray-700"}
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


      <div>

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
          <div
          // className="flex flex-row gap-4"
          >
            <FeedTabs className="w-full" />
          </div>
        )}

        {activeTab === "launchpad" && (
          <div className="px-4">
            <PumpComponent />
          </div>
        )}

        {activeTab === "channels" && (
          <div className="px-4">
            <ChannelFeed />
          </div>
        )}

        {/* {activeTab === "chat" && (
          <div className="px-4">
            <ChatScreen />
          </div>
        )} */}

        {activeTab === "communities" && (
          <div className="px-4">
            <CommunitiesList />
          </div>
        )}

      </div>

    </div>
  );
}