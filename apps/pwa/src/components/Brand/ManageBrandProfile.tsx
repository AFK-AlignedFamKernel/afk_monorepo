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


export const ManageBrandProfile: React.FC = () => {
  const { user, session } = useAppStore();
  const { showToast } = useUIStore();
  const [platform, setPlatform] = useState<Provider>();
  const [handle, setHandle] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

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

  // --- Brand management state ---
  const [myBrands, setMyBrands] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<any | null>(null);
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandBanner, setBrandBanner] = useState<File | null>(null);
  const [brandAvatar, setBrandAvatar] = useState<File | null>(null);
  const [brandBannerUrl, setBrandBannerUrl] = useState('');
  const [brandAvatarUrl, setBrandAvatarUrl] = useState('');

  const [brandTokenAddress, setBrandTokenAddress] = useState('');
  const [brandStarknetAddress, setBrandStarknetAddress] = useState('');
  const [brandEvmAddress, setBrandEvmAddress] = useState('');
  const [brandBtcAddress, setBrandBtcAddress] = useState('');
  const [brandTwitter, setBrandTwitter] = useState('');
  const [brandDiscord, setBrandDiscord] = useState('');
  const [brandTelegram, setBrandTelegram] = useState('');

  const [websiteUrl, setWebsiteUrl] = useState('');

  // Fetch user's brands on mount
  useEffect(() => {
    if (user) {
      api.brand.my().then(res => {
        setMyBrands(res?.brands || []);
      });
    }
  }, [user]);


  const fetchMyBrandProfile = async () => {
    const res = await api.brand.my()
    setMyBrands(res?.brands || []);
  }

  // When a brand is selected, prefill the form
  useEffect(() => {
    if (selectedBrand) {
      setHandle(selectedBrand.name || '');
      setSlugName(selectedBrand.slug_name || '');
      setBio(selectedBrand.bio || '');
      setTopics(selectedBrand.topics || []);
      setTokenAddress(selectedBrand.token_address || '');
      setStarknetAddress(selectedBrand.starknet_address || '');
      setBtcAddress(selectedBrand.btc_address || '');
      setFileUrl(selectedBrand.avatar_url || '');
      setBrandAvatarUrl(selectedBrand.avatar_url);
      setBrandBannerUrl(selectedBrand.banner_url);
      setBrandTokenAddress(selectedBrand.token_address || '');
      setBrandStarknetAddress(selectedBrand.starknet_address || '');
      setBrandEvmAddress(selectedBrand.evm_address || '');
      setBrandBtcAddress(selectedBrand.btc_address || '');
      setBrandTwitter(selectedBrand.twitter_handle || '');
      setBrandDiscord(selectedBrand.discord_handle || '');
      setBrandTelegram(selectedBrand.telegram_handle || '');
      setFile(null);
      setBrandAvatar(null);
      setBrandBanner(null);
    }
  }, [selectedBrand]);

  // --- Brand update handler ---
  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand) return;
    setBrandLoading(true);
    let avatarUrl = brandAvatarUrl;
    let bannerUrl = brandBannerUrl;
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
        name: handle,
        slug_name: slugName,
        bio: bio,
        topics: topics,
        token_address: tokenAddress,
        starknet_address: starknetAddress,
        btc_address: btcAddress,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        // add other fields as needed
      };
      const res = await api.brand.update(payload);
      if (res && !res.error) {
        showToast({ type: 'success', message: 'Brand updated successfully!' });
        // Optionally refresh brands
        api.brand.my().then(res => setMyBrands(res?.brands || []));
      } else {
        showToast({ type: 'error', message: res?.error?.message || 'Failed to update brand' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Failed to update brand' });
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
     
     <button className='btn' onClick={fetchMyBrandProfile}><Icon name="RefreshIcon" size={16} className='w-4 h-4' /></button>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Select your brand</label>
        <select
          className="w-full p-2 border rounded"
          value={selectedBrand?.slug_name || ''}
          onChange={e => {
            const brand = myBrands.find(b => b.slug_name === e.target.value);
            setSelectedBrand(brand || null);
          }}
        >
          <option value="">-- Select a brand --</option>
          {myBrands.map(brand => (
            <option key={brand.slug_name} value={brand.slug_name}>{brand.name} ({brand.slug_name})</option>
          ))}
        </select>
      </div>
      {selectedBrand && (
        <form onSubmit={handleUpdateBrand}>
          <div className='flex gap-4 flex-col'>
            <input type="text" placeholder='Brand Name' value={handle} onChange={(e) => setHandle(e.target.value)} className="w-full" />
            <label className='text-sm font-medium'>Slug Name: link to your profile</label>
            <input type="text" placeholder='Slug Name' value={slugName} onChange={(e) => setSlugName(e.target.value)} className="w-full" />
            <label className='text-sm font-medium'>Bio</label>
            <input type="text" placeholder='Bio' value={bio} onChange={(e) => setBio(e.target.value)} className="w-full" />
            <label className='text-sm font-medium'>Tip to Stake token address</label>
            <div className='flex gap-2 items-center'>
              <input type="text" placeholder='Tip to Stake token address' value={starknetAddress} onChange={(e) => setStarknetAddress(e.target.value as `0x${string}`)} className="w-full" />
              {address &&
                <div className='flex flex-col gap-2 items-center'>
                  <p className="text-sm break-all mt-2">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                  <div>
                    <button className='btn btn-secondary p-2' type="button" onClick={() => {
                      setStarknetAddress(address);
                      showToast({ type: "success", message: "Starknet address used!" })
                    }}>Use</button>
                    <button className='btn p-2' type="button" onClick={() => navigator.clipboard.writeText(address)}>
                      <Icon name="CopyIcon" size={16} className='w-4 h-4' />
                    </button>
                  </div>
                </div>}
            </div>
            {address && (
              <div className=" p-3 rounded-lg">
                <p className='text-sm font-medium'>Current Starknet Address</p>
                <p className="text-sm text-gray-600 mb-2">Click to use this address</p>
                <div className="flex gap-2 items-center">
                  <button className='btn p-2' type="button" onClick={() => navigator.clipboard.writeText(address)}>
                    <Icon name="CopyIcon" size={16} className='w-4 h-4' />
                  </button>
                </div>
                <p className="text-sm break-all mt-2">{address}</p>
              </div>
            )}
          </div>
          <div className="mt-4">
            <TagsForm tags={topics} setTags={setTopics} />
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
          <div className="mt-4">
            <label className='text-sm font-medium'>Avatar</label>
            <input type="file" accept="image/*" onChange={e => setBrandAvatar(e.target.files?.[0] || null)} className="w-full" />
            {brandAvatarUrl && <img src={brandAvatarUrl} alt="Avatar" className="max-w-xs mt-2 rounded" />}
          </div>
          <div className="mt-4">
            <label className='text-sm font-medium'>Banner</label>
            <input type="file" accept="image/*" onChange={e => setBrandBanner(e.target.files?.[0] || null)} className="w-full" />
            {brandBannerUrl && <img src={brandBannerUrl} alt="Banner" className="max-w-xs mt-2 rounded" />}
          </div>
          <div className="mt-4">
            <label className='text-sm font-medium'>Website</label>
            <input type="text" placeholder='Website' value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="w-full" />
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
          <button type="submit" className="btn btn-primary w-full mt-6" disabled={brandLoading}>{brandLoading ? 'Updating...' : 'Update Brand'}</button>
        </form>
      )}
    </div>
  );
};

export default ManageBrandProfile;