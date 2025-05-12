import React, { useState } from 'react';
import classNames from 'classnames';
import '../../styles/components/_nostr-form.scss';

export type NostrEventType = 'note' | 'article';

interface NostrFormProps {
  onSubmit: (data: NostrFormData) => Promise<void>;
  type?: NostrEventType;
  className?: string;
  initialData?: Partial<NostrFormData>;
  content?: string;
  setContent?: (content: string) => void;
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
}) => {
  const [formData, setFormData] = useState<NostrFormData>({
    content: initialData?.content || '',
    title: initialData?.title || '',
    tags: initialData?.tags || [],
    type: type,
  });

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
      onSubmit(formData);
    }
  };

  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData({
          ...formData,
          tags: [...formData.tags, newTag],
        });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  return (
    <form
      className={classNames('nostr-form', className)}
      onSubmit={handleSubmit}
      data-theme="light"
    >
      {formData.type === 'article' && (
        <div className="nostr-form__field">
          <label htmlFor="title" className="nostr-form__label">
            Title
          </label>
          <input
            type="text"
            id="title"
            className={classNames('nostr-form__input', {
              'nostr-form__input--error': errors.title,
            })}
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Enter title"
          />
          {errors.title && (
            <span className="nostr-form__error">{errors.title}</span>
          )}
        </div>
      )}

      <div className="nostr-form__field">
        <label htmlFor="content" className="nostr-form__label">
          Content
        </label>
        <textarea
          id="content"
          className={classNames('nostr-form__textarea', {
            'nostr-form__textarea--error': errors.content,
          })}
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          placeholder="What's on your mind?"
          rows={formData.type === 'article' ? 10 : 4}
        />
        {errors.content && (
          <span className="nostr-form__error">{errors.content}</span>
        )}
      </div>

      <div className="nostr-form__field">
        <label htmlFor="tags" className="nostr-form__label">
          Tags
        </label>
        <div className="nostr-form__tags">
          {formData.tags.map((tag) => (
            <span key={tag} className="nostr-form__tag">
              #{tag}
              <button
                type="button"
                className="nostr-form__tag-remove"
                onClick={() => removeTag(tag)}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            id="tags"
            className="nostr-form__tag-input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagAdd}
            placeholder="Add tags (press Enter)"
          />
        </div>
      </div>

      <div className="nostr-form__actions">
        <button type="submit" className="nostr-form__submit">
          {formData.type === 'article' ? 'Publish Article' : 'Post Note'}
        </button>
      </div>
    </form>
  );
}; 