'use client';

import React, { useMemo, useState } from 'react';
import { formatTimestamp, truncate } from '@/types/nostr';
import { useNote, useProfile, useReact, useReactions, useReplyNotes, useSendNote } from 'afk_nostr_sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { logClickedEvent } from '@/lib/analytics';
import { Icon } from '@/components/small/icon-component';
import CommentContainer from './CommentContainer';
import ProfileCardOverview from '../ProfileCardOverview';

interface CommentContainerProps {
  event?: NDKEvent;
  isExpanded?: boolean;
}

export const CommentEvent: React.FC<CommentContainerProps> = (props) => {
  const { event, isExpanded = false } = props;
  const { data: profile } = useProfile({ publicKey: event?.pubkey ?? '' });
  const { showModal, showToast } = useUIStore();
  const content = event?.content || '';
  const shouldTruncate = content.length > 280 && !isExpanded;
  const displayContent = shouldTruncate ? `${content.substring(0, 280)}...` : content;
  const [comment, setComment] = useState('');
  const { data: note = event } = useNote({ noteId: event?.id ?? '' });
  const comments = useReplyNotes({ noteId: note?.id });
  const sendNote = useSendNote();
  const [isReplying, setIsReplying] = useState(false);
  const [isExpandedContent, setIsExpandedContent] = useState(isExpanded);
  const queryClient = useQueryClient();

  // Extract hashtags from content
  const hashtags = content.match(/#[a-zA-Z0-9_]+/g) || [];


  const react = useReact();

  const userReaction = useReactions({ noteId: note?.id });


  const isLiked = useMemo(
    () =>
      Array.isArray(userReaction.data) &&
      userReaction.data[0] &&
      userReaction.data[0]?.content !== '-',
    [userReaction.data],
  );


  // Format content to highlight hashtags
  const formatContent = (text: string) => {
    if (!hashtags.length) return text;
    let formattedText = text;
    hashtags.forEach(tag => {
      formattedText = formattedText.replace(
        new RegExp(tag, 'g'),
        `<span class="hashtag" style="color: var(--color-primary); cursor: pointer;">${tag}</span>`
      );
    });
    return (
      <div
        className="break-words whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
    );
  };

  const handleSendComment = async () => {
    if (!comment || comment.trim().length === 0) {
      showToast({ type: 'error', message: 'Please write your comment' });
      return;
    }
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
          setIsReplying(false);
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

  const handleLike = async () => {
    // setIsLiked((prev) => !prev);
    logClickedEvent('like_comment', 'Interaction', 'Button Click', 1);


    await react.mutateAsync(
      { event: note as NDKEvent, type: isLiked ? 'dislike' : 'like' },
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
    // TODO: Implement like logic
  };

  return (
    <div
      className="mb-4 p-4 rounded-xl shadow border"
      style={{
        boxShadow: '0 2px 8px 0 var(--color-shadow, rgba(0,0,0,0.04))',
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <button
            className="rounded-full overflow-hidden border-2"
            style={{
              borderColor: 'var(--color-primary, #22c55e)',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
            onClick={() =>
              showModal(
                <ProfileCardOverview
                  profile={profile ?? undefined}
                  profilePubkey={event?.pubkey}
                />
              )
            }
            aria-label="View profile"
          >
            {profile?.image ? (
              <img
                src={profile.image as string}
                alt="Profile"
                width={40}
                height={40}
                style={{ objectFit: 'cover', width: 40, height: 40 }}
              />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                }}
              />
            )}
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base">
              {profile?.name || truncate(event?.pubkey ?? '', 8)}
            </span>
            <span
              className="text-xs text-gray-500 cursor-pointer"
              onClick={() =>
                showModal(
                  <ProfileCardOverview
                    profile={profile ?? undefined}
                    profilePubkey={event?.pubkey}
                  />
                )
              }
              title={event?.pubkey}
            >
              {truncate(event?.pubkey ?? '', 8)}
            </span>
            <span className="text-xs text-gray-400 ml-auto">
              {event?.created_at ? formatTimestamp(event?.created_at) : ''}
            </span>
          </div>
          <div className="mt-2">
            <div className="whitespace-pre-wrap break-words text-[15px]">
              {isExpandedContent || !shouldTruncate
                ? formatContent(content)
                : (
                  <>
                    {formatContent(displayContent)}
                    <button
                      className="ml-1 text-xs text-blue-500 hover:underline"
                      onClick={() => setIsExpandedContent(true)}
                    >
                      Read more
                    </button>
                  </>
                )
              }
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <button
              onClick={() => setIsReplying((prev) => !prev)}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[var(--color-hover,rgba(37,99,235,0.08))] transition"
              aria-label="Reply"
            >
              <Icon name="CommentIcon" size={16} />
              Reply
            </button>
            <button
              onClick={handleLike}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[var(--color-hover,rgba(239,68,68,0.08))] transition"
              style={{
                color: isLiked ? 'var(--color-error, #ef4444)' : 'var(--color-text-secondary, #6b7280)',
              }}
              aria-label="Like"
            >
              <Icon name="LikeIcon" size={16} className={isLiked ? 'text-red-500' : ''} />
              {isLiked ? 'Liked' : 'Like'}
            </button>
          </div>
        </div>
      </div>

      {isReplying && (
        <div className="mt-4">
          <textarea
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#2563eb)] transition"
            style={{
              // background: 'var(--color-input-bg, #f9fafb)',
              borderColor: 'var(--color-border, #e5e7eb)',
              minHeight: 60,
              resize: 'vertical',
            }}
            placeholder="Write your reply..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={1000}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              className="px-3 py-1 rounded text-sm font-medium"
              onClick={() => {
                setIsReplying(false);
                setComment('');
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="px-4 py-1 rounded text-sm font-medium"
              style={{
                opacity: comment.trim().length === 0 ? 0.6 : 1,
                cursor: comment.trim().length === 0 ? 'not-allowed' : 'pointer',
              }}
              onClick={handleSendComment}
              disabled={comment.trim().length === 0}
              type="button"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Nested comments */}
      {isExpanded && (
        <div className="mt-4">
          <CommentContainer event={event} isExpanded={true} />
        </div>
      )}
    </div>
  );
};

export default CommentEvent;