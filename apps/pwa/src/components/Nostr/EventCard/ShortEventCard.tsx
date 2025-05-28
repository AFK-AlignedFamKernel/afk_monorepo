'use client';

import React, { useEffect, useState } from 'react';
import { NostrShortEventProps } from '@/types/nostr';
import NostrEventCardBase from './NostrEventCardBase';
import { NostrEvent, NDKUserProfile, NDKEvent } from '@nostr-dev-kit/ndk';

interface ShortEventCardProps extends NostrShortEventProps {
  event: NDKEvent;
  profile?: NDKUserProfile;
  isReadMore?: boolean;
}

export const ShortEventCard: React.FC<ShortEventCardProps> = (props) => {
  const { event, profile, isReadMore } = props;

  console.log('event', event);

  const [mediaUrlState, setMediaUrlState] = useState<string | undefined>();
  // Parse media URL from content or tags
  let mediaUrl = '';
  let caption = '';


  const extractAllVideoUrls = () => {
    try {
      // Try to parse JSON format first
      const content = JSON.parse(event.content);
      mediaUrl = content.media || content.url || '';
      caption = content.caption || content.text || '';
    } catch (e) {
      // If not JSON, check tags for media URL
      const mediaTags = event.tags.filter(tag => tag[0] === 'media' || tag[0] === 'video' || tag[0] === 'image');
      if (mediaTags.length > 0) {
        mediaUrl = mediaTags[0][1] || '';
        setMediaUrlState(mediaUrl);
      }
      caption = event.content;
    }
  }

  // If we still don't have media, check if content is a URL
  if (!mediaUrl && event.content.match(/^https?:\/\/.*\.(mp4|mov|avi|webm)/i)) {
    mediaUrl = event.content;
    caption = '';
  }

  const extractVideoURL = (event: NostrEvent) => {

    const tags = event?.tags?.find((tag) => tag?.[0] === 'url' || tag?.[0] == "imeta")?.[1] || '';

    if (tags.includes('url:')) {
      return tags.split('url:')[1].trim();
    } else if (tags.includes('etc:')) {
      return tags.split('etc:')[1].trim();
    }
    const urlMatch = tags.match(/(https?:\/\/[^\s]+\.(mp4|mov|avi|mkv|webm|gif))/i);
    if (urlMatch) {
      return urlMatch[0];
    }
    return tags
  };

  useEffect(() => {
    const videoUrl = extractVideoURL(event);
    console.log('videoUrl', videoUrl);
    setMediaUrlState(videoUrl);
    mediaUrl = videoUrl;
  }, [event]);


  const isVideo = mediaUrlState && mediaUrlState.match(/\.(mp4|webm|mov)$/i);

  console.log('mediaUrl', mediaUrl);
  console.log('mediaUrlState', mediaUrlState);
  return (
    <div className="short-event-card">
      <NostrEventCardBase {...props}>
        <div className="mt-2">
          {mediaUrlState && (
            <div className={`media-container ${isVideo ? 'media-container--video' : ''}`}
              // style={{
              //   height: 'calc(100vh - 180px)', // Subtracting header + card padding
              //   width: '100%',
              //   objectFit: 'contain',
              //   // backgroundColor: '#000'
              // }}
            >
              {isVideo ? (
                <video
                  src={mediaUrlState}
                  controls
                  loop
                  className="video-player"
                  // style={{
                  //   height: 'calc(100vh - 180px)', // Subtracting header + card padding
                  //   width: '100%',
                  //   objectFit: 'contain',
                  //   // backgroundColor: '#000'
                  // }}
                />
              ) : (
                <img
                  src={mediaUrlState}
                  alt="Media content"
                  className="image-content"
                />
              )}
            </div>
          )}

          {caption && (
            <div className="text-gray-800 dark:text-gray-200 mb-3">
              {caption}
            </div>
          )}

          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-sm">
            <div className="flex space-x-4">
              <button className="flex items-center hover:text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Like
              </button>
              <button className="flex items-center hover:text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Comment
              </button>
            </div>
            <button className="flex items-center hover:text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </div>
      </NostrEventCardBase>
    </div>
  );
};

export default ShortEventCard; 