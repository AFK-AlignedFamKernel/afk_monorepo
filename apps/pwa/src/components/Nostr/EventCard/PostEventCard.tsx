'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { NostrPostEventProps } from '@/types/nostr';
import NostrEventCardBase from './NostrEventCardBase';
import '../feed/feed.scss';
import { useAuth, useNote, useQuote, useReact, useReactions, useReplyNotes, useRepost, useSendNote } from 'afk_nostr_sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';
import CommentContainer from './CommentContainer';
import { QuoteRepostComponent } from './quote-repost-component';
import { Icon } from '@/components/small/icon-component';
import { theme } from '@chakra-ui/react';
import { RepostIcon } from '@/components/small/icons';
import { NDKKind } from '@nostr-dev-kit/ndk';
import { useRouter } from 'next/navigation';
import { SliderImages } from '@/components/small/slider-image';
import Image from 'next/image';

export const PostEventCard: React.FC<NostrPostEventProps> = (props) => {
  const { event } = props;
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const { publicKey } = useAuth();
  const content = event.content || '';
  const shouldTruncate = content.length > 280 && !isExpanded;
  const displayContent = shouldTruncate ? `${content.substring(0, 280)}...` : content;
  const [comment, setComment] = useState('');
  const { data: note = event } = useNote({ noteId: event?.id });
  const comments = useReplyNotes({ noteId: note?.id });
  const sendNote = useSendNote();
  const [isOpenComment, setIsOpenComment] = useState(false);
  const { showToast, showModal } = useUIStore();
  const repostMutation = useRepost({ event });
  const quoteMutation = useQuote({ event });
  const react = useReact();
  const userReaction = useReactions({ authors: [publicKey], noteId: event?.id });
  const [dimensionsMedia, setMediaDimensions] = useState([250, 300]);
  const [imgUrls, setImageUrls] = useState<string[]>([]);

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

    // await handleCheckNostrAndSendConnectDialog();
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
    router.push(`/post/${reply[0]}`);
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


  return (
    <div className="post-event-card">
      {isReplyView &&
        reply && reply?.length > 0 &&
        (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <button onClick={handleToReplyView}>
              <p className="text-gray-500 dark:text-gray-400 text-sm"
              >
                Reply to this note
              </p>
            </button>
            {/* <Text>Reply View</Text> */}
          </div>
        )}
      {isRepost ||
        event?.kind == NDKKind.Repost ||
        (isRepost && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <RepostIcon height={18} />
            <p color="textLight">Reposted</p>
          </div>
        ))}
      <NostrEventCardBase {...props}>
        <div className="mt-2">
          <div
            // className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words"
            className="dark:text-gray-200 whitespace-pre-wrap break-words"
          >
            {formatContent(displayContent)}
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-blue-500 hover:text-blue-700 ml-1 text-sm"
              >
                Show more
              </button>
            )}
          </div>

          <div>

          {postSource && (
            <Image
              src={postSource.uri}
              alt="Post Source"
              width={postSource.width}
              height={postSource.height}
              // style={[
              //   styles.contentImage,
              //   {
              //     height: dimensionsMedia[1],
              //     aspectRatio: getImageRatio(postSource.width, postSource.height),
              //   },
              // ]}
            />
          )}

          {imgUrls.length > 0 && (
            <SliderImages imgUrls={imgUrls} />
          )}
          </div>

          {hashtags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {hashtags.map((tag, index) => (
                <span
                  key={index}
                  className="hashtag inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 mb-2 flex items-center text-gray-500 dark:text-gray-400 text-sm space-x-4">
            <button className="flex items-center hover:text-blue-500 gap-1"
              onClick={() => setIsOpenComment(!isOpenComment)}
            >

              <Icon name="CommentIcon" size={16}
              // color="currentColor"
              // stroke="currentColor"
              />
              {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg> */}
              Reply
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
              {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg> */}
              Repost
            </button>
            <button className={`flex items-center hover:text-red-500 gap-1 ${isLiked ? 'text-red-500' : ''}`} onClick={toggleLike}>

              <Icon name="LikeIcon" size={16} ></Icon>

              {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg> */}
              Like
            </button>
          </div>
        </div>

        {isOpenComment && (
          <div className="mt-3">
            <CommentContainer event={event} />
          </div>
        )}

      </NostrEventCardBase>
    </div>
  );
};

export default PostEventCard; 