import React, { useEffect, useState } from 'react';
import { useNote, useProfile, useReactions, useReact } from 'afk_nostr_sdk';
import styles from '@/styles/components/channel.module.scss';
import Image from 'next/image';
import { formatTimestamp } from '@/types/nostr';
import { NDKKind, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { ButtonSecondary } from '@/components/button/Buttons';
import { logClickedEvent } from '@/lib/analytics';
import ProfileCardOverview from '../EventCard/ProfileCardOverview';
import { useUIStore } from '@/store/uiStore';

interface ChannelCardProps {
  event: any; // NDKEvent type
  profileProps?: NDKUserProfile | null;
  onClick?: (channel: any) => void;
  isViewButton?: boolean;
  isNavigateClickCard?: boolean;
}

const ChannelCard: React.FC<ChannelCardProps> = ({ event, profileProps, onClick, isViewButton = false, isNavigateClickCard = true }) => {
  const [channelInfo, setChannelInfo] = useState<any>(undefined);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const { data: profile } = useProfile({ publicKey: event?.pubkey });
  const { data: eventMetadata } = useNote({ noteId: event?.id ?? '', kinds: [NDKKind.ChannelMetadata, NDKKind.ChannelCreation] });
  const reactions = useReactions({ noteId: event?.id });
  const react = useReact();
  const { showModal } = useUIStore();
  useEffect(() => {
    if (event?.content) {
      try {
        setChannelInfo(JSON.parse(event.content));
      } catch {
        setChannelInfo(undefined);
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
    logClickedEvent('channel_view')
    onClick?.(event);
    // window.location.href = `/nostr/channel/${event?.id}`;
  };

  const handleProfileView = () => {
    logClickedEvent('profile_view_channel_card')
    if (profile) {
      showModal(
        <ProfileCardOverview 
        profile={profile ?? undefined}
          event={eventMetadata ?? undefined}
          isLinkToProfile={true}
        // onClose={() => hideModal()}
        />
      );
    }
  };

  return (
    <div
      className={`w-full mb-4 rounded-xl border shadow-sm flex flex-col gap-2 cursor-pointer transition-all ${styles.channelCard}`}
      style={{
        // background: 'var(--afk-bg-panel, #1A1A1A)',
        // borderColor: 'var(--afk-accent-green, #00FF9C)',
        // boxShadow: '0 2px 8px rgba(0,255,156,0.05)',
      }}
      onClick={isNavigateClickCard ? handleNavigate : undefined}
    >
      <div className="flex items-center gap-4 p-4">
        {channelInfo?.picture && channelInfo?.picture.startsWith('https') ? (
          <Image
            src={channelInfo?.picture}
            alt={channelInfo?.name || 'Channel'}
            className="w-16 h-16 rounded-full object-cover border"
            width={64}
            height={64}
          // style={{ borderColor: 'var(--afk-accent-green, #00FF9C)' }}
          />
        ) : (
          <Image
            src="/assets/afkMascot.png"
            alt="Channel"
            className="w-16 h-16 rounded-full object-cover border"
            width={64}
            height={64}
          />
        )}
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-lg truncate">
            {channelInfo?.name || 'Unnamed Channel'}
          </span>
          {channelInfo?.displayName && (
            <span className="text-sm text-[var(--afk-accent-cyan,#00F0FF)] truncate">
              {channelInfo.displayName}
            </span>
          )}
        </div>
        {/* <div className="ml-auto flex items-center gap-2">
          <button
            aria-label={isLiked ? 'Unlike' : 'Like'}
            className="p-2 rounded-full hover:bg-[var(--afk-accent-green,#00FF9C)]/10 transition"
            onClick={handleLike}
            style={{ border: 0, background: 'none' }}
          >
            {isLiked ? (
              <svg width="22" height="22" fill="var(--afk-accent-green,#00FF9C)" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
            ) : (
              <svg width="22" height="22" fill="none" stroke="var(--afk-accent-green,#00FF9C)" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
            )}
          </button>
          <span className="text-[var(--afk-accent-green,#00FF9C)] font-semibold min-w-[2em] text-center">
            {likes > 0 ? likes : ''}
          </span>
        </div> */}
      </div>
      <div className="px-4 pb-2">
        <span className="text-base  block truncate">
          {channelInfo?.about || 'No description.'}
        </span>
      </div>
      <div className="flex items-center gap-2 px-4 pb-4"
        onClick={handleProfileView}
      >
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


      {isViewButton && (
        <div>

          <ButtonSecondary onClick={handleNavigate}>
            View Channel
          </ButtonSecondary>
        </div>
      )}
    </div>
  );
};

export default ChannelCard;
