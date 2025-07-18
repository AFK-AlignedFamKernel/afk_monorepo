'use client';

import { useState, useEffect } from 'react';
import { useSendNote, useNostrContext } from 'afk_nostr_sdk';
import { NostrForm, NostrFormData } from '@/components/Form/NostrForm';
import { useUIStore } from '@/store/uiStore';
import { TokenCreateForm } from '../launchpad/TokenCreateForm';
import { NostrArticleForm } from './NostrArticleForm';
import { CreateBrandForm } from '../Brand/CreateBrandForm';
import DebateCreateForm from '../Debate/DebateCreateForm';
import { logClickedEvent } from '@/lib/analytics';
import FormChannelCreate from '../Nostr/Channel/FormChannelCreate';
enum CreateType {
  POST = 'post',
  ARTICLE = 'article',
  TOKEN = 'token',
  BRAND = 'brand',
  CHANNEL = 'channel',
  COMMUNITY = 'community',
  DEBATE = 'debate',
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
        {Object.entries(CreateType).filter(([key]) => key !== 'COMMUNITY').map(([key, value]) => {
          const isActive = createType === value;
          const isDark = typeof window !== 'undefined' && document.body.classList.contains('dark-mode');
          return (
            <button
              key={value}
              onClick={() => {
                setCreateType(value as CreateType)
                logClickedEvent(`create_${value}`, 'Interaction', 'Button Click', 1);
              }}
              style={{
                border: 'none',
                outline: 'none',
                background: isActive
                  ? (isDark ? '#18181b' : '#e5e7eb')
                  : (isDark ? 'transparent' : 'transparent'),
                color: isActive
                  ? (isDark ? '#fff' : '#18181b')
                  : (isDark ? '#cbd5e1' : '#334155'),
                fontWeight: isActive ? 700 : 500,
                fontFamily: 'var(--afk-font-primary, IBM Plex Sans, Arial, sans-serif)',
                borderRadius: '999px',
                padding: '0.5rem 1.25rem',
                fontSize: '1rem',
                transition: 'background 0.18s, color 0.18s',
                cursor: 'pointer',
                boxShadow: isActive ? '0 2px 8px 0 rgba(0,0,0,0.04)' : 'none',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {key.charAt(0) + key.slice(1).toLowerCase()}
            </button>
          );
        })}
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
          {/* <h1>Article</h1> */}
          <NostrArticleForm onSubmit={handleSubmit} type={CreateType.ARTICLE}></NostrArticleForm>
        </div>
      )}

      {createType === CreateType.TOKEN && (
        <div>
          {/* <h1>Token</h1> */}
          <TokenCreateForm></TokenCreateForm>
        </div>
      )}

      {createType === CreateType.BRAND && (
        <div>
          {/* <h1>Brand</h1> */}
          <CreateBrandForm></CreateBrandForm>
        </div>
      )}

      {createType === CreateType.DEBATE && (
        <div>
          {/* <h1>Debate</h1> */}
          <DebateCreateForm></DebateCreateForm>
        </div>
      )}

      {createType === CreateType.CHANNEL && (
        <div>
          {/* <h1>Channel</h1> */}
          <FormChannelCreate></FormChannelCreate>
        </div>
      )}
  
    </div>
  );
}