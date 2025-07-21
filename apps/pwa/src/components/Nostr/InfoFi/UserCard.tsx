'use client';

import { useState } from 'react';
import { useAccount } from '@starknet-react/core';
import { useProfile } from 'afk_nostr_sdk';
import { formatUnits } from 'viem';
import styles from '@/styles/nostr/infofi-nostr.module.scss';
import { UserNostrCard } from './UserNostrCard';
import { NDKUserProfile } from '@nostr-dev-kit/ndk';

interface UserInfo {
  nostr_id: string;
  total_ai_score: string;
  total_vote_score: string;
  starknet_address?: string;
  is_add_by_admin?: boolean;
  epoch_states?: any[];
}

interface UserCardProps {
  userInfo?: UserInfo;
  isButtonInstantiateEnable?: boolean;
  contractAddress?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  userInfo,
  isButtonInstantiateEnable = true,
  contractAddress
}) => {
  const { account } = useAccount();
  const { data: profile } = useProfile({ publicKey: userInfo?.nostr_id });

  const formatDecimal = (value: any) => {
    if (!value) return '0';
    return formatUnits(BigInt(Math.floor(Number(value) * 1e18)), 18);
  };

  console.log("contractAddress", contractAddress);
  console.log("userInfo", userInfo);

  const handleSubscribe = async () => {
    try {
      // TODO: Implement actual subscription logic
      console.log('Subscribing to user:', userInfo?.nostr_id);
    } catch (error) {
      console.error('Subscription failed:', error);
    }
  };

  if (!userInfo) {
    return null;
  }

  return (
    <div className={styles.userCard}>
      <div className={styles.card}>
        <UserNostrCard 
          profileNostr={profile as NDKUserProfile} 
          profileIndexer={userInfo} 
          contractAddress={contractAddress} 
        />
        
        {isButtonInstantiateEnable && (
          <button
            onClick={handleSubscribe}
            className={styles.subscribeButton}
          >
            Subscribe
          </button>
        )}
      </div>
    </div>
  );
}; 