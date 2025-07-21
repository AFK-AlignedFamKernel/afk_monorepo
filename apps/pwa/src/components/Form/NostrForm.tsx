import React, { useState } from 'react';
import classNames from 'classnames';
import { useFileUpload } from '@/hooks/useFileUpload';
import { logClickedEvent } from '@/lib/analytics';
import { Icon } from '../small/icon-component';
import styles from '@/styles/components/_nostr-form.module.scss';
import { ButtonPrimary } from '../button/Buttons';
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

  const [file, setFile] = useState<File | null>(null);
  const fileUpload = useFileUpload();

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
      logClickedEvent('try_publish_note', "nostr_note", formData?.type)
      onSubmit(formData);
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
        {/* <label htmlFor="file" className="nostr-form__label font-semibold text-sm">File</label> */}
        <label htmlFor="file" className={styles['nostr-form__label'] + ' inline-block w-full cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded px-4 py-2 text-center font-medium transition flex items-center justify-center gap-2'}>
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