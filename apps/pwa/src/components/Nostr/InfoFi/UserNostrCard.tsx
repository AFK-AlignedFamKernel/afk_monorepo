'use client';

import { useState } from 'react';
import { useAccount } from '@starknet-react/core';
import { NDKUserProfile } from '@nostr-dev-kit/ndk';
import { formatUnits } from 'viem';
import styles from '@/styles/nostr/infofi-nostr.module.scss';
import { useVoteTip } from '@/hooks/infofi';
import { cairo } from 'starknet';
import { UserNostrCardProps, VoteParams } from '@/types/infofi';


export const UserNostrCard: React.FC<UserNostrCardProps> = ({ 
  profile, 
  profileIndexer, 
  profileNostr,
  contractAddress 
}) => {
  const { account } = useAccount();
  const { handleVoteStarknetOnly, isVotingStarknetOnly } = useVoteTip();
  const [voteParams, setVoteParams] = useState<VoteParams>({
    nostr_address: profileIndexer?.nostr_id,
    // nostr_address: cairo.isTypeFelt(profileIndexer?.nostr_id ?? '') ? profileIndexer?.nostr_id?.toString(): `0x${profileIndexer?.nostr_id}`,
    vote: 'good',
    // is_upvote: true,
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
      await handleVoteStarknetOnly(voteParams, contractAddress);
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
                {profileNostr?.displayName?.[0] || profileNostr?.name?.[0] || 'A'}
              </div>
            </button>
          </div>

          <div className={styles.infoSection}>
            <h3 className={styles.userName}>
              {profileNostr?.displayName || profileNostr?.name || 'Anonymous'}
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

            {profileNostr?.nip05 && (
              <p className={styles.userId}>
                @{profileNostr.nip05}
              </p>
            )}

            {profileNostr?.about && (
              <p className={styles.userBio}>
                {profileNostr.about}
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
            disabled={!voteParams.amount || voteParams.amount === "0" || isVotingStarknetOnly}
          >
            {isVotingStarknetOnly ? 'Tipping...' : 'Tip'}
          </button>
        </div>
      </div>
    </div>
  );
}; 