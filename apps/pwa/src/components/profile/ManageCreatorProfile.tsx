"use client"
import React, { useEffect, useState } from 'react';
import { useUIStore } from "@/store/uiStore";
import { useAppStore } from "@/store/app";
import { Provider } from '@supabase/supabase-js';
import { api, fetchWithAuth } from '@/lib/api';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Icon } from '../small/icon-component';
import { Oauth } from './Oauth';
import Accordion from '../small/accordion';
import SupabaseLink from './SupabaseLink';
import LinkAccount from '../ContentCreator/profile/LinkAccount';
import { ContentCreator } from '@/types';
import { TagsForm } from '../Form/TagsForm';
import { useAccount } from '@starknet-react/core';
import { LaunchpadCard } from '../launchpad/LaunchpadCard';
import Link from 'next/link';
import { useCreatorsStore } from '@/store/creators';
import { IContentCreator } from '@/types/brand';
import { logClickedEvent } from '@/lib/analytics';
import Image from 'next/image';
  

export const ManageCreatorProfile: React.FC = () => {
  const { user, session } = useAppStore();
  const { myContentCreatorProfile: creatorStore, setMyContentCreatorProfile: setCreatorStore } = useCreatorsStore()

  const [contentCreator, setContentCreator] = useState<IContentCreator | undefined>(creatorStore ?? undefined)
  const [isFetchContentDone, setIsInitialFetchUser] = useState(false)

  const { showToast } = useUIStore();
  const [platform, setPlatform] = useState<Provider>();
  const [handle, setHandle] = useState(creatorStore?.name ?? '');
  const [proofUrl, setProofUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const { address } = useAccount()

  const fileUpload = useFileUpload();
  const [fileUrl, setFileUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [slugName, setSlugName] = useState(creatorStore?.slug_name ?? '');
  const [bio, setBio] = useState(creatorStore?.bio ?? '');
  const [tokenAddress, setTokenAddress] = useState<string | undefined>(creatorStore?.token_address ?? undefined);
  const [starknetAddress, setStarknetAddress] = useState(creatorStore?.starknet_address ?? address);
  const [btcAddress, setBtcAddress] = useState(creatorStore?.btc_address ?? '');
  const [formData, setFormData] = useState<ContentCreator | null>({
    name: creatorStore?.name ?? '',
    slug_name: creatorStore?.slug_name ?? '',
    avatar_url: creatorStore?.avatar_url ?? '',
    bio: creatorStore?.bio ?? '',
    topics: creatorStore?.topics ?? [],
    token_address: creatorStore?.token_address ?? '',
    id: creatorStore?.id ?? '',
    owner_id: creatorStore?.owner_id ?? '',
    is_verified: false,
  })


  const [topics, setTopics] = useState<string[]>(creatorStore?.topics ?? [])
  const [unverifedSocials, setUnverifedSocials] = useState<{
    handle: string,
    provider: string,
  }[]>([])
  const [verifiedSocials, setVerifiedSocials] = useState<string[]>([])
  const [nostrAddress, setNostrAddress] = useState<string>('')
  const [ludAddress, setLudAddress] = useState<string>('')
  const [tokensAddress, setTokensAddress] = useState<string[]>([])
  const [creatorToken, setCreatorToken] = useState<string>('')



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
      setTopics(res?.topics ?? [])
      setHandle(res?.name)
      setBio(res?.bio)
      setTokenAddress(res?.token_address)
      console.log("res", res)
      setContentCreator(res)
      setIsInitialFetchUser(true);
      setCreatorStore(res)
    } catch (error) {
      console.log("error", error)
    }

  }
  useEffect(() => {

    if (!isFetchContentDone && user && !creatorStore && !contentCreator) {
      fetchMyContentCreatorProfile()
    }

  }, [isFetchContentDone, user, creatorStore, contentCreator])

  const handleUpdateFromIdentity = async () => {
    let fileUrl = '';
    if (file) {

      const res = await fileUpload.mutateAsync(file);
      setFileUrl(res.data?.url)
      fileUrl = res.data?.url
    }

    console.log("tokenAddress", tokenAddress)
    console.log("starknetAddress", starknetAddress)
    console.log("address", address)
    console.log("btcAddress", btcAddress)
    console.log("slugName", slugName)
    console.log("topics", topics)

    logClickedEvent('update_creator_profile', 'creator', 'update_creator_profile', 1)

    const res = await fetchWithAuth("/content-creator/update/verify_identity", {
      method: 'POST',
      body: JSON.stringify({
        id: session?.user?.id,
        user_id: session?.user?.id,
        proof_url: proofUrl,
        slug_name: slugName,
        topics: topics,
        token_address: tokenAddress,
        starknet_address: starknetAddress,
        evm_address: address,
        btc_address: btcAddress,
        bio: bio,
        is_active: true
      })
    })
    if (res) {
      showToast({
        type: "success",
        message: "Account updated!"
      })
    }
  }

  if (!user) {
    return <div>
      <p>Please connect your account</p>
      <Oauth />
    </div>
  }
  return (
    <div className="max-w-xl w-full mx-auto rounded-2xl shadow-lg px-4 py-8 sm:px-2 sm:py-4 my-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className='text-lg font-semibold text-center'>Manage your profile</h2>
        <button onClick={() => fetchMyContentCreatorProfile()} className="hover:bg-gray-100 dark:hover:bg-contrast-200 rounded-full p-2 transition">
          <Icon name="RefreshIcon" size={18} className='w-5 h-5 text-gray-500' />
        </button>
      </div>

      {/* Profile Info Section */}
      <div className='flex flex-col gap-6 rounded-xl p-4 mb-6'>
        <div className="flex flex-col gap-2">
          <label className='text-sm font-medium'>Handle</label>
          <input type="text" placeholder='Handle' value={handle} onChange={(e) => setHandle(e.target.value)} className="w-full input input-bordered focus:ring-2 focus:ring-primary/50" />
        </div>
        <div className="flex flex-col gap-2">
          <label className='text-sm font-medium'>Slug Name: link to your profile</label>
          <input type="text" placeholder='Slug Name' value={slugName} onChange={(e) => setSlugName(e.target.value)} className="w-full input input-bordered focus:ring-2 focus:ring-primary/50" />
        </div>
        <div className="flex flex-col gap-2">
          <label className='text-sm font-medium'>Bio</label>
          <input type="text" placeholder='Bio' value={bio} onChange={(e) => setBio(e.target.value)} className="w-full input input-bordered focus:ring-2 focus:ring-primary/50" />
        </div>
      </div>

      {/* Starknet Address Section */}
      <div className='flex flex-col gap-4 rounded-xl p-4 mb-6'>
        <label className='text-sm font-medium'>Tip to Stake token address</label>
        <div className='flex flex-col md:flex-row gap-2 items-stretch md:items-center'>
          <input type="text" placeholder='Tip to Stake token address' value={starknetAddress} onChange={(e) => setStarknetAddress(e.target.value as `0x${string}`)} className="w-full input input-bordered focus:ring-2 focus:ring-primary/50" />
          {address &&
            <div className='flex flex-row md:flex-col gap-2 items-center md:items-start'>
              <p className="text-xs break-all mt-2 md:mt-0">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
              <div className="flex gap-2">
                <button className='btn btn-secondary p-2 flex items-center gap-1' onClick={() => {
                  setStarknetAddress(address);
                  showToast({
                    type: "success",
                    message: "Starknet address used!"
                  })
                }}>
                  <Icon name="CheckIcon" size={16} className='w-4 h-4' /> Use
                </button>
                <button className='btn p-2 flex items-center gap-1' onClick={() => navigator.clipboard.writeText(address)}>
                  <Icon name="CopyIcon" size={16} className='w-4 h-4' />
                </button>
              </div>
            </div>}
        </div>
        {address && (
          <div className="p-3 rounded-lg mt-2">
            <p className='text-xs font-medium'>Current Starknet Address</p>
            <p className="text-xs mb-2">Click to use this address</p>
            <div className="flex gap-2 items-center">
              <button className='btn p-2 flex items-center gap-1' onClick={() => navigator.clipboard.writeText(address)}>
                <Icon name="CopyIcon" size={16} className='w-4 h-4' />
              </button>
            </div>
            <p className="text-xs break-all mt-2">{address}</p>
          </div>
        )}
      </div>

      {/* Topics Section */}
      <div className="mb-6">
        <TagsForm tags={topics} setTags={setTopics} />
      </div>

      {/* Token Address Section */}
      <div className="flex flex-col gap-2 rounded-xl p-4 mb-6">
        <label className='text-sm font-medium'>Select your token address</label>
        <input type="text" placeholder='Your token address' value={tokenAddress ?? ''} onChange={(e) => setTokenAddress(e.target.value)} className="w-full input input-bordered focus:ring-2 focus:ring-primary/50" />
        {tokenAddress && (
          <div className="p-3 rounded-lg mt-2">
            <p className='text-xs font-medium'>Token Address</p>
            <p className="text-xs break-all">{tokenAddress}</p>
            <Link href={`/launchpad/${tokenAddress}`} target='_blank' className="flex items-center gap-1 text-xs text-blue-600 mt-1 hover:underline">
              <Icon name="ExternalLinkIcon" size={16} className='w-4 h-4' />
              View external
            </Link>
          </div>
        )}
      </div>

      {/* File Upload Section */}
      <div className="flex flex-col gap-2 rounded-xl p-4 mb-6">
        <label className='text-sm font-medium'>Profile Image</label>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
        {/* <button
          onClick={() => file && setFileUrl(URL.createObjectURL(file))}
          className="btn btn-secondary mt-2 w-full flex items-center gap-2"
        >
          <Icon name="AddPostIcon" size={16} className='w-4 h-4' /> Upload
        </button> */}
        {fileUrl && (
          <div className="mt-2 flex justify-center">
            <Image src={fileUrl} alt="File" className="max-w-[160px] h-auto rounded-lg border shadow object-cover" />
          </div>
        )}
      </div>

      {/* Feedback Section */}
      {status === 'verified' && (
        <div className="alert alert-success mt-4 flex items-center gap-2"><Icon name="CheckIcon" size={18} /> Account linked and verified!</div>
      )}
      {status === 'error' && error && (
        <div className="alert alert-error mt-4 flex items-center gap-2"><Icon name="XCheckIcon" size={18} /> {error}</div>
      )}

      {/* Actions Section */}
      <div className='mt-8 space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='flex flex-col gap-3'>
            <p className='text-sm'>{!contentCreator ? "Create" : "Update"} your profile</p>
            <button className='btn btn-primary w-full flex items-center gap-2 text-base font-semibold py-2' onClick={handleUpdateFromIdentity}>
              <Icon name={!contentCreator ? "CreateIcon" : "EditIcon"} size={18} className="w-5 h-5" />
              {!contentCreator ? "Create" : "Update"}
            </button>
          </div>
        </div>
      </div>

      {/* Accordion Section */}
      <div className="mt-10">
        <Accordion
          items={[
            {
              title: "Content Creator Profile",
              content: (
                <div className="p-2">
                  <p className='text-base font-medium mb-2'>Profile Details</p>
                  <div className="space-y-1 text-sm">
                    <p>Name: {contentCreator?.name}</p>
                    <p>Slug: {contentCreator?.slug_name}</p>
                    <p>Avatar: {contentCreator?.avatar_url}</p>
                    <p>Bio: {contentCreator?.bio}</p>
                    <p>Token: {contentCreator?.token_address}</p>
                    <p>Topics: {contentCreator?.topics?.join(', ')}</p>
                  </div>
                </div>
              )
            },
            {
              title: "Supabase Link",
              content: <SupabaseLink />
            },
            // {
            //   title: "Link Account",
            //   content: <LinkAccount />
            // },
            {
              title: "Oauth",
              content: <Oauth />
            },
          ]}
        />
      </div>
    </div>
  );
};

export default ManageCreatorProfile;