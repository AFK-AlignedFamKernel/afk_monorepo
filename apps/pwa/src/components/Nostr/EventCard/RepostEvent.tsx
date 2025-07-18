'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { NostrPostEventProps } from '@/types/nostr';
import NostrEventCardBase from './NostrEventCardBase';
import { useAuth, useNote, useProfile, useQuote, useReact, useReactions, useReplyNotes, useRepost, useSendNote } from 'afk_nostr_sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';
import { QuoteRepostComponent } from './quote-repost-component';
import { Icon } from '@/components/small/icon-component';
import { RepostIcon } from '@/components/small/icons';
import { NDKKind } from '@nostr-dev-kit/ndk';
import { useRouter } from 'next/navigation';
import { SliderImages } from '@/components/small/slider-image';
import Image from 'next/image';
import { TipNostr } from '../tips';
import ProfileCardOverview from './ProfileCardOverview';
import PostEventCard from './PostEventCard';
import ArticleEventCard from './ArticleEventCard';
import { logClickedEvent } from '@/lib/analytics';
import { useNostrAuth } from '@/hooks/useNostrAuth';
import styles from '@/styles/nostr/feed.module.scss';
import CommentContainer from './Comment/CommentContainer';
import { VideoPlayer } from './NostrVideoPlayer';
import ShortEventCard from './ShortEventCard';

