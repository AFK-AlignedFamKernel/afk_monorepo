'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { NostrPostEventProps } from '@/types/nostr';
import NostrEventCardBase from './NostrEventCardBase';
import { useAuth, useNote, useProfile, useQuote, useReact, useReactions, useReplyNotes, useRepost, useSendNote } from 'afk_nostr_sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';
import CommentContainer from './Comment/CommentContainer';
import { QuoteRepostComponent } from './quote-repost-component';
import { Icon } from '@/components/small/icon-component';
import { RepostIcon } from '@/components/small/icons';
import { NDKKind } from '@nostr-dev-kit/ndk';
import { useRouter } from 'next/navigation';
import { SliderImages } from '@/components/small/slider-image';
import Image from 'next/image';
import { TipNostr } from '../tips';
import { ContentWithClickableHashtags } from './ClickableHashtags';
import { logClickedEvent } from '@/lib/analytics';
import { useNostrAuth } from '@/hooks/useNostrAuth';
import styles from '@/styles/nostr/feed.module.scss';

export const PostEventCard: React.FC<NostrPostEventProps> = (props) => {
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
  const { showToast, showModal } = useUIStore();
  const repostMutation = useRepost({ event });
  const quoteMutation = useQuote({ event });
  const react = useReact();
  const { data: profile } = useProfile({ publicKey: event?.pubkey })
  const userReaction = useReactions({ authors: [publicKey], noteId: event?.id });
  const [dimensionsMedia, setMediaDimensions] = useState([250, 300]);
  const [imgUrls, setImageUrls] = useState<string[]>([]);
  const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();
  const handleTipsModal = () => {
    logClickedEvent('open_modal_tip_note', 'Interaction', 'Button Click', 1);
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



  console.log("event", event)
  console.log("postSource", postSource)

  return (
    <NostrEventCardBase event={event} profile={profile || props?.profile || undefined} isLoading={props.isLoading} className={props.className}>
      {isReplyView && reply && reply.length > 0 && (
        <div className={styles.replyContainer} aria-label="Reply to note">
          <button onClick={() => {
            handleToReplyView();
            logClickedEvent('reply_to_note', 'Interaction', 'Button Click', 1);
            // setIsOpenComment(false);
          }} className={styles.actionButton} aria-label="Go to parent note">
            <p className={"text-sm " + styles.truncateEllipsis + " " + styles.mono}>Reply to this note</p>
          </button>
        </div>
      )}
      {isRepost || event?.kind == NDKKind.Repost || (isRepost && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <RepostIcon height={18} />
          <p color="textLight">Reposted</p>
        </div>
      ))}
      <section className={styles.postContent} aria-label="Post content">
        <div
          // className="whitespace-pre-wrap break-words sm:max-w-[300px] lg:max-w-[500px]"
          className="whitespace-pre-wrap break-words"
          onClick={() => {
            setIsExpanded(!isExpanded)
            logClickedEvent('show_more_note', 'Interaction', 'Button Click', 1);
          }}
        >
          {/* Format content with hashtags styled using module */}
          {(() => {
            if (!hashtags.length) return displayContent;
            let formattedText = displayContent;
            hashtags.forEach(tag => {
              formattedText = formattedText.replace(
                new RegExp(tag, 'g'),
                `<span class=\"${styles.hashtag}\">${tag}</span>`
              );
            });
            return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
          })()}
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={"text-blue-500 hover:text-blue-700 ml-1 text-sm " + styles.actionButton}
              aria-label={isExpanded ? 'Show less' : 'Show more'}
            >
              Show {isExpanded ? 'less' : 'more'}
            </button>
          )}
        </div>
        <div>
          {postSource && postSource?.uri && (
            <img src={postSource?.uri}
              alt="Post Source"
              className={styles.nostrFeedImage}
              width={postSource.width || 250}
              height={postSource.height || 250}
            />
            // <Image
            //   unoptimized
            //   src={postSource?.uri}
            //   // src={encodeURIComponent(postSource?.uri)}
            //   alt="Post Source"
            //   width={postSource.width || 300}
            //   height={postSource.height || 300}
            //   className={styles.nostrFeedImage}
            // />
          )}
          {imgUrls.length > 0 && (
            <SliderImages imgUrls={imgUrls} />
          )}
        </div>
        {props?.isClickableHashtags && (
          <div className="mt-3">
            <ContentWithClickableHashtags content={content}
              tags={event?.tags}
              onHashtagPress={handleHashtagPress}
            />
          </div>
        )}
        <div
          className={styles.actionButtons + " flex flex-row gap-4 mt-3 mb-1 py-1"}
        >
          <button className={styles.actionButton + " flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"} aria-label="Reply" onClick={() => {
            setIsOpenComment(!isOpenComment);
            // handleCheckNostrAndSendConnectDialog();
            logClickedEvent('reply_to_note', 'Interaction', 'Button Click', 1);
          }}>
            <Icon name="CommentIcon" size={20} />
          </button>
          <button className={styles.actionButton + " flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"} aria-label="Repost" onClick={() => {
            const isNostrConnected = handleCheckNostrAndSendConnectDialog();
            if (isNostrConnected) {
              showModal(<QuoteRepostComponent event={event} />);
            }
            logClickedEvent('repost_note', 'Interaction', 'Button Click', 1);
          }}>
            <Icon name="RepostIcon" size={20} />
          </button>
          <button className={styles.actionButton + ` flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${isLiked ? '' : ''}`} aria-label="Like" onClick={toggleLike}>
            <Icon name="LikeIcon" size={20}
              className={`${isLiked ? 'text-red-500' : ''}`}
              onClick={() => {
                logClickedEvent('like_note', 'Interaction', 'Button Click', 1);
              }}
            />
          </button>
          <button className={styles.actionButton + " flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"} aria-label="Tip" onClick={() => {
            handleTipsModal();
            logClickedEvent('tip_note', 'Interaction', 'Button Click', 1);
          }}>
            <Icon name="GiftIcon" size={20} />
          </button>
          <button className={styles.actionButton + " flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"} aria-label="Share" onClick={() => {

            if (!event?.id) return;
            navigator.clipboard.writeText(window.location.origin + '/nostr/note/' + event?.id);
            showToast({ message: `Link copied: ${window.location.origin}/nostr/note/${event?.id}` });
            logClickedEvent('share_note_link', 'Interaction', 'Button Click', 1);
          }}>
            <Icon name="ShareIcon" size={20} />
          </button>
        </div>
      </section>
      {isOpenComment && (
        <div className="mt-3">
          <CommentContainer event={event ?? undefined} />
        </div>
      )}
    </NostrEventCardBase>
  );
};

export default PostEventCard; 