'use client';

import React from 'react';
import { NostrArticleEventProps } from '@/types/nostr';
import NostrEventCardBase from './NostrEventCardBase';
import '../feed/feed.scss';

export const ArticleEventCard: React.FC<NostrArticleEventProps> = (props) => {
  const { event } = props;

  // Parse the article content - typically articles may have JSON metadata
  let title = '';
  let summary = '';
  let image = '';
  
  try {
    // Check if the content is JSON
    const content = JSON.parse(event.content);
    title = content.title || '';
    summary = content.summary || content.abstract || '';
    image = content.image || '';
  } catch (e) {
    // If not JSON, try to extract title from first line or content
    const lines = event.content.split('\n');
    title = lines[0] || event.content.substring(0, 50);
    summary = event.content.substring(0, 120) + '...';
  }

  return (
    <div className="article-event-card">
      <NostrEventCardBase {...props}>
        <div className="mt-2">
          <h3>{title}</h3>

          {image && (
            <div className="media-container mb-3">
              <img 
                src={image} 
                alt={title} 
                className="image-content"
              />
            </div>
          )}

          <div className="text-gray-600 dark:text-gray-300 mb-4">
            {summary}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-3 text-gray-500 dark:text-gray-400 text-sm">
              <button className="flex items-center hover:text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Like
              </button>
              <button className="flex items-center hover:text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            </div>
            <button className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors">
              Read More
            </button>
          </div>
        </div>
      </NostrEventCardBase>
    </div>
  );
};

export default ArticleEventCard; 