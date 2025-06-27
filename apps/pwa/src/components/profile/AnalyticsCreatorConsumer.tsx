"use client"
import React, { useEffect, useMemo, useState } from "react";
import { ContentCreator } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { LaunchpadWrapperCard } from "../launchpad/LaunchpadWrapperCard";
import { useBrandStore } from "@/store/brand";
import { useCreatorsStore } from "@/store/creators";


interface AnalyticsCreatorConsumerProps {
  slug: string;
  creator?: ContentCreator;
}

const AnalyticsCreatorConsumer: React.FC<AnalyticsCreatorConsumerProps> = ({ slug, creator }) => {


  const { creatorAnalytics, setCreatorAnalytics, isInitialFetchCreatorAnalytics, setContentCreator, contentCreator } = useCreatorsStore();
  const [creatorInput, setCreatorInput] = useState<ContentCreator | null>();

  const [analytics, setAnalytics] = useState<any[]>(creatorAnalytics || []);
  const [activeTab, setActiveTab] = useState<"token_address" | "social_links" | "analytics" | "reputation">("token_address");
  const [activeTabAnalytics, setActiveTabAnalytics] = useState<"twitter" | "youtube" | "tiktok" | "instagram" | "facebook" | "linkedin" | "telegram" | "discord" | "reddit" | "twitch" | "website" | "other">("twitter");

  const selectedAnalytics = useMemo(() => {
    return analytics?.find((analytic: any) => analytic.platform === activeTabAnalytics);
  }, [analytics, activeTabAnalytics, activeTab]);

  useEffect(() => {

    if (slug && !creatorAnalytics && !contentCreator) {
      const res = fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/analytics/content-creator/view-profile?slug_name=${slug}`)
        .then(res => res.json())
        .then(data => {
          setCreatorInput(data.creator);
          setAnalytics(data.analytics);
          setCreatorAnalytics(data.analytics);
          setContentCreator(data.creator);
        });

    }
  }, [slug, creatorAnalytics, contentCreator]);

  if (!analytics) {
    return <div>Loading...</div>;
  }



  return (
    <div className="w-full sm:max-w-md mx-0 sm:mx-auto shadow flex flex-col items-center bg-white/90 dark:bg-contrast-100 rounded-xl p-2 sm:p-6 overflow-x-auto scrollbar-hide">

      {creator &&
        <>
          {/* {creator?.topics && creator?.topics?.length > 0 && (
            <div className="flex flex-row gap-4 mt-4 p-4 rounded-lg shadow h-auto overflow-x-auto scrollbar-hide">
              {creator.topics.map((topic, index) => (
                <div key={index} className="flex flex-col items-center gap-3 rounded-md">
                  <p className="text-sm truncate w-full no-wrap ellipsis">{topic}</p>
                </div>
              ))}
            </div>
          )} */}
        </>
      }


      {selectedAnalytics && (
        <>
          <h4 className="font-bold text-lg mb-1">{selectedAnalytics?.platform}</h4>


          {selectedAnalytics?.llm_classification && (
            <div className="w-full bg-contrast-100 p-4 rounded-lg shadow overflow-x-auto scrollbar-hide">
                {Object.entries(selectedAnalytics?.llm_classification).map(([key, value], index) => (
                  <div key={index} className="flex flex-row gap-2">
                    <span className="font-semibold">{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
            </div>
          )}

          {/* {selectedAnalytics?.recommendations && (
                <div className="bg-contrast-100 p-4 rounded-lg shadow overflow-x-auto scrollbar-hide">
                  <p className="text-sm break-words whitespace-pre-wrap">{JSON.stringify(selectedAnalytics?.recommendations, null, 2)}</p>
                </div>
              )}

              {selectedAnalytics?.stats_creator && (
                <div className="bg-contrast-100 p-4 rounded-lg shadow overflow-x-auto scrollbar-hide">
                  <p className="text-sm break-words whitespace-pre-wrap">{JSON.stringify(selectedAnalytics?.stats_creator, null, 2)}</p>
                </div>
              )}

              {selectedAnalytics?.stats_content && (
                <div className="bg-contrast-100 p-4 rounded-lg shadow overflow-x-auto scrollbar-hide">
                  <p className="text-sm break-words whitespace-pre-wrap ellipsis">{JSON.stringify(selectedAnalytics?.stats_content, null, 2)}</p>
                </div>
              )} 
               
               
                  {selectedAnalytics?.llm_process_data && (
                <div className="bg-contrast-100 p-4 rounded-lg shadow overflow-x-auto scrollbar-hide">
                  <p className="text-sm break-words whitespace-pre-wrap ellipsis">{JSON.stringify(selectedAnalytics?.llm_process_data, null, 2)}</p>
                </div>
              )}
               */}
        </>
      )}
      {/* 
      {analytics?.map((analytic: any, index: number) => {
        return (
          <div key={index}>
            <h4 className="font-bold text-lg mb-1">{analytic.platform}</h4>
            <div>

              {analytic.llm_classification && (
                <div className="bg-contrast-100 p-4 rounded-lg shadow overflow-x-auto scrollbar-hide">
                  <div className="flex flex-col gap-2">
                    {Object.entries(analytic.llm_classification).map(([key, value], index) => (
                      <div key={index} className="flex flex-row gap-2">
                        <span className="font-semibold">{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analytic.recommendations && (
                <div className="bg-contrast-100 p-4 rounded-lg shadow overflow-x-auto scrollbar-hide">
                  <p className="text-sm break-words whitespace-pre-wrap">{JSON.stringify(analytic.recommendations, null, 2)}</p>
                </div>
              )}

              {analytic.stats_creator && (
                <div className="bg-contrast-100 p-4 rounded-lg shadow overflow-x-auto scrollbar-hide">
                  <p className="text-sm break-words whitespace-pre-wrap">{JSON.stringify(analytic.stats_creator, null, 2)}</p>
                </div>
              )}

              {analytic.stats_content && (
                <div className="bg-contrast-100 p-4 rounded-lg shadow overflow-x-auto scrollbar-hide">
                  <p className="text-sm break-words whitespace-pre-wrap">{JSON.stringify(analytic.stats_content, null, 2)}</p>
                </div>
              )}

            </div>
          </div>
        )
      })} */}

    </div>
  );
};

export default AnalyticsCreatorConsumer; 