export const RepostEvent: React.FC<NostrPostEventProps> = (props) => {
  const { event } = props;
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const { publicKey } = useAuth();
  const content = event?.content || '';
  const shouldTruncate = content.length > 280 && !isExpanded;
  const displayContent = shouldTruncate ? `${content.substring(0, 280)}...` : content;
  const [comment, setComment] = useState('');
  const { data: note = event } = useNote({ noteId: event?.id ?? '' });
  const comments = useReplyNotes({ noteId: note?.id });
  const sendNote = useSendNote();
  // const {profile} = useProfile({publicKey:event?.pubkey})
  const [isOpenComment, setIsOpenComment] = useState(false);

  const repostedContent = useMemo(() => {
    try {
      return typeof content === 'string' ? JSON.parse(content) : content;
    } catch (error) {
      return null;
    }
  }, [content]);

  const pubkeyReposted = useMemo(() => {
    try {

      const content = JSON.parse(event?.content ?? '');
      return content.pubkey;
    } catch (error) {
      console.log("error : ", error);
      return null;
    }
  }, [content]);

  const { data: profileRepost } = useProfile({ publicKey: pubkeyReposted });
  const { data: profile } = useProfile({ publicKey: event?.pubkey });

  const { showToast, showModal } = useUIStore();
  // const repostMutation = useRepost({ event: event ?? undefined });
  // const quoteMutation = useQuote({ event: event ?? undefined });
  const react = useReact();
  const userReaction = useReactions({ authors: [publicKey], noteId: event?.id });
  const [dimensionsMedia, setMediaDimensions] = useState([250, 300]);
  const [imgUrls, setImageUrls] = useState<string[]>([]);
  const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();
  const handleTipsModal = () => {
    showModal(<TipNostr event={event} profile={props?.profile}></TipNostr>)
  }

  const queryClient = useQueryClient();
  // Extract hashtags from content
  const hashtags = content.match(/#[a-zA-Z0-9_]+/g) || [];
  const regexLinkImg = `https:\/\/[^\s]+?\.(jpeg|png|jpg|JPG|JPEG|PNG)$`

  // Format content to highlight hashtags
  const formatContent = (text: string) => {
    if (!hashtags.length) return text;

    let formattedText = text;
    hashtags.forEach(tag => {
      formattedText = formattedText.replace(
        new RegExp(tag, 'g'),
        `<span class="hashtag">${tag}</span>`
      );
    });

    return (
      <div dangerouslySetInnerHTML={{ __html: formattedText }} />
    );
  };

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
          queryClient.invalidateQueries({ queryKey: ['reactions', event?.id] });

          showToast({ type: 'success', message: 'Reaction updated' });
          // scale.value = withSequence(
          //   withTiming(1.5, { duration: 100, easing: Easing.out(Easing.ease) }),
          //   withSpring(1, { damping: 6, stiffness: 200 }),
          // );
        },
      },
    );
  };


  const reply = useMemo(() => {
    return event?.tags?.filter((tag) => tag[0] === 'e').map((tag) => tag[1]) || [];
  }, [event?.tags, event],);


  const isReplyView = useMemo(() => {
    if (event?.tags?.find((tag) => tag[0] === 'e')) {
      return true;
    }
    return false;
  }, [event?.tags, event],);

  const isRepost = event?.kind == NDKKind.Repost || event?.kind == NDKKind.GenericRepost;
  const handleToReplyView = () => {
    if (!reply || reply.length === 0) return;
    router.push(`/nostr/note/${reply[0]}`);
  };


  const postSource = useMemo(() => {
    if (!event?.tags) return;

    const imageTag = event.tags.find((tag) => tag[0] === 'image');
    if (!imageTag) return;
    let dimensions = [250, 300];
    if (imageTag[2]) {
      dimensions = imageTag[2].split('x').map(Number);
      setMediaDimensions(dimensions);
    }
    return { uri: imageTag[1], width: dimensions[0], height: dimensions[1] };
  }, [event?.tags]);


  useEffect(() => {
    if (event?.content) {

      const regex = new RegExp(regexLinkImg, 'g');
      const matches = event.content.match(regex);

      if (matches) {
        setImageUrls(matches);
      }

      const urls = event.content.split(/\s+/).filter(word => {
        try {
          const url = new URL(word);
          return url.pathname.match(/\.(jpeg|jpg|png|gif)$/i);
        } catch {
          return false;
        }
      });
      setImageUrls(urls);
    }
  }, [event?.content, event]);


  const regexLinkVideo = `https:\/\/[^\s]+?\.(mp4|MP4)$`

  // const [videoUrls, setVideoUrls] = useState<string[]>([]);

  // useEffect(() => {
  //   if (event?.content) {
  //     const regex = new RegExp(regexLinkVideo, 'g');
  //     const matches = event.content.match(regex);
  //     if (matches) {
  //       setVideoUrls(matches);
  //     }

  //     const urls = event.content.split(/\s+/).filter(word => {
  //       try {
  //         const url = new URL(word);
  //         return url.pathname.match(/\.(mp4|MP4)$/i);
  //       } catch {
  //         return false;
  //       }
  //     });
  //     setVideoUrls(urls);
  //   }
  // }, [event?.content, event]);


  const handleHashtagPress = (tag: string) => {
    router.push(`/nostr/tags/${tag}`);
  }

  return (
    <div
      // className={styles['event-card'] + ''}
      className={styles.eventCard + ' ' + styles.postEventCard + ' p-2 sm:p-3'}

    >
      {/* Reposted by (header) */}
      <div className={`${styles['reposted-by-header']} flex items-center gap-2 my-2`}
        onClick={() => {
          logClickedEvent('click_profile_who_reposted', 'Interaction', 'Button Click', 1);
          showModal(<ProfileCardOverview profile={profile ?? undefined} event={event} />);
        }}
      >
        {profile && (
          <>
            {profile?.picture && <Image className="rounded-full w-7 h-7" src={profile?.picture} alt={profile?.name || ''} width={28} height={28} />}
            <Icon name="RepostIcon" size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Reposted by {profile?.name || profile?.display_name || event?.pubkey?.slice(0, 8)} </span>
          </>
        )}
      </div>

      {/* Quoted comment (if any) */}
      {repostedContent && repostedContent.content && repostedContent.event && (
        <div className="bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500 dark:border-blue-400 mb-3 p-3 rounded">
          <span className="block text-xs font-semibold text-blue-700 dark:text-blue-200 mb-1">Comment by {profile?.name || profile?.display_name || event?.pubkey?.slice(0, 8)}</span>
          <div className="text-sm text-contrast-500 whitespace-pre-wrap break-words">{repostedContent.content}</div>
        </div>
      )}

      {/* <div className="flex items-center gap-2 mb-1 mt-1">
          {profileRepost?.picture && <Image className="rounded-full w-6 h-6" src={profileRepost?.picture} alt={profileRepost?.name || ''} width={24} height={24} />}
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Original post by {profileRepost?.name || profileRepost?.display_name || pubkeyReposted?.slice(0, 8)}</span>
        </div> */}
      {/* Render correct card by kind, but FLAT */}
      {(() => {
        // console.log("repostedContent : ", repostedContent);
        // const original = repostedContent && repostedContent.event ? repostedContent.event : repostedContent;
        const original = repostedContent && repostedContent.event ? repostedContent.event : repostedContent;
        if (original?.kind == 1 || original?.kind == NDKKind.Text) {
          return <PostEventCard event={original} profile={profileRepost ?? undefined} isClickableHashtags={false} />;
        } else if (original?.kind == 30023 || original?.kind == 30024 || original?.kind == NDKKind.Article) {
          return <ArticleEventCard event={original} profile={profileRepost ?? undefined} isClickableHashtags={false} isReadMore={false} />;
        }
        else if (original?.kind == 30025 || original?.kind == 30026 || original?.kind == 34236 || original?.kind == 34237 || original?.kind == NDKKind.ShortVideo || original.kind == NDKKind.Video) {
          return (
            <div
            // className="w-full h-full max-h-[300px]"
            >
              <ShortEventCard
                event={original}
                // className="w-full h-full max-h-[300px]"
                // classNameVideoPlayer="w-full max-h-[200px]"
              // classNameNostrBase="w-full h-full max-h-[300px]"
              />
            </div>
          );
        }
        else if (original) {
          return (
            <div className={styles['event-card'] + ' ' + styles['post-event-card']}>
              <div className="text-sm text-contrast-500 whitespace-pre-wrap break-words">
                {isExpanded ? original?.content : `${original?.content?.substring(0, 200)}${original?.content?.length > 200 ? '...' : ''}`}
              </div>
              {original?.content?.length > 200 && (
                <button className="text-xs text-blue-500 mt-1" onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? 'View less' : 'View more'}
                </button>
              )}
            </div>
          );
        } else {
          return <div className="text-gray-400 italic">Original post unavailable</div>;
        }
      })()}
      {/* Action buttons for the reposted event */}
      {(() => {
        const original = event;
        // const original = repostedContent && repostedContent.event ? repostedContent.event : repostedContent;
        if (!original) return null;
        return (
          <div className={styles['action-buttons'] + " flex flex-wrap gap-8 my-4"} role="group" aria-label="Repost actions">
            <button className={styles['action-button']} aria-label="Reply" onClick={() => {
              setIsOpenComment(!isOpenComment);
              logClickedEvent('reply_to_note', 'Interaction', 'Button Click', 1);
            }}>
              <Icon name="CommentIcon" size={20} />
            </button>
            <button className={`${styles['action-button']} ${isLiked ? '' : ''}`} aria-label="Like" onClick={toggleLike}>
              <Icon name="LikeIcon" size={20}
                className={`${isLiked ? 'text-red-500' : ''}`}
                onClick={() => {
                  logClickedEvent('like_note', 'Interaction', 'Button Click', 1);
                }}
              />
            </button>
            <button className={styles['action-button']} aria-label="Repost" onClick={() => {
              const isNostrConnected = handleCheckNostrAndSendConnectDialog();
              if (isNostrConnected) {
                showModal(<QuoteRepostComponent event={original} />);
              }
              logClickedEvent('repost_note', 'Interaction', 'Button Click', 1);
            }}>
              <Icon name="RepostIcon" size={20}></Icon>
            </button>
            <button className={styles['action-button']} aria-label="Share" onClick={() => {
              navigator.clipboard.writeText(window.location.origin + '/nostr/note/' + event.id);
              showToast({ message: `Link copied: ${window.location.origin}/nostr/note/${event.id}` });
              logClickedEvent('share_note_link', 'Interaction', 'Button Click', 1);
            }}>
              <Icon name="ShareIcon" size={20} />
            </button>
            <button className={styles['action-button']} aria-label="Tip" onClick={() => {
              handleTipsModal();
              logClickedEvent('tip_note', 'Interaction', 'Button Click', 1);
            }}>
              <Icon name="GiftIcon" size={20} ></Icon>
            </button>
          </div>
        );
      })()}
      {isOpenComment && (
        <div className="mt-3">
          <CommentContainer event={repostedContent && repostedContent.event ? repostedContent.event : repostedContent} />
          {/* <CommentContainer event={event} /> */}
        </div>
      )}
    </div>
  );
};

export default RepostEvent; 