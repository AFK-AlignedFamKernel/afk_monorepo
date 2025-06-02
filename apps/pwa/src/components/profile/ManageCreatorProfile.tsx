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
  const [tokenAddress, setTokenAddress] = useState('');
  const [starknetAddress, setStarknetAddress] = useState(address);
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
        topics: topics
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

    const res = await fetchWithAuth("/content-creator/update/verify_identity", {
      method: 'POST',
      body: JSON.stringify({
        id: session?.user?.id,
        user_id: session?.user?.id,
        proof_url: proofUrl,
        slug_name: slugName,
        topics: topics
      })
    })
    if (res) {
      showToast({
        type: "success",
        message: "Account updated!"
      })
    }
  }
  return (
    <div className="p-4 m-2 rounded-lg dark:bg-contrast-100 shadow">
      <p className='text-sm'>Manage your profile</p>

      <button onClick={() => {
        fetchMyContentCreatorProfile()
      }}>
        <Icon name="RefreshIcon" size={16} className='w-4 h-4' />
      </button>

      <div className='flex gap-2 flex-col'>
        <input type="text" placeholder='Handle' value={handle} onChange={(e) => setHandle(e.target.value)} />
        <input type="text" placeholder='Slug Name' value={slugName} onChange={(e) => setSlugName(e.target.value)} />
        <input type="text" placeholder='Bio' value={bio} onChange={(e) => setBio(e.target.value)} />
        <input type="text" placeholder='Tip to Stake token address' value={starknetAddress} onChange={(e) => setStarknetAddress(e.target.value as `0x${string}`)} />

        {address && <div>
          <p className='text-sm'>Current Starknet Address</p>
          <p> Click to used this address</p>
          <button className='btn btn-secondary p-2' onClick={() => {
            setStarknetAddress(address)
          }}>Used</button>
          <button className='btn  p-2' onClick={() => {
            navigator.clipboard.writeText(address)
          }}><Icon name="CopyIcon" size={16} className='w-4 h-4' /></button>
          <p>{address}</p>
        </div>}
      </div>



      <TagsForm tags={topics} setTags={setTopics} />

      <input type="text" placeholder='Your token address' value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} />

      {tokenAddress && <div>
        <p className='text-sm'>Token Address</p>
        <p>{tokenAddress}</p>
        <Link href={`/launchpad/${tokenAddress}`} target='_blank'>
          <Icon name="ExternalLinkIcon" size={16} className='w-4 h-4' />
          View external
        </Link>
      </div>}


      <Accordion
        items={[{
          title: "Content Creator Profile",
          content: <>
            <div>
              <p className='text-sm'>Handle</p>
              {contentCreator?.name}
              {contentCreator?.slug_name}
              {contentCreator?.avatar_url}
              {contentCreator?.bio}
              {contentCreator?.token_address}
              {contentCreator?.topics}
            </div>
          </>
        }]}
      />


      <div>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button onClick={() => {
          if (file) {
            setFileUrl(URL.createObjectURL(file))
          }
        }}>Upload</button>
        {fileUrl && <img src={fileUrl} alt="File" />}
      </div>
      {status === 'verified' && (
        <div className="alert alert-success mt-2">Account linked and verified!</div>
      )}
      {status === 'error' && error && (
        <div className="alert alert-error mt-2">{error}</div>
      )}

      <div className='flex gap-2 flex-col'>



        <div className='flex gap-2 flex-row justify-between flex-wrap basis-1/2 items-center'>

          <div className='flex gap-2 flex-col'>
            <p className='text-sm text-gray-500'>Update your profile</p>
            <button className='btn btn-primary' onClick={handleUpdateFromIdentity}>Update</button>

          </div>

          <div className='flex gap-2 flex-col w-1/3'>
            <p className='text-sm text-gray-500'>Verify your social network identity</p>
            <button className='btn btn-secondary' onClick={handleVerifyFromIdentity}>Verify</button>

          </div>
        </div>




      </div>

      <Accordion
        items={[{
          title: "Oauth",
          content: <Oauth />
        },
        {
          title: "Supabase Link",
          content: <SupabaseLink />
        },
        {
          title: "Link Account",
          content: <LinkAccount />
        }]}
      />



    </div>
  );
};

export default ManageCreatorProfile;