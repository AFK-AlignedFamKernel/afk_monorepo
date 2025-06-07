"use client"
import React, { useState } from 'react';
import { supabase } from "@/lib/supabase";
import { useUIStore } from "@/store/uiStore";
import { useAppStore } from "@/store/app";
import { Provider } from '@supabase/supabase-js';
import { fetchWithAuth } from '@/lib/api';

const PLATFORMS = [
  { label: 'Twitter (OAuth or Proof)', value: 'twitter', oauth: true, proof: true },
  { label: 'GitHub (OAuth)', value: 'github', oauth: true, proof: false },
  { label: 'Discord (OAuth)', value: 'discord', oauth: true, proof: false },
  // { label: 'Nostr (Proof Only)', value: 'nostr', oauth: false, proof: true },
  // { label: 'Farcaster (Proof Only)', value: 'farcaster', oauth: false, proof: true },
];

export const SupabaseLink: React.FC = () => {
  const { user } = useAppStore();
  const { showToast } = useUIStore();
  const [platform, setPlatform] = useState<Provider>();
  const [handle, setHandle] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const selectedPlatform = PLATFORMS.find((p) => p.value === platform);

  const handleOAuth = async () => {
    if (!user) {
      showToast({
        message: "Please sign in first",
        type: "error"
      });
      return;
    }

    setStatus('verifying');
    setError(null);

    if (!platform) {
      setStatus('error');
      setError('Platform is required.');
      return;
    }

    try {
      console.log('platform', platform);
      // supabase.auth.onAuthStateChange((event, session) => {
      //   console.log('event', event);
      //   if(event == "USER_UPDATED") {
      //     fetchWithAuth('/content-creator/verify_identity', {
      //       method: 'POST',
      //       body: JSON.stringify({
      //         id: session?.user?.id,
      //         user_id: session?.user?.id,
      //         proof_url: proofUrl
      //       })
      //     })

      //   }
      //   // console.log('session', session);
      // });
      // const { data, error } = await supabase.auth.signInWithOAuth({
      //   provider: platform,
      //   options: {
      //     // skipBrowserRedirect: true,
      //     // redirectTo: `${window.location.origin}/auth/callback`
      //   }
      // });

      if (platform == "twitter") {

      } else {

      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: platform,
        // options: {
        //   // skipBrowserRedirect: true,
        //   // redirectTo: `${window.location.origin}/auth/callback`
        // }
      });
      console.log('data', data);
      console.log('error', error);

      if (data) {
        console.log('data', data);
        // if (error) throw error;

        showToast({
          message: "Successfully linked account",
          type: "success"
        });
        setStatus('verified');
      }




    } catch (err) {
      setStatus('error');
      setError(err.message);
      showToast({
        message: "Failed to link account",
        type: "error"
      });
    }
  };

  const handleLinkIdentity = async () => {
    if (!user) {
      showToast({
        message: "Please sign in first",
        type: "error"
      });
      return;
    }

    setStatus('verifying');
    setError(null);

    if (!platform) {
      setStatus('error');
      setError('Platform is required.');
      return;
    }

    try {
      console.log('platform', platform);
      // supabase.auth.onAuthStateChange((event, session) => {
      //   console.log('event', event);
      //   if(event == "USER_UPDATED") {
      //     fetchWithAuth('/content-creator/verify_identity', {
      //       method: 'POST',
      //       body: JSON.stringify({
      //         id: session?.user?.id,
      //         user_id: session?.user?.id,
      //         proof_url: proofUrl
      //       })
      //     })

      //   }
      //   // console.log('session', session);
      // });
      // const { data, error } = await supabase.auth.signInWithOAuth({
      //   provider: platform,
      //   options: {
      //     // skipBrowserRedirect: true,
      //     // redirectTo: `${window.location.origin}/auth/callback`
      //   }
      // });

      if (platform == "twitter") {

      } else {

      }

      const { data, error } = await supabase.auth.linkIdentity({
        provider: platform,
        // options: {
        //   // skipBrowserRedirect: true,
        //   // redirectTo: `${window.location.origin}/auth/callback`
        // }
      });
      console.log('data', data);
      console.log('error', error);

      if (data) {
        console.log('data', data);
        // if (error) throw error;

        showToast({
          message: "Successfully linked account",
          type: "success"
        });
        setStatus('verified');
      }

      setStatus("idle");




    } catch (err) {
      setStatus('error');
      setError(err.message);
      showToast({
        message: "Failed to link account",
        type: "error"
      });
    }
  };
  const handleProof = async () => {
    if (!user) {
      showToast({
        message: "Please sign in first",
        type: "error"
      });
      return;
    }

    if (!proofUrl) {
      setStatus('error');
      setError('Proof URL is required.');
      return;
    }

    setStatus('verifying');
    setError(null);

    try {
      const { data, error } = await supabase
        .from('social_proofs')
        .insert([
          {
            user_id: user.id,
            platform,
            handle,
            proof_url: proofUrl,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      showToast({
        message: "Proof submitted for verification",
        type: "success"
      });
      setStatus('verified');
    } catch (err) {
      setStatus('error');
      setError(err.message);
      showToast({
        message: "Failed to submit proof",
        type: "error"
      });
    }
  };

  return (
    <div className="p-4 border rounded-lg dark:bg-contrast-100 shadow space-y-4">
      <h3 className="text-xl font-semibold mb-2">Link Social Account</h3>
      <div>
        <label className="block mb-1 font-medium">Platform</label>
        <select
          className="input input-bordered w-full"
          value={platform}
          onChange={(e) => {
            setPlatform(e.target.value as Provider);
            setStatus('idle');
            setError(null);
          }}
        >
          <option value="">Select platform...</option>
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {platform && selectedPlatform?.oauth && (
        <button
          className="btn btn-primary w-full mt-2"
          onClick={handleLinkIdentity}
          disabled={status === 'verifying'}
        >
          {status === 'verifying' ? 'Verifying...' : `Link via OAuth`}
        </button>
      )}

      {platform && (
        <div>
          <label className="block mb-1 font-medium">Handle</label>
          <input
            className="input input-bordered w-full"
            placeholder="@yourhandle or username"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
        </div>
      )}
      
      {platform && selectedPlatform?.proof && (
        <div className="mt-2">
          <label className="block mb-1 font-medium">Proof URL</label>
          <input
            className="input input-bordered w-full"
            placeholder="Paste proof link (tweet, gist, nostr note, etc.)"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
          />
          <button
            className="btn btn-secondary w-full mt-2"
            onClick={handleProof}
            disabled={status === 'verifying'}
          >
            {status === 'verifying' ? 'Verifying...' : 'Verify via Proof'}
          </button>
        </div>
      )}
      {status === 'verified' && (
        <div className="alert alert-success mt-2">Account linked and verified!</div>
      )}
      {status === 'error' && error && (
        <div className="alert alert-error mt-2">{error}</div>
      )}
    </div>
  );
};

export default SupabaseLink;