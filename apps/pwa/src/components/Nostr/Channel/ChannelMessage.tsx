import React, { useEffect, useState } from 'react';
import { useProfile, useReactions, useReact, useNote } from 'afk_nostr_sdk';
import styles from '@/styles/components/channel.module.scss';
import Image from 'next/image';
import { formatTimestamp } from '@/types/nostr';
import classNames from 'classnames';
import { useUIStore } from '@/store/uiStore';
import ProfileCardOverview from '../EventCard/ProfileCardOverview';
import { NDKEvent, NDKKind, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { logClickedEvent } from '@/lib/analytics';
interface ChannelMessageProps {
  event?: NDKEvent; // NDKEvent type
  onClick?: (channel: any) => void;
  className?: string;
  profileProps?: NDKUserProfile | null;
}

const ChannelMessage: React.FC<ChannelMessageProps> = ({ event, onClick, className, profileProps }) => {
  const [message, setMessage] = useState<any>(undefined);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const { data: profile } = useProfile({ publicKey: event?.pubkey })
  // console.log('profile channel message', profile)

  const { data: eventMetadata } = useNote({ noteId: event?.id ?? '', kinds: [NDKKind.Metadata] });
  // console.log('eventMetadata', eventMetadata)
  const reactions = useReactions({ noteId: event?.id });
  const react = useReact();


  const { showModal } = useUIStore();
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

  const handleProfileView = () => {
    logClickedEvent('profile_view_channel_message')

    if (profile) {
      showModal(
        <ProfileCardOverview profile={profile ?? undefined}
          event={eventMetadata ?? undefined}
        // onClose={() => hideModal()}
        />
      );
    }
  };

  return (
    <div
      className={classNames('w-full rounded-xl border shadow-sm flex flex-col gap-2 cursor-pointer transition-all rounded bg-gray-100 dark:bg-gray-800 p-3 text-sm', styles.channelCard, className)}
      style={{
        // background: 'var(--afk-bg-panel, #1A1A1A)',
        // borderColor: 'var(--afk-accent-green, #00FF9C)',
        // boxShadow: '0 2px 8px rgba(0,255,156,0.05)',
      }}
    // onClick={handleNavigate}
    >

      <div className="flex items-center gap-2 px-4 pb-4 cursor-pointer" onClick={handleProfileView}>
        {profile?.image && profile?.image.startsWith('https') && (
          <Image    
            width={28}
            height={28}
            src={profile?.image}
            alt={profile?.name || profile?.nip05 || ''}
            className="w-7 h-7 rounded-full object-cover border border-[var(--afk-accent-cyan,#00F0FF)]"
          />
        )}
        <span className="text-sm text-[var(--afk-accent-cyan,#00F0FF)]">
          By @{profile?.nip05 || profile?.name || 'unknown'}
        </span>
        <span className="text-xs text-gray-400 ml-2">
          {/* TODO: Format creation time nicely */}
          Created {event?.created_at ? formatTimestamp(event?.created_at) : ''}
        </span>
      </div>

 

      <div className="text-sm">
        {event?.content}
      </div>


    </div >
  );
};

export default ChannelMessage;
