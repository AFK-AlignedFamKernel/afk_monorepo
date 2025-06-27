"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { useUIStore } from "@/store/uiStore";
import { useAppStore } from "@/store/app";
import { Provider } from '@supabase/supabase-js';
import { api, fetchWithAuth } from '@/lib/api';
import CreatorCard from "../profile/CreatorCard";
import { ContentCreator } from "@/types";

import { useCreatorsStore } from '@/store/creators';
import { IContentCreator } from '@/types/brand';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '../small/icon-component';
import PageCreator from './PageCreator';

interface ITableCreatorsProps {
  isRedirect?: boolean;
}
export const TableCreators: React.FC<ITableCreatorsProps> = ({ isRedirect = false }) => {
  const { user, session } = useAppStore();
  const { showToast } = useUIStore();
  const [platform, setPlatform] = useState<Provider>();
  const [handle, setHandle] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<any>(null);

  const { contentCreators: contentCreatorsStore, setContentCreators: setContentCreatorsStore } = useCreatorsStore()
  const [creators, setCreators] = useState<IContentCreator[]>(contentCreatorsStore || []);

  const [contentCreators, setContentCreators] = useState<IContentCreator[]>(contentCreatorsStore || []);
  const [isFetchContentDone, setIsFetchContentDone] = useState(false);
  const fetchCreators = async () => {
    try {
      if (isFetchContentDone) {
        return;
      }

      // const res = await api.content_creator.list();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/content-creator`, {
        method: 'GET',
      });
      const data = await res.json();
      console.log("data", data)
      // console.log("res", res)
      setCreators(data.length > 0 ? data : []);
      setContentCreatorsStore(data.length > 0 ? data : []);
      setIsFetchContentDone(true)
    } catch (error) {
      console.error("Error fetching creators:", error);
    }
    finally {
      setIsFetchContentDone(true)
    }
  };

  useEffect(() => {

    if (!isFetchContentDone && contentCreators?.length === 0) {
      console.log("fetching creators")
      fetchCreators();
    }
  }, [isFetchContentDone, contentCreators, contentCreatorsStore]);

  const fetchMyContentCreatorProfile = async () => {

    try {
      if (!user) {
        showToast({
          type: "error",
          message: "Connect you"
        })
      }

      const res = await api.content_creator.my_profile()
      // const res = await fetchWithAuth("/content-creator/my-profile", {
      //   method: 'GET',
      //   // body: JSON.stringify({
      //   //   id: session?.user?.id,
      //   //   user_id: session?.user?.id,
      //   //   proof_url: proofUrl
      //   // })

      // })
      // console.log("res", res)
      setIsFetchContentDone(true)
    } catch (error) {
      console.log("error", error)
    }

  }
  // useEffect(() => {

  //   if (!isFetchContentDone && user) {
  //     fetchMyContentCreatorProfile()
  //   }

  // }, [isFetchContentDone, user])

  // console.log("creators", creators)
  return (
    <div className="rounded-xl shadow-lg bg-card p-4 w-full md:max-w-3xl mx-auto overflow-x-auto">
      {/* <h3 className="text-sm font-semibold mb-2">All Connected & Verified Creators</h3> */}

      {creators?.length === 0 && (
        <div className="flex flex-row justify-center">
          <p className="text-sm text-muted-foreground">No creators found</p>
          <div className="flex flex-row justify-center">
            <button className="bg-blue-500 text-white p-2 rounded-md" onClick={() => {
              setIsFetchContentDone(false)
              fetchCreators()
            }}>
              <Icon name="RefreshIcon" className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {!selectedCreator && (
        <table className="min-w-full text-sm">

          <thead>
            <tr className="bg-muted">
              <th className="px-4 py-2 text-left font-semibold">Creator</th>
              <th className="px-4 py-2 text-left font-semibold">Socials</th>
            </tr>
          </thead>

          <tbody>

            {creators && creators?.length > 0 && creators
              .map((creator: IContentCreator | any, index: number) => (
                <tr
                  key={`${creator.id}-${index}`}
                  className={
                    `transition hover:bg-muted/60 ${index % 2 === 0 ? 'bg-muted/40' : 'bg-transparent'}`
                  }
                  onClick={() => {
                    if (!isRedirect) {
                      setSelectedCreator(creator)
                    } else {
                      // router.push(`/content-creator/profile/${creator.slug_name}`)
                    }
                  }}
                >
                  <td className="px-4 py-3 flex items-center gap-3 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <Image
                        src={creator?.avatar_url || `/assets/icons/${creator.slug_name}.png`}
                        alt={creator.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover border shadow"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/assets/icons/default.png'; }}
                      />
                      <span className="font-medium">{creator.name}</span>
                    </div>
                  </td>

                  <td>
                    {creator.identities && (
                      <div className="flex gap-2 mt-2">
                        {Object.entries(creator.identities).map(([platformIndex, platform]: [string, any]) => {

                          if (platform && typeof platform === 'object' && 'provider' in platform && platform.provider === "twitter") {
                            return (
                              <div key={platformIndex}>
                                {/* <p
                                    key={platformIndex}
                                    className="text-blue-500 hover:underline text-sm"
                                  >
                                    {platform?.name}
                                  </p> */}
                                <Link href={`https://x.com/${platform?.identity_data?.user_name ?? platform?.identity_data?.name}`} target="_blank" rel="noopener noreferrer">
                                  <Image src="/assets/icons/twitter.svg" alt="Twitter" width={20} height={20} className="hover:opacity-80 bg-gray-500 rounded-full p-1" />
                                </Link>
                              </div>
                            )
                          }
                          // return (
                          //   <div key={platformIndex}>
                          //     <p
                          //       key={platformIndex}
                          //       className="text-blue-500 hover:underline text-sm"
                          //     >
                          //     </p>
                          //   </div>
                          // )
                        })}
                      </div>
                    )}
                  </td>
                  <td>
                    <Link href={`/content-creator/profile/${creator.slug_name}`}>
                      View
                    </Link>
                  </td>
                  {/* <td className="px-4 py-3 min-w-[120px]">
                      {creator?.twitter_handle ? (
                        <a
                          href={`https://x.com/${creator.twitter_handle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {creator.twitter_handle}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td> */}
                </tr>
              ))}

          </tbody>
        </table>
      )}



      {selectedCreator && selectedCreator.slug_name && (
        <div className="">
          <div >
            <Icon name="BackIcon" size={20} onClick={() => setSelectedCreator(null)} />
          </div>
          <PageCreator slug={selectedCreator.slug_name} />
        </div>
      )}


    </div>
  );
};

export default TableCreators;