import React, { useEffect, useState, useMemo } from 'react';
import classNames from 'classnames';
import { useFileUpload } from '@/hooks/useFileUpload';
export type NostrEventType = 'note' | 'article';

interface TagsFormProps {
  className?: string;
  setContent?: (content: string) => void;
  setTags?: (tags: string[]) => void;
  tags?: string[];
}


export const TagsForm: React.FC<TagsFormProps> = ({
  className,
  setTags,
  tags,
}) => {


  const [file, setFile] = useState<File | null>(null);
  const fileUpload = useFileUpload();



  const [tagInput, setTagInput] = useState('');
  const [tagsInput, setTagsInput] = useState<string[]>(tags || []);

  const tagsRendered = useMemo(() => {
    const tags = tagsInput?.map((tag) => {
      return tag
    })
    return tags?.filter((tag) => tag !== '')
  }, [tagsInput])

  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags?.includes(newTag)) {
        if (setTags) {
          setTags([...tags || [], newTag]);
        }
        setTagsInput([...tagsInput, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (setTags) {
      setTags(tags?.filter((tag) => tag !== tagToRemove) || []);
    }
    setTagsInput(tagsInput?.filter((tag) => tag !== tagToRemove) || []);
  };

  return (
    <>



      <div className="nostr-form__field">
        <label htmlFor="tags" className="nostr-form__label">
          Tags
        </label>
        <div className="nostr-form__tags">
          {tagsRendered?.map((tag) => (
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
    </>
  );
}; 