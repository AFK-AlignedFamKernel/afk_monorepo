"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { useUIStore } from "@/store/uiStore";
import { useAppStore } from "@/store/app";
import { Provider } from '@supabase/supabase-js';
import { api, fetchWithAuth } from '@/lib/api';
import CreatorCard from "./CreatorCard";
import { ContentCreator } from "@/types";
  
import { useCreatorsStore } from '@/store/creators';
import { IContentCreator } from '@/types/brand';

export const AllCreators: React.FC = () => {
  const { user, session } = useAppStore();
  const { showToast } = useUIStore();
  const [platform, setPlatform] = useState<Provider>();
  const [handle, setHandle] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);


  const {contentCreators:contentCreatorsStore, setContentCreators:setContentCreatorsStore} = useCreatorsStore()
  const [creators, setCreators] = useState<IContentCreator[]>(contentCreatorsStore || []);

  const [contentCreator, setContentCreator] = useState();
  const [isFetchContentDone, setIsFetchContentDone] = useState(false);
  const fetchCreators = async () => {
    try {
      if(isFetchContentDone) {
        return;
      }
      
      const res = await api.content_creator.list();
      console.log("res", res)
      setCreators(res);
      setContentCreatorsStore(res);
    } catch (error) {
      console.error("Error fetching creators:", error);
    }
  };

  useEffect(() => {

    if (!isFetchContentDone) {
      console.log("fetching creators")
      fetchCreators();
    }
  }, [isFetchContentDone]);

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
      console.log("res", res)
      setIsFetchContentDone(true)
    } catch (error) {
      console.log("error", error)
    }

  }
  useEffect(() => {

    if (!isFetchContentDone && user) {
      fetchMyContentCreatorProfile()
    }

  }, [isFetchContentDone, user])
 
  console.log("creators", creators)
  return (
    <div className="p-4 rounded-lg dark:bg-contrast-100 shadow space-y-4">
      <h3 className="text-xl font-semibold mb-2">All Connected & Verified Creators</h3>
      <div className="flex flex-row justify-center">
        <button className="bg-blue-500 text-white p-2 rounded-md" onClick={() => {
          setIsFetchContentDone(false)
          fetchCreators()
        }}>
          Refresh
        </button>
      </div>
     
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {creators && creators?.length > 0 && creators
          // .filter((creator: ContentCreator) => creator.owner_id && creator.is_verified)
          .map((creator: IContentCreator | any) => (
            <CreatorCard key={`${creator.id}-${creator.owner_id}`} creator={creator} />
          ))}
      </div>
    </div>
  );
};

export default AllCreators;