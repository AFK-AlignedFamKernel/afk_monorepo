'use client';

import React from 'react';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { NostrEventBase, NostrEventKind, getEventKind } from '@/types/nostr';
import PostEventCard from './PostEventCard';
import ArticleEventCard from './ArticleEventCard';
import ShortEventCard from './ShortEventCard';

export const NostrEventCard: React.FC<NostrEventBase> = (props) => {
  const { event } = props;
  const kind = getEventKind(event);

  switch (kind) {
    case NostrEventKind.Article:
      return <ArticleEventCard {...props} />;
    case NostrEventKind.ShortForm:
    case NostrEventKind.VerticalVideo:
    case NostrEventKind.HorizontalVideo:
      return <ShortEventCard {...props} />;
    case NostrEventKind.Text:
    default:
      return <PostEventCard {...props} />;
  }
};

export default NostrEventCard; 