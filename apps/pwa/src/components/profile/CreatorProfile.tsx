"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { useUIStore } from "@/store/uiStore";
import { useAppStore } from "@/store/app";
import { Provider } from '@supabase/supabase-js';
import { fetchWithAuth } from '@/lib/api';



export const CreatorProfile: React.FC = () => {
  const { user, session } = useAppStore();
  const { showToast } = useUIStore();
  const [platform, setPlatform] = useState<Provider>();
  const [handle, setHandle] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const [contentCreator, setContentCreator] = useState()
  const [isFetchContentDone, setIsInitialFetchUser] = useState(false)

  const fetchMyContentCreatorProfile = async () => {

    if (!isFetchContentDone) {
      return;
    }

    try {
      if (!user) {
        showToast({
          type: "error",
          message: "Connect you"
        })
      }
      const res = fetchWithAuth("/content-creator/my-profile", {
        method: 'GET',

      })
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


  const handleUpdateFromIdentity = async () => {

    fetchWithAuth("/content-creator/verify_identity", {
      method: 'POST',
      body: JSON.stringify({
        id: session?.user?.id,
        user_id: session?.user?.id,
        proof_url: proofUrl
      })
    })
  }
  return (
    <div className="p-4 border rounded-lg dark:bg-contrast-100 shadow space-y-4">
      <h3 className="text-xl font-semibold mb-2">Link Social Account</h3>


      <div>

        <button onClick={handleUpdateFromIdentity}>Verify</button>
      </div>
      {status === 'verified' && (
        <div className="alert alert-success mt-2">Account linked and verified!</div>
      )}
      {status === 'error' && error && (
        <div className="alert alert-error mt-2">{error}</div>
      )}
    </div>
  );
};

export default CreatorProfile;