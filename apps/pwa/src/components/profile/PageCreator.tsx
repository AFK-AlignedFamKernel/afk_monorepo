"use client"
import React, { useEffect, useState } from "react";
import { ContentCreator } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { LaunchpadWrapperCard } from "../launchpad/LaunchpadWrapperCard";

const PageCreator: React.FC<{ slug: string }> = ({ slug }) => {

  const [creator, setCreator] = useState<ContentCreator | null>(null);

  const [activeTab, setActiveTab] = useState<"token_address" | "social_links" | "analytics" | "reputation">("token_address");

  useEffect(() => {
    const res = fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/content-creator/view-profile?slug_name=${slug}`)
      .then(res => res.json())
      .then(data => {
        console.log("data", data)
        setCreator(data);
      });

    console.log("res", res)
  }, [slug]);

  if (!creator) {
    return <div>Loading...</div>;
  }


  console.log("creator", creator)

  return (
    <div className="p-4 shadow flex flex-col items-center dark:bg-contrast-100">
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
      {/* {creator.social_links && (
        <div className="flex gap-2 mt-2">
          {Object.entries(creator.social_links).map(([platformIndex , platform]) => {
            console.log("platform", platform)
            console.log("url", platform.url)
            return (
              <div key={platform + platform.url}>
                <p
                  key={platform + platform.url}
                  className="text-blue-500 hover:underline text-sm"
                >
                  {JSON.stringify(platform?.identity_data)}
                </p>
              </div>
            )
          })}
        </div>
      )} */}

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
        <div className="flex flex-row gap-4 mt-4 p-4 rounded-lg shadow h-auto overflow-x-auto scrollbar-hide">
          {creator.topics.map((topic, index) => (
            <div key={index} className="flex flex-col items-center gap-3 rounded-md">
              <p className="text-sm truncate w-full no-wrap ellipsis">{topic}</p>
            </div>
          ))}
        </div>
      )}

      {(creator?.social_links || creator?.identities) && (
        <p>Links</p>
      )}

      {creator?.social_links && (
        <div className="flex flex-row gap-4 mt-4 p-4 rounded-lg shadow h-auto">
          {Object.entries(creator.social_links).map(([platformIndex, platform]) => {
            return (
              <div key={platformIndex + platform + platform.url + platform.identity_data.provider}
                className="flex flex-col items-center gap-3 p-3 rounded-md">
                {/* <p className="font-medium capitalize">{platform.identity_data.provider}</p> */}
                <img src={`/assets/icons/${platform.identity_data.provider}.svg`} alt={platform.identity_data.provider} className="w-8 h-8 rounded-full object-cover" />

                {platform?.identity_data?.provider === "discord" && (
                  <img src={platform.identity_data.avatar_url} alt={platform.identity_data.name} className="w-8 h-8 rounded-full object-cover" />
                )}

                {platform?.identity_data?.provider === "github" && (
                  <div className="items-center gap-3">
                    <Link href={`https://github.com/${platform.identity_data.user_name}`} target="_blank"
                      className="text-blue-500 hover:underline text-sm flex">
                      {/* {`https://github.com/${platform.identity_data.user_name}`} */}
                      <img src={platform.identity_data.avatar_url} alt={platform.identity_data.name} className="w-8 h-8 rounded-full object-cover" />
                      <p className="font-medium">{platform.identity_data.name}</p>

                    </Link>
                  </div>
                )}

                {platform?.identity_data?.provider === "google" && (
                  <img src={platform.identity_data.avatar_url} alt={platform.identity_data.name} className="w-8 h-8 rounded-full object-cover" />
                )}

                {platform?.identity_data?.provider === "twitter" && (
                  <Link href={`https://x.com/${platform.identity_data.user_name}`} target="_blank">
                    <img src={platform.identity_data.avatar_url} alt={platform.identity_data.name} className="w-8 h-8 rounded-full object-cover" />
                  </Link>
                )}


              </div>
            )
          })}
        </div>
      )}

      {creator?.identities && (
        <div className="flex gap-2 mt-2">
          {Object.entries(creator.identities).map(([platformIndex, platform]) => {
            return (
              <div key={platformIndex + platform + platform.url + platform.identity_data.provider}>



                <div className="flex flex-col items-center gap-3">
                  <img src={`/assets/icons/${platform.identity_data.provider?.toLowerCase()}.svg`} alt={platform.identity_data.provider} className="w-8 h-8 rounded-full object-cover" />
                  <p>{platform.identity_data.provider}</p>
                  {platform.identity_data.provider === "discord" && (
                    // <Image src={platform.identity_data.avatar_url} alt={platform.identity_data.name}  className="w-4 h-4 rounded-full object-cover"  />
                    <img src={platform.identity_data.avatar_url} alt={platform.identity_data.name} className="w-10 h-10 rounded-full object-cover" />
                  )}
                </div>

                {platform.identity_data.provider === "github" && (
                  <>

                    <Link href={`https://github.com/${platform.identity_data.user_name}`} target="_blank">
                      <p>{platform.identity_data.name}</p>
                      <img src={platform.identity_data.avatar_url} alt={platform.identity_data.name} className="w-10 h-10 rounded-full object-cover" />
                      {/* <p>{`https://github.com/${platform.identity_data.user_name}`}</p> */}
                    </Link>
                  </>
                )}

                {platform.identity_data.provider === "google" && (
                  <img src={platform.identity_data.avatar_url} alt={platform.identity_data.name} className="w-10 h-10 rounded-full object-cover" />
                )}

                {platform.identity_data.provider === "twitter" && (
                  <Link href={`https://x.com/${platform.identity_data.user_name}`} target="_blank">
                    <img src={platform.identity_data.avatar_url} alt={platform.identity_data.name} className="w-10 h-10 rounded-full object-cover" />
                  </Link>

                )}
                <p
                  key={platform + platform.url}
                  className="text-blue-500 hover:underline text-sm truncate w-full"
                >


                </p>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex flex-row gap-4 mt-4 p-4 rounded-lg shadow h-auto overflow-x-auto">
        <button className="bg-blue-500 text-white p-2 rounded-md"
          onClick={() => setActiveTab("token_address")}
        >  Token Address </button>

        {/* <button className="bg-blue-500 text-white p-2 rounded-md"
          onClick={() => setActiveTab("social_links")}
        >  Social Links </button> */}

        <button className="bg-blue-500 text-white p-2 rounded-md"
          onClick={() => setActiveTab("analytics")}
        >  Analytics </button>

        {/* <button className="bg-blue-500 text-white p-2 rounded-md"
          onClick={() => setActiveTab("reputation")}
        >  Reputation </button> */}
      </div>

      <div>
        {activeTab === "token_address" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 text-center">{creator.token_address?.slice(0, 6) + "..." + creator.token_address?.slice(-4)}</p>

            {creator.token_address && (
              <LaunchpadWrapperCard
                token_address={creator.token_address}
              />
            )}
          </div>
        )}

        {activeTab === "social_links" && (
          <div>
            <p>Social Links</p>
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            <p>Analytics</p>
          </div>
        )}


      </div>
    </div>
  );
};

export default PageCreator; 