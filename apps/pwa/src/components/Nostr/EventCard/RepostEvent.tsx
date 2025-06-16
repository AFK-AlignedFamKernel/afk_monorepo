'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { NostrPostEventProps } from '@/types/nostr';
import NostrEventCardBase from './NostrEventCardBase';
import { useAuth, useNote, useProfile, useQuote, useReact, useReactions, useReplyNotes, useRepost, useSendNote } from 'afk_nostr_sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';
import CommentContainer from './CommentContainer';
import { QuoteRepostComponent } from './quote-repost-component';
import { Icon } from '@/components/small/icon-component';
import { RepostIcon } from '@/components/small/icons';
import { NDKKind } from '@nostr-dev-kit/ndk';
import { useRouter } from 'next/navigation';
import { SliderImages } from '@/components/small/slider-image';
import Image from 'next/image';
import { TipNostr } from '../tips';
import { ContentWithClickableHashtags } from './ClickableHashtags';

export const RepostEvent: React.FC<NostrPostEventProps> = (props) => {
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

      const content = JSON.parse(event.content);
      return content.pubkey;
    } catch (error) {
      console.log("error : ", error);
      return null;
    }
  }, [content]);

  const {data: profile} = useProfile({publicKey: pubkeyReposted});

  const { showToast, showModal } = useUIStore();
  const repostMutation = useRepost({ event });
  const quoteMutation = useQuote({ event });
  const react = useReact();
  const userReaction = useReactions({ authors: [publicKey], noteId: event?.id });
  const [dimensionsMedia, setMediaDimensions] = useState([250, 300]);
  const [imgUrls, setImageUrls] = useState<string[]>([]);

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
                Repost this
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
     
     <div>

      <div className="flex items-center gap-2 my-2 shadow-lg rounded-lg p-2">
        {profile && (
          <div>
            {profile?.picture && <Image src={profile?.picture} alt={profile?.name || ''} width={24} height={24} />}
            <p className="text-sm text-contrast-500">{profile?.name}</p>
            <p className="text-sm text-contrast-500">{profile?.display_name}</p>
          </div>
        )}
      </div>


      <p>{repostedContent?.content}</p>
   
     </div>

    </div>
  );
};

export default RepostEvent; 