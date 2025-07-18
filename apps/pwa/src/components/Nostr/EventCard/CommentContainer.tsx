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
  const comments = useReplyNotes({ noteId: note?.id });
  const sendNote = useSendNote();
  const [isOpenComment, setIsOpenComment] = useState(false);
  const { showToast } = useUIStore();

  console.log("comments", comments?.data?.pages?.flat());
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

    if(!note?.id && !event?.id) {
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
        {comments.data?.pages.flat().map((comment: any) => (
          <div key={comment?.id} className="mb-4 p-4 rounded-lg shadow border border-right-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full "></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium ">
                    {truncate(comment.pubkey ?? '', 8)}
                  </span>
                  <span className="text-sm">
                    {comment?.created_at ? formatTimestamp(comment?.created_at) : ''}
                  </span>
                </div>
                <div className="mt-1 whitespace-pre-wrap break-words">
                  {formatContent(comment?.content ?? '')}
                </div>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <button className="flex items-center hover:text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Reply
                  </button>
                  <button className="flex items-center hover:text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Like
                  </button>
                </div>
              </div>
            </div>
          </div>
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