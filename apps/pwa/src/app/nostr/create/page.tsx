'use client';

import { useState } from 'react';
import { useSendNote, useAuth } from 'afk_nostr_sdk';
import { Modal } from '@/components/Modal/Modal';
import { NostrForm, NostrFormData } from '@/components/Form/NostrForm';
import { useUIStore } from '@/store/uiStore';

export default function CreateNostrEvent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState('');
  const sendNote = useSendNote();
  const { publicKey } = useAuth();

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

  return (
    <div className="container mx-auto p-4">
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Create New Post
      </button>

      <NostrForm
        onSubmit={handleSubmit}
        content={content}
        setContent={setContent}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="md"
      >

        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Create New Post</h2>
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-32 p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
              placeholder="What's on your mind?"
            />
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Post
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}