'use client';

import { useState } from 'react';
import { useAccount } from '@starknet-react/core';
import { NDKUserProfile } from '@nostr-dev-kit/ndk';
import { formatUnits } from 'viem';
import styles from '@/styles/nostr/infofi-nostr.module.scss';
import { useVoteTip } from '@/hooks/infofi';

interface UserInfo {
  nostr_id: string;
  total_ai_score: string;
  total_vote_score: string;
  starknet_address?: string;
  is_add_by_admin?: boolean;
  epoch_states?: any[];
}

interface VoteParams {
  nostr_address?: string;
  vote: string;
  is_upvote: boolean;
  upvote_amount: string;
  downvote_amount: string;
  amount: string;
  amount_token: string;
}

interface UserNostrCardProps {
  profile?: NDKUserProfile;
  profileIndexer?: UserInfo;
  contractAddressSubScore?: string;
  event?: any;
  isRepostProps?: boolean;
  isBookmarked?: boolean;
  isReplyView?: boolean;
  isArticle?: boolean;
}

export const UserNostrCard: React.FC<UserNostrCardProps> = ({ 
  profile, 
  profileIndexer, 
  contractAddressSubScore 
}) => {
  const { account } = useAccount();
  const [voteParams, setVoteParams] = useState<VoteParams>({
    nostr_address: profileIndexer?.nostr_id,
    vote: 'good',
    is_upvote: true,
    upvote_amount: "0",
    downvote_amount: "0",
    amount: "0",
    amount_token: "0",
  });

  const formatDecimal = (value: any) => {
    if (!value) return '0';
    return formatUnits(BigInt(Math.floor(Number(value) * 1e18)), 18);
  };

  const handleProfilePress = (userId?: string) => {
    if (profileIndexer?.nostr_id) {
      // TODO: Navigate to profile page
      console.log('Navigate to profile:', profileIndexer.nostr_id);
    }
  };

  const handleTipUser = async () => {
    try {
      // TODO: Implement actual tip logic
      console.log('Tipping user:', voteParams);
      console.log('Contract address:', contractAddressSubScore);
    } catch (error) {
      console.error('Tip failed:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div>
        {/* Profile Section */}
        <div className={styles.profileContainer}>
          <div className={styles.avatarSection}>
            <button
              onClick={() => handleProfilePress(profileIndexer?.nostr_id)}
              className="focus:outline-none"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-cyan-500 flex items-center justify-center text-white font-semibold">
                {profile?.displayName?.[0] || profile?.name?.[0] || 'A'}
              </div>
            </button>
          </div>

          <div className={styles.infoSection}>
            <h3 className={styles.userName}>
              {profile?.displayName || profile?.name || 'Anonymous'}
            </h3>
            
            <p className={styles.userId}>
              {profileIndexer?.nostr_id}
            </p>
            
            <p className={styles.userId}>
              AI Score: {profileIndexer?.total_ai_score}
            </p>
            
            <p className={styles.userId}>
              Vote Score: {profileIndexer?.total_vote_score}
            </p>

            {profile?.nip05 && (
              <p className={styles.userId}>
                @{profile.nip05}
              </p>
            )}

            {profile?.about && (
              <p className={styles.userBio}>
                {profile.about}
              </p>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className={styles.statsContainer}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>AI Score</span>
            <div className={styles.statValue}>
              {formatDecimal(profileIndexer?.total_ai_score)}
            </div>
          </div>
          
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Vote Score</span>
            <div className={styles.statValue}>
              {formatDecimal(profileIndexer?.total_vote_score)}
            </div>
          </div>
        </div>

        {/* Tip Form */}
        <div className={styles.tipForm}>
          <h4 className={styles.tipFormTitle}>Tip and boost user</h4>
          <input
            type="number"
            placeholder="Amount"
            value={voteParams.amount}
            onChange={(e) => {
              const value = e.target.value;
              setVoteParams({ 
                ...voteParams, 
                amount: value, 
                amount_token: value, 
                upvote_amount: value, 
                downvote_amount: value 
              });
            }}
            className={styles.tipInput}
          />
          <button
            onClick={handleTipUser}
            className={styles.tipButton}
            disabled={!voteParams.amount || voteParams.amount === "0"}
          >
            Tip
          </button>
        </div>
      </div>
    </div>
  );
}; 