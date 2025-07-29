'use client';

import React, { useState } from 'react';
import { formatTimestamp, NostrPostEventProps, truncate } from '@/types/nostr';
import { useNote, useReplyNotes, useSendNote } from 'afk_nostr_sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { ButtonPrimary } from '@/components/button/Buttons';
import { logClickedEvent } from '@/lib/analytics';
import { Icon } from '@/components/small/icon-component';
import CryptoLoading from '@/components/small/crypto-loading';
import { CommentEvent } from './CommentEvent';
interface CommentContainerProps {
  event?: NDKEvent;
  isExpanded?: boolean;
}

export const CommentContainer: React.FC<CommentContainerProps> = (props) => {
  const { event, isExpanded = false } = props;

  const content = event?.content || '';
  const shouldTruncate = content.length > 280 && !isExpanded;
  const displayContent = shouldTruncate ? `${content.substring(0, 280)}...` : content;
  const [comment, setComment] = useState('');
  const { data: note = event } = useNote({ noteId: event?.id ?? '' });
  const comments = useReplyNotes({ noteId: event?.id || note?.id });
  console.log("comments", comments);
  const sendNote = useSendNote();
  const [isOpenComment, setIsOpenComment] = useState(false);
  const { showToast } = useUIStore();

  // console.log("comments", comments?.data?.pages?.flat());
  const queryClient = useQueryClient();
  // Extract hashtags from content
  const hashtags = content.match(/#[a-zA-Z0-9_]+/g) || [];

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


  const handleSendComment = async () => {
    if (!comment || comment?.trim().length == 0) {
      showToast({ type: 'error', message: 'Please write your comment' });
      return;
    }
    // await handleCheckNostrAndSendConnectDialog();
    logClickedEvent('send_comment', 'Interaction', 'Button Click', 1);

    if (!note?.id && !event?.id) {
      showToast({ type: 'error', message: 'No post found' });
      return;
    }

    sendNote.mutate(
      { content: comment, tags: [['e', note?.id ?? event?.id ?? '', '', 'root', note?.pubkey ?? '']] },
      {
        onSuccess() {
          showToast({ type: 'success', message: 'Comment sent successfully' });
          queryClient.invalidateQueries({ queryKey: ['replyNotes', note?.id] });
          comments.refetch();
          setComment('');
        },
        onError() {
          showToast({
            type: 'error',
            message: 'Error! Comment could not be sent. Please try again later.',
          });
        },
      },
    );
  };

  return (

    <div>
      <div className="mt-3 max-h-[500px] overflow-y-auto">

        {comments?.isLoading && (
          <div className="flex justify-center items-center h-full">
            <CryptoLoading
            // className='animate-spin'
            />
          </div>
        )}

        {comments?.data?.pages.flat().map((comment: any) => (

          <>
            <CommentEvent event={comment} />
          </>

        ))}


      </div>
      <div className="mt-3 flex items-center space-x-2">
        <textarea
          // type="text-area"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment"
          className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
        />
        {/* <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment"
          className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        /> */}
        <ButtonPrimary onClick={handleSendComment}
          className='flex flex-row gap-2 items-center'
          disabled={!comment || comment?.trim().length == 0}
        >
          <Icon name="SendIcon" size={18} />
          <span>Send</span>
        </ButtonPrimary>
      </div>
    </div>

  );
};

export default CommentContainer; 