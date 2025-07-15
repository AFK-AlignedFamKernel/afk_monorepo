'use client';

import React, { useMemo, useState } from 'react';
import { NostrArticleEventProps } from '@/types/nostr';
import NostrEventCardBase from './NostrEventCardBase';
import { authStore, useReact, useReactions } from 'afk_nostr_sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'next/navigation';
import { NDKUserProfile, NDKEvent } from '@nostr-dev-kit/ndk';
import MarkdownIt from 'markdown-it';
import { TipNostr } from '../tips';
import { Icon } from '@/components/small/icon-component';
import CommentContainer from './CommentContainer';
import { QuoteRepostComponent } from './quote-repost-component';
import { ContentWithClickableHashtags } from './ClickableHashtags';
import { logClickedEvent } from '@/lib/analytics';
import { useNostrAuth } from '@/hooks/useNostrAuth';
import Image from 'next/image';
interface ArticleEventCardProps extends NostrArticleEventProps {
  profile?: NDKUserProfile;
  event: NDKEvent;
  isReadMore?: boolean;
  isClickableHashtags?: boolean;
}

export const ArticleEventCard: React.FC<ArticleEventCardProps> = ({ event, profile, isReadMore = true, isClickableHashtags = true }) => {
  const { publicKey } = authStore.getState();
  const userReaction = useReactions({ authors: [publicKey], noteId: event?.id });
  const react = useReact();
  const router = useRouter();
  const [isOpenComment, setIsOpenComment] = useState(false);
  const queryClient = useQueryClient();
  const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpandedTitle, setIsExpandedTitle] = useState(false);
  const { showToast, showModal } = useUIStore();
  // Parse the article content - typically articles may have JSON metadata
  let title = '';
  let summary = '';
  let image = '';
  const handleTipsModal = () => {
    showModal(<TipNostr event={event} profile={profile}></TipNostr>)
  }

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

  const isLiked = useMemo(
    () =>
      Array.isArray(userReaction.data) &&
      userReaction.data[0] &&
      userReaction.data[0]?.content !== '-',
    [userReaction.data],
  );

  const toggleLike = async () => {
    if (!event?.id) return;

    const isNostrConnected = handleCheckNostrAndSendConnectDialog();
    if (!isNostrConnected) return;

    await react.mutateAsync(
      { event, type: isLiked ? 'dislike' : 'like' },
      {
        onSuccess: () => {
          showToast({ type: 'success', message: 'Reaction updated' });

          queryClient.invalidateQueries({ queryKey: ['reactions', event?.id] });

          // scale.value = withSequence(
          //   withTiming(1.5, { duration: 100, easing: Easing.out(Easing.ease) }),
          //   withSpring(1, { damping: 6, stiffness: 200 }),
          // );
        },
      },
    );
  };

  const truncatedContent = !isExpanded && event.content.length > 200 ? `${event.content.slice(0, 200)}...` : event.content;



  const markdownContent = MarkdownIt({
    // html: false,
    html: true,
    linkify: true,
    typographer: true
  }).render(truncatedContent);

  return (
    <NostrEventCardBase event={event} profile={profile}>
      <div className="mt-2">
        <div className='flex items-center gap-2 cursor-pointer w-full max-w-full' onClick={() => setIsExpandedTitle(!isExpandedTitle)}>
          <h3 className='text-lg font-bold break-words whitespace-normal w-full max-w-full overflow-hidden text-ellipsis'>
            {title?.length > 30 && !isExpandedTitle ? title.substring(0, 30) + '...' : title}
          </h3>
          <button className='text-sm text-gray-500 touch-target' aria-label={isExpandedTitle ? "Collapse title" : "Expand title"}>
            <Icon name={isExpandedTitle ? "ChevronUpIcon" : "ChevronDownIcon"} size={16} className='w-4 h-4' />
          </button>
        </div>
        {image && (
          <div className="media-container mb-3 w-full flex justify-center">
            <Image
              src={image}
              alt={title}
              className="image-content max-w-full h-auto rounded-md object-contain"
              style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
            />
          </div>
        )}
        <div
          onClick={() => {
            setIsExpanded(!isExpanded)
            logClickedEvent('show_more_article', 'Interaction', 'Button Click', 1);
          }}
          className="cursor-pointer w-full max-w-full"
          aria-label={isExpanded ? 'Collapse article content' : 'Expand article content'}
        >
          <div
            style={{
              padding: 12,
              lineHeight: 1.6,
            }}
            className='text-sm overflow-hidden break-words whitespace-pre-line w-full max-w-full'
            dangerouslySetInnerHTML={{ __html: markdownContent }}
          />
          <button className="text-blue-500 hover:underline text-xs ml-1" onClick={e => { e.stopPropagation(); setIsExpanded(!isExpanded); }} aria-label={isExpanded ? 'Read less' : 'Read more'}>
            {isExpanded ? 'Read Less' : 'Read More'}
          </button>
        </div>
        <div className="action-buttons flex flex-wrap gap-2 my-2" role="group" aria-label="Article actions">
          <button className="action-button" aria-label="Reply" onClick={() => {
            setIsOpenComment(!isOpenComment);
            logClickedEvent('reply_to_note', 'Interaction', 'Button Click', 1);
          }}>
            <Icon name="CommentIcon" size={20} />
          </button>
          <button className={`action-button ${isLiked ? '' : ''}`} aria-label="Like" onClick={toggleLike}>
            <Icon name="LikeIcon" size={20}
              className={`${isLiked ? 'text-red-500' : ''}`}
              onClick={() => {
                logClickedEvent('like_note', 'Interaction', 'Button Click', 1);
              }}
            />
          </button>
          <button className="action-button" aria-label="Repost" onClick={() => {
            const isNostrConnected = handleCheckNostrAndSendConnectDialog();
            if (isNostrConnected) {
              showModal(<QuoteRepostComponent event={event} />);
            }
            logClickedEvent('repost_note', 'Interaction', 'Button Click', 1);
          }}>
            <Icon name="RepostIcon" size={20}></Icon>
          </button>
          <button className="action-button" aria-label="Share" onClick={() => {
            navigator.clipboard.writeText(window.location.origin + '/nostr/note/' + event.id);
            showToast({ message: `Link copied: ${window.location.origin}/nostr/note/${event.id}` });
            logClickedEvent('share_note_link', 'Interaction', 'Button Click', 1);
          }}>
            <Icon name="ShareIcon" size={20} />
          </button>
          <button className="action-button" aria-label="Tip" onClick={() => {
            handleTipsModal();
            logClickedEvent('tip_note', 'Interaction', 'Button Click', 1);
          }}>
            <Icon name="GiftIcon" size={20} ></Icon>
          </button>
        </div>
        {isOpenComment && (
          <div className="mt-3">
            <CommentContainer event={event} />
          </div>
        )}
      </div>
      {isClickableHashtags && (
        <div className="mt-3">
          <ContentWithClickableHashtags content={event.content} onHashtagPress={() => { }} />
        </div>
      )}
    </NostrEventCardBase>
  );
};

export default ArticleEventCard; 