'use client';

import React, { useMemo, useState } from 'react';
import { NostrArticleEventProps } from '@/types/nostr';
import NostrEventCardBase from './NostrEventCardBase';
import '../feed/feed.scss';
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
interface ArticleEventCardProps extends NostrArticleEventProps {
  profile?: NDKUserProfile;
  event: NDKEvent;
  isReadMore?: boolean;
}

export const ArticleEventCard: React.FC<ArticleEventCardProps> = ({ event, profile, isReadMore = true }) => {
  const { publicKey } = authStore.getState();
  const userReaction = useReactions({ authors: [publicKey], noteId: event?.id });
  const react = useReact();
  const router = useRouter();
  const [isOpenComment, setIsOpenComment] = useState(false);
  const queryClient = useQueryClient();

  const [isExpanded, setIsExpanded] = useState(false);
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

    // await handleCheckNostrAndSendConnectDialog();
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
    <div className="article-event-card">
      <NostrEventCardBase event={event} profile={profile}>
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

          {/* <div className="text-gray-600 dark:text-gray-300 mb-4">
            {summary}
          </div> */}

          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="cursor-pointer"
          >
            <div
              style={{
                // backgroundColor: theme.colors.background,
                // color: theme.colors.text,
                color: 'var(--text-primary)',
                padding: 16,
                // fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                // fontSize: 16,
                lineHeight: 1.6,
              }}
              dangerouslySetInnerHTML={{ __html: markdownContent }}
            />
            <button onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? 'Read Less' : 'Read More'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex space-x-3 text-gray-500 dark:text-gray-400 text-sm">
              <button className="flex items-center hover:text-blue-500 gap-1"
                onClick={() => setIsOpenComment(!isOpenComment)}
              >

                <Icon name="CommentIcon" size={16}
                />
                Reply
              </button>
              <button className={`flex items-center hover:text-blue-500 ${isLiked ? 'text-blue-500' : ''}`} onClick={toggleLike}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Like
              </button>
              <button className="flex items-center hover:text-green-500 gap-1"
                onClick={() => showModal(
                  <>
                    <QuoteRepostComponent event={event} >
                    </QuoteRepostComponent>
                    <button onClick={() => showModal(null)}>Close</button>
                  </>
                )}
              >
                <Icon name="RepostIcon" size={16} ></Icon>

                Repost
              </button>
              <button className="flex items-center hover:text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>

              <button className={`flex items-center hover:text-purple-500 gap-1 ${isLiked ? 'text-red-500' : ''}`} onClick={handleTipsModal}>

                <Icon name="GiftIcon" size={16} ></Icon>

                Tips
              </button>
            </div>

            {isReadMore && (
              <button className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors"
                onClick={() => {
                  router.push(`/nostr/note/${event?.id}`);
                }}
              >
                Read More
              </button>
            )}
          </div>
          {isOpenComment && (
            <div className="mt-3">
              <CommentContainer event={event} />
            </div>
          )}
        </div>
      </NostrEventCardBase>
    </div>
  );
};

export default ArticleEventCard; 