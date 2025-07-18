'use client';

import React, { useEffect, useState } from 'react';
import { NostrShortEventProps } from '@/types/nostr';
import NostrEventCardBase from './NostrEventCardBase';
import { NostrEvent, NDKUserProfile, NDKEvent } from '@nostr-dev-kit/ndk';
import Image from 'next/image';
import styles from '@/styles/nostr/feed.module.scss';
import { Icon } from '@/components/small/icon-component';
import { logClickedEvent } from '@/lib/analytics';
import CommentContainer from './Comment/CommentContainer';
import { useProfile } from 'afk_nostr_sdk';

interface ShortEventCardProps extends NostrShortEventProps {
  event?: NDKEvent;
  profile?: NDKUserProfile;
  isReadMore?: boolean;
  className?: string;
  classNameNostrBase?: string;
}

export const ShortEventCard: React.FC<ShortEventCardProps> = (props) => {
  const { event, profile:profileProps, isReadMore } = props;

  console.log('event', event);

  const {data: profile} = useProfile({publicKey: event?.pubkey})
  console.log('profile', profile);
  const [isOpenComment, setIsOpenComment] = useState(false);

  const [mediaUrlState, setMediaUrlState] = useState<string | undefined>();
  // Parse media URL from content or tags
  let mediaUrl: string | undefined = undefined;
  let caption: string | undefined = undefined;


  const extractAllVideoUrls = () => {
    try {
      // Try to parse JSON format first
      const content = JSON.parse(event?.content ?? '');
      mediaUrl = content.media || content.url || '';
      caption = content.caption || content.text || '';
    } catch (e) {
      // If not JSON, check tags for media URL
      const mediaTags = event?.tags?.filter(tag => tag[0] === 'media' || tag[0] === 'video' || tag[0] === 'image');
      if (mediaTags && mediaTags.length > 0) {
        mediaUrl = mediaTags[0][1] || '';
        setMediaUrlState(mediaUrl);
      }
      caption = event?.content;
    }
  }

  // If we still don't have media, check if content is a URL
  if (!mediaUrl && event?.content?.match(/^https?:\/\/.*\.(mp4|mov|avi|webm)/i)) {
    mediaUrl = event?.content;
    caption = '';
  }

  const extractVideoURL = (event?: NostrEvent) => {

    if (!event) return undefined;

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
    // console.log('videoUrl', videoUrl);
    setMediaUrlState(videoUrl);
    mediaUrl = videoUrl;
  }, [event]);


  const isVideo = mediaUrlState && mediaUrlState.match(/\.(mp4|webm|mov)$/i);

  // console.log('mediaUrl', mediaUrl);
  // console.log('mediaUrlState', mediaUrlState);
  return (
    <div className={styles['short-event-card'] + ' rounded-md ' + props.className}>
      <NostrEventCardBase
        {...props}
        className={props.classNameNostrBase}
        profile={profile ?? profileProps}
      >
        <div className={styles.mt2}>
          {mediaUrlState && (
            <div className={`${styles.mediaContainer} ${isVideo ? styles.mediaContainerVideo : ''}`}
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
                  className={styles.videoPlayer}
                // style={{
                //   height: 'calc(100vh - 180px)', // Subtracting header + card padding
                //   width: '100%',
                //   objectFit: 'contain',
                //   // backgroundColor: '#000'
                // }}
                />
              ) : (
                <Image
                  src={mediaUrlState}
                  alt="Media content"
                  className={styles.imageContent}
                />
              )}
            </div>
          )}
          {caption && (
            <div className={styles.textGray800DarkTextGray200 + ' ' + styles.mb3}>
              {caption}
            </div>
          )}

          <div className={styles["action-buttons"] + " flex flex-row sm:flex-row gap-4 items-center justify-center my-4"}>
     
            <button
              onClick={() => {
                setIsOpenComment(!isOpenComment);
                logClickedEvent('reply_to_note', 'Interaction', 'Button Click', 1);
              }}>
              <Icon
                name="CommentIcon"
                size={20}
              />
            </button>
            <button
              onClick={() => {
                logClickedEvent('like_note', 'Interaction', 'Button Click', 1);
              }}>
              <Icon
                name="LikeIcon"
                size={20}
              />
            </button>
            <button
              className={styles["action-button"] + " " + styles["action-button-share"]}
              role="group"
              aria-label="Repost actions"
              onClick={() => {
                logClickedEvent('share_note', 'Interaction', 'Button Click', 1);
              }}>
              <Icon
                name="ShareIcon"
                size={20}
              />
            </button>
          </div>
        </div>

        {isOpenComment && (
          <div className={styles.commentContainer}>
            <CommentContainer event={event} />
          </div>
        )}
      </NostrEventCardBase>
    </div>
  );
};

export default ShortEventCard; 