import React from 'react';
import { Icon } from '@/components/small/icon-component';
import styles from '@/styles/nostr/algo-feed.module.scss';

export type ContentType = 'posts' | 'articles' | 'shorts' | 'tags';

export const CONTENT_TYPE_TABS = [
  {
    id: 'posts' as ContentType,
    label: 'Posts',
    kinds: [1, 6],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: 'articles' as ContentType,
    label: 'Articles',
    kinds: [30023],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
        <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
      </svg>
    ),
  },
  {
    id: 'shorts' as ContentType,
    label: 'Shorts',
    kinds: [31000, 31001, 34236, 1063, 1064, 1065, 1066],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
    ),
  },
  {
    id: 'tags' as ContentType,
    label: 'Tags',
    kinds: [1, 30023],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
];

interface FilterModalProps {
  showFilterModal: boolean;
  onClose: () => void;
  activeContentType: ContentType;
  onContentTypeChange: (contentType: ContentType) => void;
  selectedTag: string | null;
  onTagSelect: (tag: string) => void;
  tagSearchInput: string;
  onTagSearchInputChange: (value: string) => void;
  onTagSearch: (e: React.FormEvent) => void;
  tags: string[];
  getCurrentData: () => any[];
  filterNotesByContentType: (notes: any[]) => any[];
}

export const FilterModal: React.FC<FilterModalProps> = ({
  showFilterModal,
  onClose,
  activeContentType,
  onContentTypeChange,
  selectedTag,
  onTagSelect,
  tagSearchInput,
  onTagSearchInputChange,
  onTagSearch,
  tags,
  getCurrentData,
  filterNotesByContentType
}) => {
  if (!showFilterModal) return null;

  return (
    <div className={styles['algo-feed__modal-overlay']} onClick={onClose}>
      <div className={styles['algo-feed__modal']} onClick={(e) => e.stopPropagation()}>
        <div className={styles['algo-feed__modal-header']}>
          <h3 className={styles['algo-feed__modal-title']}>Filter Content</h3>
          <button 
            onClick={onClose}
            className={styles['algo-feed__modal-close']}
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className={styles['algo-feed__modal-content']}>
          <div className={styles['algo-feed__filter-section']}>
            <h4 className={styles['algo-feed__filter-section-title']}>Content Type</h4>
            <div className={styles['algo-feed__content-type-grid']}>
              {CONTENT_TYPE_TABS.map((tab) => {
                const currentData = getCurrentData();
                const filteredCount = filterNotesByContentType(currentData).length;
                
                return (
                  <button
                    key={tab.id}
                    className={`${styles['algo-feed__content-type-option']} ${
                      activeContentType === tab.id ? styles['algo-feed__content-type-option--active'] : ''
                    }`}
                    onClick={() => onContentTypeChange(tab.id)}
                    title={`Show ${tab.label.toLowerCase()}`}
                  >
                    <span className={styles['algo-feed__content-type-icon']}>
                      {tab.icon}
                    </span>
                    <span className={styles['algo-feed__content-type-label']}>
                      {tab.label}
                    </span>
                    {filteredCount > 0 && (
                      <span className={styles['algo-feed__content-type-count']}>
                        {filteredCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {activeContentType === 'tags' && (
            <div className={styles['algo-feed__filter-section']}>
              <h4 className={styles['algo-feed__filter-section-title']}>Tags</h4>
              <form
                className={styles['nostr-searchbar']}
                onSubmit={onTagSearch}
              >
                <input
                  type="text"
                  className={styles['nostr-searchbar__input']}
                  value={tagSearchInput}
                  onChange={(e) => onTagSearchInputChange(e.target.value)}
                  placeholder="Search or add tag..."
                />
                <button
                  type="submit"
                  className={styles['nostr-searchbar__button']}
                  disabled={!tagSearchInput || tagSearchInput.trim().length === 0}
                >
                  <Icon name="SearchIcon" size={16} />
                </button>
              </form>
              <div className={styles['nostr-tags-row']}>
                {tags.slice(0, 12).map((tag, index) => (
                  <div
                    key={index}
                    className={`${styles['nostr-tag']} ${selectedTag === tag ? styles['selected'] : ''}`}
                    onClick={() => onTagSelect(tag)}
                  >
                    <span>{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles['algo-feed__modal-footer']}>
          <button 
            onClick={onClose}
            className={styles['algo-feed__modal-button']}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}; 