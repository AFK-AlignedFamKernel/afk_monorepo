"use client"
import React, { useEffect, useState } from 'react';
import { useUIStore } from "@/store/uiStore";
import { useAppStore } from "@/store/app";
import { Provider } from '@supabase/supabase-js';
import { api, fetchWithAuth } from '@/lib/api';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Icon } from '../small/icon-component';
import Accordion from '../small/accordion';
import { ContentCreator } from '@/types';
import { TagsForm } from '../Form/TagsForm';
import { useAccount } from '@starknet-react/core';
import { LaunchpadCard } from '../launchpad/LaunchpadCard';
import Link from 'next/link';
import { Oauth } from '../profile/Oauth';
import Image from 'next/image';


export const CreateBrandForm: React.FC = () => {
  const { user, session } = useAppStore();
  const { showToast } = useUIStore();
  const [platform, setPlatform] = useState<Provider>();
  const [handle, setHandle] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<'create' | 'verify' | 'complete'>('create')
  const [stepNumber, setStepNumber] = useState(0)

  const { address } = useAccount()

  const fileUpload = useFileUpload();
  const [fileUrl, setFileUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [slugName, setSlugName] = useState('');
  const [bio, setBio] = useState('');
  const [tokenAddress, setTokenAddress] = useState<string | undefined>(undefined);
  const [starknetAddress, setStarknetAddress] = useState(address);
  const [btcAddress, setBtcAddress] = useState('');
  const [formData, setFormData] = useState<ContentCreator | null>({
    name: '',
    slug_name: '',
    avatar_url: '',
    bio: '',
    topics: [],
    token_address: '',
    id: '',
    owner_id: '',
    is_verified: false,
  })
  const [contentCreator, setContentCreator] = useState<ContentCreator | null>(null)
  const [isFetchContentDone, setIsInitialFetchUser] = useState(false)

  const [topics, setTopics] = useState<string[]>([])
  const [unverifedSocials, setUnverifedSocials] = useState<{
    handle: string,
    provider: string,
  }[]>([])
  const [verifiedSocials, setVerifiedSocials] = useState<string[]>([])
  const [nostrAddress, setNostrAddress] = useState<string>('')
  const [ludAddress, setLudAddress] = useState<string>('')
  const [tokensAddress, setTokensAddress] = useState<string[]>([])
  const [creatorToken, setCreatorToken] = useState<string>('')

  // --- Brand creation state ---
  const [brandName, setBrandName] = useState('');
  const [brandSlug, setBrandSlug] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [brandWebsite, setBrandWebsite] = useState('');
  const [brandTopics, setBrandTopics] = useState<string[]>([]);
  const [brandAvatar, setBrandAvatar] = useState<File | null>(null);
  const [brandAvatarUrl, setBrandAvatarUrl] = useState('');
  const [brandBanner, setBrandBanner] = useState<File | null>(null);
  const [brandBannerUrl, setBrandBannerUrl] = useState('');
  const [brandTokenAddress, setBrandTokenAddress] = useState('');
  const [brandStarknetAddress, setBrandStarknetAddress] = useState('');
  const [brandEvmAddress, setBrandEvmAddress] = useState('');
  const [brandBtcAddress, setBrandBtcAddress] = useState('');
  const [brandTwitter, setBrandTwitter] = useState('');
  const [brandDiscord, setBrandDiscord] = useState('');
  const [brandTelegram, setBrandTelegram] = useState('');
  const [brandLoading, setBrandLoading] = useState(false);

  const fetchMyContentCreatorProfile = async () => {

    try {
      // if (!user) {
      //   showToast({
      //     type: "error",
      //     message: "Connect you"
      //   })
      // }
      const res = await api.content_creator.my_profile()
      const slugName = res?.slug_name
      setSlugName(slugName)
      setTopics(res?.topics)
      setHandle(res?.name)
      setBio(res?.bio)
      setTokenAddress(res?.token_address)
      console.log("res", res)
      setContentCreator(res)
      setIsInitialFetchUser(true)
    } catch (error) {
      console.log("error", error)
    }

  }
  useEffect(() => {

    // if (!isFetchContentDone && user) {
    //   fetchMyContentCreatorProfile()
    // }

  }, [isFetchContentDone, user])

  // --- Brand creation handler ---
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrandLoading(true);
    setError(null);
    let avatarUrl = '';
    let bannerUrl = '';
    try {
      if (brandAvatar) {
        const res = await fileUpload.mutateAsync(brandAvatar);
        avatarUrl = res.data?.url;
        setBrandAvatarUrl(avatarUrl);
      }
      if (brandBanner) {
        const res = await fileUpload.mutateAsync(brandBanner);
        bannerUrl = res.data?.url;
        setBrandBannerUrl(bannerUrl);
      }
      const payload = {
        name: brandName,
        slug_name: brandSlug,
        description: brandDescription,
        avatar_url: avatarUrl || undefined,
        banner_url: bannerUrl || undefined,
        website_url: brandWebsite || undefined,
        topics: brandTopics,
        token_address: brandTokenAddress || undefined,
        starknet_address: brandStarknetAddress || undefined,
        evm_address: brandEvmAddress || undefined,
        btc_address: brandBtcAddress || undefined,
        twitter_handle: brandTwitter || undefined,
        discord_handle: brandDiscord || undefined,
        telegram_handle: brandTelegram || undefined,
        is_active: true,
      };
      const res = await fetchWithAuth('/brand/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res && !res.error) {
        showToast({ type: 'success', message: 'Brand created successfully!' });
        // Optionally reset form
        setBrandName(''); setBrandSlug(''); setBrandDescription(''); setBrandWebsite(''); setBrandTopics([]);
        setBrandAvatar(null); setBrandAvatarUrl(''); setBrandBanner(null); setBrandBannerUrl('');
        setBrandTokenAddress(''); setBrandStarknetAddress(''); setBrandEvmAddress(''); setBrandBtcAddress('');
        setBrandTwitter(''); setBrandDiscord(''); setBrandTelegram('');
      } else {
        showToast({ type: 'error', message: res?.error?.message || 'Failed to create brand' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Failed to create brand' });
    } finally {
      setBrandLoading(false);
    }
  };

  if (!user) {
    return <div>
      <p>Please connect your account</p>
      <Oauth />
    </div>
  }
  return (
    <div className="p-4 m-2 rounded-lg dark:bg-contrast-100 shadow overflow-x-hidden">
      {/* --- Brand Creation Form --- */}
      <div className="mb-8 border-b pb-6">
        <h2 className="text-xl font-bold mb-4">Create Your Brand</h2>
        <form onSubmit={handleCreateBrand} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Brand Name</label>
            <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)} required className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Slug Name</label>
            <input type="text" value={brandSlug} onChange={e => setBrandSlug(e.target.value)} required className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea value={brandDescription} onChange={e => setBrandDescription(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Website</label>
            <input type="url" value={brandWebsite} onChange={e => setBrandWebsite(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Topics</label>
            <TagsForm tags={brandTopics} setTags={setBrandTopics} />
          </div>
          <div>
            <label className="block text-sm font-medium">Avatar</label>
            <input type="file" accept="image/*" onChange={e => setBrandAvatar(e.target.files?.[0] || null)} className="w-full" />
            {brandAvatarUrl && <Image 
              width={100}
              height={100}
              src={brandAvatarUrl} alt="Avatar" className="max-w-xs mt-2 rounded" />}
          </div>
          <div>
            <label className="block text-sm font-medium">Banner</label>
            <input type="file" accept="image/*" onChange={e => setBrandBanner(e.target.files?.[0] || null)} className="w-full" />
            {brandBannerUrl && <Image 
              width={100}
              height={100}
            src={brandBannerUrl} alt="Banner" className="max-w-xs mt-2 rounded" />}
          </div>
          <div>
            <label className="block text-sm font-medium">Token Address</label>
            <input type="text" value={brandTokenAddress} onChange={e => setBrandTokenAddress(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Starknet Address</label>
            <input type="text" value={brandStarknetAddress} onChange={e => setBrandStarknetAddress(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">EVM Address</label>
            <input type="text" value={brandEvmAddress} onChange={e => setBrandEvmAddress(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">BTC Address</label>
            <input type="text" value={brandBtcAddress} onChange={e => setBrandBtcAddress(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Twitter Handle</label>
            <input type="text" value={brandTwitter} onChange={e => setBrandTwitter(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Discord Handle</label>
            <input type="text" value={brandDiscord} onChange={e => setBrandDiscord(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Telegram Handle</label>
            <input type="text" value={brandTelegram} onChange={e => setBrandTelegram(e.target.value)} className="w-full" />
          </div>

          <div className="mt-4">
            <label className='text-sm font-medium'>Select your token address</label>
            <input type="text" placeholder='Your token address' value={tokenAddress ?? ''} onChange={(e) => setTokenAddress(e.target.value)} className="w-full" />
          </div>


          {tokenAddress && (
            <div className="p-3 rounded-lg mt-2">
              <p className='text-sm font-medium'>Token Address</p>
              <p className="text-sm break-all">{tokenAddress}</p>
              <Link href={`/launchpad/${tokenAddress}`} target='_blank' className="flex items-center gap-1 text-sm text-blue-600 mt-1">
                <Icon name="ExternalLinkIcon" size={16} className='w-4 h-4' />
                View external
              </Link>
            </div>
          )}

          <p className='text-sm text-gray-500'>Create your brand</p>

          <button
            //  type="submit" 
            onClick={handleCreateBrand}
            className="btn btn-primary w-full" disabled={brandLoading}>{brandLoading ? 'Creating...' : 'Create Brand'}</button>
        </form>
      </div>



      {status === 'verified' && (
        <div className="alert alert-success mt-4">Account linked and verified!</div>
      )}
      {status === 'error' && error && (
        <div className="alert alert-error mt-4">{error}</div>
      )}

    </div>
  );
};

export default CreateBrandForm;