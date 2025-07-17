import React, { useEffect, useState } from 'react';
import { useProfile, useReactions, useReact } from 'afk_nostr_sdk';
import styles from '@/styles/components/channel.module.scss';
import Image from 'next/image';
import { formatTimestamp } from '@/types/nostr';
import classNames from 'classnames';
interface ChannelMessageProps {
  event: any; // NDKEvent type
  onClick?: (channel: any) => void;
  className?: string;
}

const ChannelMessage: React.FC<ChannelMessageProps> = ({ event, onClick, className }) => {
  const [message, setMessage] = useState<any>(undefined);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const { data: profile } = useProfile({ publicKey: event?.pubkey });
  const reactions = useReactions({ noteId: event?.id });
  const react = useReact();

  useEffect(() => {
    if (event?.content) {
      try {
        setMessage(JSON.parse(event.content));
      } catch {
        setMessage(undefined);
      }
    }
  }, [event]);

  useEffect(() => {
    if (reactions.data) {
      const likesCount = reactions.data.filter((r: any) => r.content !== '-').length;
      const dislikesCount = reactions.data.length - likesCount;
      setLikes(likesCount - dislikesCount);
      setIsLiked(Array.isArray(reactions.data) && reactions.data[0]?.content !== '-');
    }
  }, [reactions.data]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!event?.id) return;
    await react.mutateAsync({ event, type: isLiked ? 'dislike' : 'like' });
    setIsLiked(!isLiked);
    setLikes((prev) => prev + (isLiked ? -1 : 1));
  };

  const handleNavigate = () => {
    onClick?.(event);
    // window.location.href = `/nostr/channel/${event?.id}`;
  };

  return (
    <div
      className={classNames('w-full mb-4 rounded-xl border shadow-sm flex flex-col gap-2 cursor-pointer transition-all', styles.channelCard, className)}
      style={{
        // background: 'var(--afk-bg-panel, #1A1A1A)',
        // borderColor: 'var(--afk-accent-green, #00FF9C)',
        // boxShadow: '0 2px 8px rgba(0,255,156,0.05)',
      }}
    // onClick={handleNavigate}
    >

      <div key={message.id} className="rounded bg-gray-100 dark:bg-gray-800 p-3 text-sm">
        <div className="flex items-center gap-2">
          <Image src={message.author.picture} alt={message.author.name} width={20} height={20} />
          <span className="text-sm">{message.author.name} {formatTimestamp(message.created_at)}</span>
        </div>
        {message.content}
      </div>

      <div className="flex items-center gap-2 px-4 pb-4">
        {profile?.image && (
          <img
            src={profile.image}
            alt={profile.name || profile.nip05}
            className="w-7 h-7 rounded-full object-cover border border-[var(--afk-accent-cyan,#00F0FF)]"
          />
        )}
        <span className="text-sm text-[var(--afk-accent-cyan,#00F0FF)]">
          By @{profile?.nip05 || profile?.name || 'unknown'}
        </span>
        <span className="text-xs text-gray-400 ml-2">
          {/* TODO: Format creation time nicely */}
          Created {formatTimestamp(event?.created_at)}
        </span>
      </div>
    </div >
  );
};

export default ChannelMessage;
