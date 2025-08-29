import React, { useState } from 'react';
import classNames from 'classnames';
import { useFileUpload } from '@/hooks/useFileUpload';
import { logClickedEvent } from '@/lib/analytics';
import { Icon } from '../small/icon-component';
import styles from '@/styles/components/_nostr-form.module.scss';
import { ButtonPrimary } from '../button/Buttons';
import { useAuth, useNostrContext, useSendNote, useSendVideoShortEvent } from 'afk_nostr_sdk';
import { useUIStore } from '@/store/uiStore';
import { useQueryClient } from '@tanstack/react-query';
import { NDKKind } from '@nostr-dev-kit/ndk';

export type NostrEventType = 'note' | 'article';

interface NostrFormProps {
  onSubmit: (data: NostrFormData) => Promise<void>;
  type?: NostrEventType;
  className?: string;
  initialData?: Partial<NostrFormData>;
  content?: string;
  setContent?: (content: string) => void;
  setTitle?: (title: string) => void;
}

export interface NostrFormData {
  content?: string;
  title?: string;
  tags?: string[];
  type?: NostrEventType;
}

export const NostrForm: React.FC<NostrFormProps> = ({
  onSubmit,
  type = 'note',
  className,
  initialData,
  content,
  setContent,
  setTitle,
}) => {
  const [formData, setFormData] = useState<NostrFormData>({
    content: initialData?.content || '',
    title: initialData?.title || '',
    tags: initialData?.tags || [],
    type: type,
  });

  const { publicKey } = useAuth()

  const { ndk } = useNostrContext()
  const { showToast } = useUIStore();
  const sendNote = useSendNote();
  const sendVideoShort = useSendVideoShortEvent();
  const [file, setFile] = useState<File | null>(null);
  const fileUpload = useFileUpload();

  const queryClient = useQueryClient();
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof NostrFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NostrFormData, string>> = {};

    if (!formData?.content?.trim()) {
      newErrors.content = 'Content is required';
    }

    if (formData?.type === 'article' && !formData?.title?.trim()) {
      newErrors.title = 'Title is required for articles';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e?.preventDefault();
    if (validateForm()) {
      handleSubmitNostrEvent();
    }
  };

  const handleSubmitNostrEvent = async () => {


    logClickedEvent('try_publish_note', 'nostr', 'try_publish_note', 1)
    if (!publicKey) {
      return showToast({ type: "error", message: "Please connect you" })
    }

    if (!formData.content || formData.content?.length == 0) {
      showToast({ type: 'error', message: 'Please add a note, image, or video' });
      return;

    }


    let imageUrl: string | undefined;
    let mediaUrl: string | undefined;

    if (file) {
      try {
        const result = await fileUpload.mutateAsync(file);
        logClickedEvent('upload_image_to_ipfs', 'nostr', 'upload_image_to_ipfs', 1);
        // Fix: result may be {} and not have a 'data' property, so check for url in result or result.data
        let url: string | undefined = undefined;
        if (result && typeof result === 'object') {
          if ('data' in result && result.data && typeof result.data === 'object' && 'url' in result.data) {
            url = (result.data as { url?: string }).url;
          } else if ('url' in result) {
            url = (result as { url?: string }).url;
          }
        }
        if (url) {
          imageUrl = url;
          mediaUrl = url;
          logClickedEvent('upload_image_to_ipfs_success', 'nostr', 'upload_image_to_ipfs_success', 1);
        }
      }
      catch (error) {
        console.log('image upload error', error);
        logClickedEvent('upload_image_to_ipfs_error', 'nostr', 'upload_image_to_ipfs_error', 1);
      }
    }
    try {


      // Convert Quill delta to markdown string
      // const converter = new Markdow(noteDelta?.ops || [], {});
      // const html = converter.convert();
      // const turndownService = new TurndownService();


      if (!file || !file?.type.includes("mp4")) {
        sendNote.mutate(
          {
            content: formData.content || '',
            tags: [
              ...(file && imageUrl ? [['image', imageUrl], ['media', imageUrl], ["type", file.type]] : []),
              ...(formData.tags?.map((tag) => ['tag', tag]) || []),
            ],
          },
          {
            onSuccess() {
              showToast({ type: 'success', message: 'Note sent successfully' });
              queryClient.invalidateQueries({ queryKey: ['rootNotes'] });
              logClickedEvent('publish_note_success', 'nostr', 'publish_note_success', 1)
            },
            onError(e) {
              console.log('error', e);
              showToast({
                type: 'error',
                message: 'Error! Note could not be sent. Please try again later.',
              });
              logClickedEvent('publish_note_error_hook', 'nostr', 'publish_note_error', 1)
            },
          },
        );
      }
      else if (file?.type.includes("mp4") && imageUrl) {
        console.log('sending video short');

        sendNote.mutate(
          {
            content: formData.content || '',
            tags: [
              ...(file && imageUrl ? [['video', imageUrl], ['media', imageUrl], ["type", file.type]] : []),
              ...(formData.tags?.map((tag) => ['tag', tag]) || []),
            ],
          },
          {
            onSuccess() {
              showToast({ type: 'success', message: 'Note sent successfully' });
              queryClient.invalidateQueries({ queryKey: ['rootNotes'] });
              logClickedEvent('publish_note_success', 'nostr', 'publish_note_success', 1)
            },
            onError(e) {
              console.log('error', e);
              showToast({
                type: 'error',
                message: 'Error! Note could not be sent. Please try again later.',
              });
              logClickedEvent('publish_note_error_hook', 'nostr', 'publish_note_error', 1)
            },
          },
        );
        // Build imeta tag according to NIP-92
        // Example: ["imeta", "url https://nostr.build/i/my-image.jpg", "m image/jpeg", "dim 1920x1080", ...]
        const imetaTag = [
          "imeta",
          `url ${imageUrl}`,
          ...(file?.type ? [`m ${file.type}`] : []),
          "dim 1920x1080",
          "x 1920",
          `fallback ${imageUrl}`,
        ];
        sendVideoShort.mutate({
          content: formData.content || '',
          title: formData.title || '',
          videoUrl: imageUrl,
          ndkKind: NDKKind.ShortVideo,
          publishedAt: Math.round(Date.now() / 1000),
          isVertical: false,
          videoMetadata: [],
          tags: [
            ...(file && imageUrl ? [['image', imageUrl], ['media', imageUrl], ["type", file.type]] : []),
            ...(formData.tags?.map((tag) => ['tag', tag]) || []),
            ...(file && imageUrl ? [imetaTag] : []),
          ],
        }, {
          onSuccess() {
            showToast({ type: 'success', message: 'Video sent successfully' });
            queryClient.invalidateQueries({ queryKey: ['rootVideos'] });
            logClickedEvent('publish_video_success', 'nostr', 'publish_video_success', 1)
          },
          onError(e) {
            console.log('error', e);
            showToast({
              type: 'error',
              message: 'Error! Video could not be sent. Please try again later.',
            });
            logClickedEvent('publish_video_error', 'nostr', 'publish_video_error', 1)
          }
        });

        sendVideoShort.mutate({
          content: formData.content || '',
          title: formData.title || '',
          videoUrl: imageUrl,
          ndkKind: NDKKind.VerticalVideo,
          publishedAt: Math.round(Date.now() / 1000),
          isVertical: true,
          videoMetadata: [],
          tags: [
            ...(file && imageUrl ? [['image', imageUrl], ['media', imageUrl], ["type", file.type]] : []),
            ...(formData.tags?.map((tag) => ['tag', tag]) || []),
            ...(file && imageUrl ? [imetaTag] : []),
          ],
        }, {
          onSuccess() {
            queryClient.invalidateQueries({ queryKey: ['rootVideos'] });
            logClickedEvent('publish_video_success', 'nostr', 'publish_video_success', 1)
          },
          onError(e) {
            console.log('error', e);
            showToast({
              type: 'error',
              message: 'Error! Video could not be sent. Please try again later.',
            });
            logClickedEvent('publish_video_error', 'nostr', 'publish_video_error', 1)
          }
        });
      }
    } catch (error) {
      console.log('sendArticle error', error);
      logClickedEvent('publish_note_error', 'nostr', 'publish_note_error', 1)
    }

  };


  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!formData?.tags?.includes(newTag)) {
        setFormData({
          ...formData,
          tags: [...formData?.tags || [], newTag],
        });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData?.tags?.filter((tag) => tag !== tagToRemove) || [],
    });
  };

  return (
    <form
      className={classNames(styles['nostr-form'], 'space-y-4 bg-[var(--card-bg)] rounded-lg p-4 shadow-md', className)}
      onSubmit={handleSubmit}
      data-theme="light"
    >
      {formData.type === 'article' && (
        <div className={styles['nostr-form__field'] + ' flex flex-col gap-1'}>
          <label htmlFor="title" className={styles['nostr-form__label'] + ' font-semibold text-sm'}>Title</label>
          <input
            type="text"
            id="title"
            className={classNames(styles['nostr-form__input'], 'w-full px-3 py-2 rounded border', {
              [styles['nostr-form__input--error']]: errors.title,
              [styles['nostr-form__input--success']]: !errors.title,
            })}
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value })
              setContent?.(e.target.value)
            }}
            placeholder="Enter title"
            aria-label="Title"
          />
          {errors.title && (
            <span className={styles['nostr-form__error'] + ' text-xs text-red-500 flex items-center gap-1 mt-1'}><span>⛔</span>{errors.title}</span>
          )}
        </div>
      )}

      <div className={styles['nostr-form__field'] + ' flex flex-col gap-1'}>
        <label htmlFor="content" className={styles['nostr-form__label'] + ' font-semibold text-sm'}>Content</label>
        <textarea
          id="content"
          className={classNames(styles['nostr-form__textarea'], 'w-full px-3 py-2 rounded border resize-y', {
            [styles['nostr-form__textarea--error']]: errors.content,
            [styles['nostr-form__textarea--success']]: !errors.content,
          })}
          value={formData.content}
          onChange={(e) => {
            setFormData({ ...formData, content: e.target.value })
            setContent?.(e.target.value)
          }}
          placeholder="What's on your mind?"
          rows={formData.type === 'article' ? 10 : 4}
          aria-label="Content"
        />
        {errors.content && (
          <span className={styles['nostr-form__error'] + ' text-xs text-red-500 flex items-center gap-1 mt-1'}><span>⛔</span>{errors.content}</span>
        )}
      </div>

      <div className={styles['nostr-form__field'] + ' flex flex-col gap-1'}>
        <label htmlFor="file" className={styles['nostr-form__label'] + ' inline-block w-full cursor-pointer  ounded px-4 py-2 text-center font-medium transition flex items-center justify-center gap-2'}>
          {/* File icon */}
          <svg className="inline-block mr-2" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {file ? file.name : 'Choose File'}
          <input

            type="file" id="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)}

          />
        </label>
      </div>

      <div className={styles['nostr-form__field'] + ' flex flex-col gap-1'}>
        <label htmlFor="tags" className={styles['nostr-form__label'] + ' font-semibold text-sm'}>Tags</label>
        <div className={styles['nostr-form__tags'] + ' flex flex-wrap gap-2 items-center'}>
          {formData?.tags?.map((tag) => (
            <span key={tag} className={styles['nostr-form__tag'] + ' inline-flex items-center bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-medium'}>
              #{tag}
              <button
                type="button"
                className={styles['nostr-form__tag-remove'] + ' ml-2 text-blue-500 hover:text-red-500 focus:outline-none'}
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className={styles['nostr-form__tags'] + ' flex flex-wrap gap-2 items-center'}>
          <input
            type="text"
            id="tags"
            className={styles['nostr-form__tag-input'] + ' flex-1 min-w-[175px] px-2 py-1 rounded border border-gray-300 focus:border-blue-400 focus:outline-none text-xs'}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagAdd}
            placeholder="Add tags (press Enter)"
            aria-label="Add tag"
          />

          <div className={styles['nostr-form__tags-hint'] + ' flex flex-row gap-2 items-center justify-center'}>
            <p className={styles['nostr-form__tags-hint-text'] + ' text-xs text-contrast'}>
              Press enter to add tag
            </p>
            {/* <button className='btn btn-basic border border-afk-accent-cyan' onClick={() => handleTagAdd}>
                Click to add tag <Icon name="AddIcon" size={16} />
              </button> */}
          </div>


        </div>
      </div>

      <div className="nostr-form__actions mt-4">
        <ButtonPrimary type="submit" className="w-full bg-blue-700 text-white font-semibold py-2 rounded shadow hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition">
          {formData.type === 'article' ? 'Publish Article' : 'Post Note'}
        </ButtonPrimary>
      </div>
    </form>
  );
}; 