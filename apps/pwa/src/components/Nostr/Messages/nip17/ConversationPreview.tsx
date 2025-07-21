// apps/pwa/src/components/Nostr/Messages/ConversationPreview.tsx
'use client';

import React from 'react';
import { useProfile } from 'afk_nostr_sdk';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

interface ConversationPreviewProps {
  conversation: any;
  onPressed: () => void;
}

export const ConversationPreview: React.FC<ConversationPreviewProps> = ({
  conversation,
  onPressed,
}) => {
  const { data: profile } = useProfile(conversation.senderPublicKey);

  return (
    <button
      onClick={onPressed}
      className="w-full p-4 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <div className="flex items-center space-x-4">
        <div>
          {profile?.image && (
            <Image
              unoptimized
              src={profile?.image || ''} width={24} height={24} alt={profile?.name || conversation.senderPublicKey.slice(0, 8)} />
          )}
          <p>
            {profile?.name?.charAt(0) || conversation.senderPublicKey.slice(0, 2)}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium truncate">
              {profile?.name || conversation.senderPublicKey.slice(0, 8)}
            </p>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(conversation.created_at * 1000), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-gray-500 truncate">
            {conversation.content}
          </p>
        </div>
      </div>
    </button>
  );
};