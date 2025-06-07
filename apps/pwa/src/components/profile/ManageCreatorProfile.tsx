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


export const ManageCreatorProfile: React.FC = () => {
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
    handle:string,
    provider:string,
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

    if (!isFetchContentDone && user) {
      fetchMyContentCreatorProfile()
    }

  }, [isFetchContentDone, user])


  const handleVerifyFromIdentity = async () => {

    let fileUrl = '';
    if (file) {

      const res = await fileUpload.mutateAsync(file);
      setFileUrl(res.data?.url)
      fileUrl = res.data?.url
    }


    const res = await fetchWithAuth("/content-creator/verify_identity", {
      method: 'POST',
      body: JSON.stringify({
        id: session?.user?.id,
        user_id: session?.user?.id,
        proof_url: proofUrl,
        slug_name: slugName,
        avatar_url: fileUrl,
        topics: topics,
        token_address: tokenAddress,
        starknet_address: starknetAddress,
        evm_address: address,
        btc_address: btcAddress,
        is_active: true
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
    <div className="max-w-md w-full mx-auto p-4 m-2 rounded-lg dark:bg-contrast-100 shadow overflow-x-hidden sm:p-2">
      <div className="flex justify-between items-center mb-4">
        <p className='text-sm'>Manage your profile</p>
        <button onClick={() => fetchMyContentCreatorProfile()}>
          <Icon name="RefreshIcon" size={16} className='w-4 h-4' />
        </button>
      </div>

      <div className='flex flex-col gap-3'>
        <input type="text" placeholder='Handle' value={handle} onChange={(e) => setHandle(e.target.value)} className="w-full" />
        <label className='text-sm font-medium'>Slug Name: link to your profile</label>
        <input type="text" placeholder='Slug Name' value={slugName} onChange={(e) => setSlugName(e.target.value)} className="w-full" />
        <label className='text-sm font-medium'>Bio</label>
        <input type="text" placeholder='Bio' value={bio} onChange={(e) => setBio(e.target.value)} className="w-full" />
        <label className='text-sm font-medium'>Tip to Stake token address</label>

        <div className='flex flex-col sm:flex-row gap-2 items-stretch sm:items-center'>
          <input type="text" placeholder='Tip to Stake token address' value={starknetAddress} onChange={(e) => setStarknetAddress(e.target.value as `0x${string}`)} className="w-full" />

          {address &&
            <div className='flex flex-row sm:flex-col gap-2 items-center sm:items-start'>
              <p className="text-sm break-all mt-2 sm:mt-0">{address?.slice(0, 6)}...{address?.slice(-4)}</p>

              <div className="flex gap-2">
                <button className='btn btn-secondary p-2' onClick={() => {
                  setStarknetAddress(address);
                  showToast({
                    type: "success",
                    message: "Starknet address used!"
                  })
                }}>Use</button>
                <button className='btn p-2' onClick={() => navigator.clipboard.writeText(address)}>
                  <Icon name="CopyIcon" size={16} className='w-4 h-4' />
                </button>
              </div>
            </div>}

        </div>

        {address && (
          <div className="p-3 rounded-lg">
            <p className='text-sm font-medium'>Current Starknet Address</p>
            <p className="text-sm text-gray-600 mb-2">Click to use this address</p>
            <div className="flex gap-2 items-center">
              <button className='btn p-2' onClick={() => navigator.clipboard.writeText(address)}>
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
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full" />
        <button
          onClick={() => file && setFileUrl(URL.createObjectURL(file))}
          className="btn btn-secondary mt-2 w-full"
        >
          Upload
        </button>
        {fileUrl && (
          <div className="mt-2">
            <img src={fileUrl} alt="File" className="max-w-full h-auto rounded-lg w-full object-contain" />
          </div>
        )}
      </div>

      {status === 'verified' && (
        <div className="alert alert-success mt-4">Account linked and verified!</div>
      )}
      {status === 'error' && error && (
        <div className="alert alert-error mt-4">{error}</div>
      )}

      <div className='mt-6 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='flex flex-col gap-2'>
            <p className='text-sm text-gray-500'>{!contentCreator ? "Create" : "Update"} your profile</p>
            <button className='btn btn-primary w-full' onClick={handleUpdateFromIdentity}>{!contentCreator ? "Create" : "Update"}</button>
          </div>

          {/* <div className='flex flex-col gap-2'>
            <p className='text-sm text-gray-500'>Verify your social network identity</p>
            <button className='btn btn-secondary w-full' onClick={handleVerifyFromIdentity}>Verify</button>
          </div> */}
        </div>
      </div>

      <div className="mt-6">
        <Accordion
          items={[
            {
              title: "Content Creator Profile",
              content: (
                <div className="p-2">
                  <p className='text-sm font-medium mb-2'>Profile Details</p>
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