"use client"
import React, { useEffect, useState } from "react";
import { ContentCreator } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { LaunchpadWrapperCard } from "../launchpad/LaunchpadWrapperCard";
import AnalyticsCreatorConsumer from "../profile/AnalyticsCreatorConsumer";

const PageCreator: React.FC<{ slug: string }> = ({ slug }) => {

  const [creator, setCreator] = useState<ContentCreator | null>(null);

  const [activeTab, setActiveTab] = useState<"token_address" | "social_links" | "analytics" | "reputation">("analytics");

  useEffect(() => {
    const res = fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/content-creator/view-profile?slug_name=${slug}`)
      .then(res => res.json())
      .then(data => {
        // console.log("data", data)
        setCreator(data);
      });

    // console.log("res", res)
  }, [slug]);

  if (!creator) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Only show profile details if not on analytics tab */}
      {activeTab == "analytics" && (
        <>
          {creator.avatar_url ? (
            <img
              src={creator.avatar_url}
              alt={creator.name}
              className="w-20 h-20 rounded-full object-cover mb-2"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center mb-2 text-2xl font-bold">
              {creator.name?.slice(0, 2).toUpperCase()}
            </div>
          )}
          <h4 className="font-bold text-lg mb-1">{creator.name}</h4>
          {creator.bio && <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 text-center">{creator.bio}</p>}

          {creator.slug_name && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 text-center">{creator.slug_name}</p>
          )}

          {creator?.token_address && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 text-center">{creator.token_address?.slice(0, 6) + "..." + creator.token_address?.slice(-4)}</p>
            </div>
          )}

          {creator.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 text-center">{creator.bio}</p>
          )}

          {creator?.topics && creator?.topics?.length > 0 && (
            <div className="flex flex-row gap-4 rounded-lg shadow h-auto overflow-x-auto scrollbar-hide">
              {creator.topics.map((topic, index) => (
                <div key={index} className="flex flex-col items-center gap-3 rounded-md">
                  <p className="text-sm truncate w-full no-wrap ellipsis">{topic}</p>
                </div>
              ))}
            </div>
          )}

          {creator?.identities && creator?.identities?.length > 0 && (
            <div className="flex flex-row gap-2 h-auto">
              {Object.entries(creator.identities).map(([platformIndex, platform]) => {
                return (
                  <div key={platformIndex + platform + platform.url + platform.identity_data.provider}
                    className="flex flex-col items-center gap-3 p-3 rounded-md">
                    {/* <p className="font-medium capitalize">{platform.identity_data.provider}</p> */}

                    {platform?.identity_data?.provider === "discord" && (
                      <>
                        <img src={`/assets/icons/${platform.identity_data.provider}.svg`} alt={platform.identity_data.provider} className="w-8 h-8 rounded-full object-cover" />
                        <img src={platform.identity_data.avatar_url} alt={platform.identity_data.name} className="w-8 h-8 rounded-full object-cover" />

                      </>
                    )}

                    {platform?.identity_data?.provider === "github" && (
                      <div className="items-center gap-3">
                        <Link href={`https://github.com/${platform.identity_data.user_name}`} target="_blank"
                          className="text-blue-500 hover:underline text-sm flex">
                          {/* {`https://github.com/${platform.identity_data.user_name}`} */}
                          <img src={`/assets/icons/${platform.identity_data.provider}.svg`} alt={platform.identity_data.provider} className="w-8 h-8 rounded-full object-cover" />

                          <img src={platform.identity_data.avatar_url} alt={platform.identity_data.name} className="w-8 h-8 rounded-full object-cover" />
                          <p className="font-medium">{platform.identity_data.name}</p>

                        </Link>
                      </div>
                    )}

                    {platform?.identity_data?.provider === "google" && (
                      <>
                        <img src={`/assets/icons/${platform.identity_data.provider}.svg`} alt={platform.identity_data.provider} className="w-8 h-8 rounded-full object-cover" />
                        <img src={platform.identity_data.avatar_url} alt={platform.identity_data.name} className="w-8 h-8 rounded-full object-cover" />
                      </>
                    )}

                    {platform?.identity_data?.provider === "twitter" && (
                      <Link href={`https://x.com/${platform.identity_data.user_name}`} target="_blank" className="flex flex-row items-center gap-2 bg-black dark:bg-white rounded-full p-2">
                        <img src={`/assets/icons/${platform.identity_data.provider}.svg`} alt={platform.identity_data.provider} className={`w-8 h-8 rounded-full object-cover text-white dark:text-black bg-black dark:bg-white`} />
                        {/* <img src={platform.identity_data.avatar_url} alt={platform.identity_data.name} className="w-8 h-8 rounded-full object-cover" /> */}
                      </Link>
                    )}


                  </div>
                )
              })}
            </div>
          )}

          {creator?.social_links && (
            <div className="flex flex-row gap-4 p-1 rounded-lg h-auto">
              {Object.entries(creator.social_links).map(([platformIndex, platform]) => {
                return (
                  <div key={platformIndex + platform + platform.url + platform.identity_data.provider}
                    className="flex flex-col items-center gap-3 px-3 rounded-md">

                    {platform?.identity_data?.provider === "discord" && (
                      <>
                        <img src={`/assets/icons/${platform.identity_data.provider}.svg`} alt={platform.identity_data.provider} className="w-8 h-8 rounded-full object-cover" />

                        <img src={platform.identity_data.avatar_url} alt={platform.identity_data.name} className="w-8 h-8 rounded-full object-cover" />
                      </>
                    )}

                    {platform?.identity_data?.provider === "github" && (
                      <div className="items-center gap-3">
                        <Link href={`https://github.com/${platform.identity_data.user_name}`} target="_blank"
                          className="text-blue-500 hover:underline text-sm flex">
                          <img src={`/assets/icons/${platform.identity_data.provider}.svg`} alt={platform.identity_data.provider} className="w-8 h-8 rounded-full object-cover" />

                          <img src={platform.identity_data.avatar_url} alt={platform.identity_data.name} className="w-8 h-8 rounded-full object-cover" />
                          <p className="font-medium">{platform.identity_data.name}</p>

                        </Link>
                      </div>
                    )}

                    {platform?.identity_data?.provider === "google" && (
                      <>
                        <img src={`/assets/icons/${platform.identity_data.provider}.svg`} alt={platform.identity_data.provider} className="w-8 h-8 rounded-full object-cover" />
                        <img src={platform.identity_data.avatar_url} alt={platform.identity_data.name} className="w-8 h-8 rounded-full object-cover" />

                      </>
                    )}

                    {platform?.identity_data?.provider === "twitter" && (
                      <Link href={`https://x.com/${platform.identity_data.user_name}`} target="_blank">
                        <img src={`/assets/icons/${platform.identity_data.provider}.svg`} alt={platform.identity_data.provider} className="w-8 h-8 rounded-full object-cover bg-black dark:bg-white" />

                        {/* <img src={platform.identity_data.avatar_url} alt={platform.identity_data.name} className="w-8 h-8 rounded-full object-cover" /> */}
                      </Link>
                    )}


                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Tab buttons */}
      <div className="flex flex-row gap-4 mt-1 p-1 rounded-lg shadow h-auto overflow-x-auto w-full justify-center">
        {creator?.token_address && (
          <button className={`bg-blue-500 text-white p-2 rounded-md ${activeTab === "token_address" ? "opacity-100" : "opacity-70"}`}
            onClick={() => setActiveTab("token_address")}
          >Token Address</button>
        )}
        <button className={`bg-blue-500 text-white p-2 rounded-md ${activeTab === "analytics" ? "opacity-100" : "opacity-70"}`}
          onClick={() => setActiveTab("analytics")}
        >Analytics</button>
      </div>

      {/* Tab content */}
      <div className="w-full">
        {activeTab === "token_address" && (
          <div className="flex flex-col gap-4">
            {creator?.token_address && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 text-center">{creator?.token_address?.slice(0, 6) + "..." + creator?.token_address?.slice(-4)}</p>
            )}
            {creator?.token_address && (
              <LaunchpadWrapperCard
                token_address={creator.token_address}
              />
            )}
          </div>
        )}
        {activeTab === "analytics" && (
          <div className="w-full flex flex-col items-center">
            {/* Mobile back button */}
            {/* <button
              className="sm:hidden mb-4 self-start text-blue-600 hover:underline flex items-center gap-2"
              onClick={() => setActiveTab("token_address")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </button> */}
            <AnalyticsCreatorConsumer slug={slug} creator={creator} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PageCreator; 