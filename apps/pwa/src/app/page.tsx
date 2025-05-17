'use client';

import { FeedNostr } from '@/components/Nostr/feed';
import React from 'react';
import Link from 'next/link';
import MenuGameComponent from '@/components/menu/MenuGame';

// Use inline Layout to avoid type issues
export default function HomePage() {
  return (
    <div className="content">
      <MenuGameComponent></MenuGameComponent>
    </div>
  );
}
