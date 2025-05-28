'use client';

import { useState, useEffect } from 'react';
import { useSendNote, useAuth } from 'afk_nostr_sdk';
import { NostrForm, NostrFormData } from '@/components/Form/NostrForm';
import { useUIStore } from '@/store/uiStore';
import { TokenCreateForm } from '../launchpad/TokenCreateForm';
import { NostrArticleForm } from './NostrArticleForm';
enum CreateType {
  POST = 'post',
  ARTICLE = 'article',
  TOKEN = 'token',
}
export default function CreateAll() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState('');
  const sendNote = useSendNote();
  const { publicKey } = useAuth();

  const [createType, setCreateType] = useState<CreateType>(CreateType.POST);

  
  
  const { showToast } = useUIStore();
  const handleSubmit = async (data: NostrFormData) => {
    
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


      <div className="flex flex-row gap-2"> 
        <button className="btn btn-secondary" onClick={() => setCreateType(CreateType.POST)}>Post</button>
        <button className="btn btn-secondary" onClick={() => setCreateType(CreateType.TOKEN)}>Token</button>

        <button className="btn btn-secondary" onClick={() => setCreateType(CreateType.ARTICLE)}>Article</button>


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
      
      

    
  
    </div>
  );
}