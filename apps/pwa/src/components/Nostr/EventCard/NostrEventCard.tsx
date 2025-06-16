'use client';

import React from 'react';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useProfile } from 'afk_nostr_sdk';
import { NostrEventBase, NostrEventKind, getEventKind } from '@/types/nostr';
import PostEventCard from './PostEventCard';
import ArticleEventCard from './ArticleEventCard';
import ShortEventCard from './ShortEventCard';
import { NumberToBytesErrorType } from 'viem';
import RepostEvent from './RepostEvent';

export interface NostrEventCardProps {
  event: NDKEvent;
  isLoading?: boolean;
  isClickableHashtags?: boolean;
}

export const NostrEventCard: React.FC<NostrEventCardProps> = ({ event, isLoading = false, isClickableHashtags = true }) => {
  // Fetch profile data using the useProfile hook
  const { data: profileData } = useProfile({
    publicKey: event?.pubkey,
  });

  // Create a formatted profile object from the fetched data
  const profile = profileData ? {
    name: profileData.name,
    displayName: profileData.displayName || profileData.name,
    picture: profileData.image || profileData.picture,
    about: profileData.about,
    nip05: profileData.nip05,
    lud16: profileData.lud16,
    lud06: profileData.lud06,
    banner: profileData.banner,
  } : undefined;

  // Create the props needed for all card types
  const props: NostrEventBase = {
    event,
    profile,
    isLoading,
  };

  // Skip rendering for loading state or handle in child components
  if (isLoading) {
    // Return basic PostEventCard for loading state
    return <PostEventCard {...props} />;
  }

  const kind = getEventKind(event);

  switch (kind as number) {
    case NostrEventKind.Article:
      return <ArticleEventCard {...props} isClickableHashtags={isClickableHashtags} />;
    case NostrEventKind.ShortForm:
      return <ShortEventCard {...props} />;
    case NostrEventKind.VerticalVideo:
      return <ShortEventCard {...props} />;
    case NostrEventKind.HorizontalVideo:
      return <ShortEventCard {...props} />;
    case 34236 :
      return <ShortEventCard {...props} />;
    case 6:
      return <RepostEvent {...props} />;
    case 1:
      return <PostEventCard {...props} isClickableHashtags={isClickableHashtags} />;
    default:
      return <PostEventCard {...props} isClickableHashtags={isClickableHashtags} />;
  }
};

export default NostrEventCard; 