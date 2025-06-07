"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { useUIStore } from "@/store/uiStore";
import { useAppStore } from "@/store/app";
import { Provider } from '@supabase/supabase-js';
import { api, fetchWithAuth } from '@/lib/api';



export const CreatorProfile: React.FC = () => {
  const { user, session } = useAppStore();
  const { showToast } = useUIStore();
  const [platform, setPlatform] = useState<Provider>();
  const [handle, setHandle] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const [slugName, setSlugName] = useState('');
  const [contentCreator, setContentCreator] = useState()
  const [isFetchContentDone, setIsInitialFetchUser] = useState(false)

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
      setIsInitialFetchUser(true)
    } catch (error) {
      console.log("error", error)
    }

  }
  useEffect(() => {

    if (!isFetchContentDone && user) {
      fetchMyContentCreatorProfile()
    }

  }, [isFetchContentDone, user])


  const handleVerifyFromIdentity = async () => {
    const res = await fetchWithAuth("/content-creator/verify_identity", {
      method: 'POST',
      body: JSON.stringify({
        id: session?.user?.id,
        user_id: session?.user?.id,
        proof_url: proofUrl,
        slug_name: slugName
      })
    })
    if (res) {
      showToast({
        type: "success",
        message: "Account linked and verified!"
      })
    }
  }

  const handleUpdateFromIdentity = async () => {
    const res = await fetchWithAuth("/content-creator/update/verify_identity", {
      method: 'POST',
      body: JSON.stringify({
        id: session?.user?.id,
        user_id: session?.user?.id,
        proof_url: proofUrl,
        slug_name: slugName
      })
    })
    if (res) {
      showToast({
        type: "success",
        message: "Account linked and verified!"
      })
    }
  }
  return (
    <div className="p-4 m-2 rounded-lg dark:bg-contrast-100 shadow space-y-4">

      <div className='flex gap-2 flex-col'>
        <input type="text" placeholder='Handle' value={handle} onChange={(e) => setHandle(e.target.value)} />
        <input type="text" placeholder='Slug Name' value={slugName} onChange={(e) => setSlugName(e.target.value)} />
      </div>
      {status === 'verified' && (
        <div className="alert alert-success mt-2">Account linked and verified!</div>
      )}
      {status === 'error' && error && (
        <div className="alert alert-error mt-2">{error}</div>
      )}

      <div className='flex gap-2 flex-col'>


        <button onClick={() => {
          fetchMyContentCreatorProfile()
        }}>
          Refresh page
        </button>
        <button onClick={handleUpdateFromIdentity}>Update</button>


        <p>Verify your Oauth connected account</p>
        <button onClick={handleVerifyFromIdentity}>Verify</button>

      </div>
    </div>
  );
};

export default CreatorProfile;