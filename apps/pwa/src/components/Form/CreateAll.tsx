'use client';

import { useState, useEffect } from 'react';
import { useSendNote, useNostrContext } from 'afk_nostr_sdk';
import { NostrForm, NostrFormData } from '@/components/Form/NostrForm';
import { useUIStore } from '@/store/uiStore';
import { TokenCreateForm } from '../launchpad/TokenCreateForm';
import { NostrArticleForm } from './NostrArticleForm';
import { CreateBrandForm } from '../Brand/CreateBrandForm';
import DebateCreateForm from '../Debate/DebateCreateForm';
enum CreateType {
  POST = 'post',
  ARTICLE = 'article',
  TOKEN = 'token',
  BRAND = 'brand',
  DEBATE = 'debate',
  COMMUNITY = 'community',
}
export default function CreateAll() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState('');
  const sendNote = useSendNote();
  const { ndk } = useNostrContext()
  const [createType, setCreateType] = useState<CreateType>(CreateType.POST);
  
  const { showToast } = useUIStore();
  const handleSubmit = async (data: NostrFormData) => {
    
    if(ndk.pool?.connectedRelays().length === 0) {
      await ndk.connect()
    }

    if(!content) {
      showToast({
        message: 'Content is required',
        type: 'error'
      });
      return
    }
    try {
      await sendNote.mutate({
        content,
        tags: []
      }, {
        onSuccess() {
          setContent('');
          setIsModalOpen(false);
          showToast({
            message: 'Event created successfully',
            type: 'success'
          });
        }
      });
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Now safe to use browser APIs
  }, []);

  return (
    <div className="container mx-auto p-4">


      <div className="flex flex-row gap-2 overflow-x-auto scrollbar-hide rounded-xl p-2 shadow-md justify-start"> 
        <button className={`btn btn-secondary ${createType === CreateType.POST ? 'btn-primary' : ''}`} onClick={() => setCreateType(CreateType.POST)}>Post</button>
        <button className={`btn btn-secondary ${createType === CreateType.TOKEN ? 'btn-primary' : ''}`} onClick={() => setCreateType(CreateType.TOKEN)}>Token</button>

        <button className={`btn btn-secondary ${createType === CreateType.ARTICLE ? 'btn-primary' : ''}`} onClick={() => setCreateType(CreateType.ARTICLE)}>Article</button>
        <button className={`btn btn-secondary ${createType === CreateType.BRAND ? 'btn-primary' : ''}`} onClick={() => setCreateType(CreateType.BRAND)}>Brand</button>
        <button className={`btn btn-secondary ${createType === CreateType.DEBATE ? 'btn-primary' : ''}`} onClick={() => setCreateType(CreateType.DEBATE)}>Debate</button>

      </div>

      {createType === CreateType.POST && (
        <NostrForm
          onSubmit={handleSubmit}
          content={content}
          setContent={setContent}
        />
      )}

      {createType === CreateType.ARTICLE && (
        <div>
          <h1>Article</h1>
          <NostrArticleForm onSubmit={handleSubmit}></NostrArticleForm>
        </div>
      )}

      {createType === CreateType.TOKEN && (
        <div>
          <h1>Token</h1>
          <TokenCreateForm></TokenCreateForm>
        </div>
      )}

      {createType === CreateType.BRAND && (
        <div>
          <h1>Brand</h1>
          <CreateBrandForm></CreateBrandForm>
        </div>
      )}

      {createType === CreateType.DEBATE && (
        <div>
          <h1>Debate</h1>
          <DebateCreateForm></DebateCreateForm>
        </div>
      )}
      
      

    
  
    </div>
  );
}