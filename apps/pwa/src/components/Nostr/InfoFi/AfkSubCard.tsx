'use client';

import { formatUnits } from 'viem';
import styles from '@/styles/nostr/infofi-nostr.module.scss';

interface SubInfo {
  name?: string;
  main_tag?: string;
  total_ai_score?: string;
  total_vote_score?: string;
  total_tips?: string;
  total_amount_deposit?: string;
  contract_address?: string;
}

interface AfkSubCardProps {
  subInfo?: SubInfo;
  onPress?: () => void;
}

export const AfkSubCard: React.FC<AfkSubCardProps> = ({
  subInfo,
  onPress
}) => {
  const formatDecimal = (value: any) => {
    if (!value) return '0';
    return formatUnits(BigInt(Math.floor(Number(value) * 1e18)), 18);
  };

  const handleClick = () => {
    if (onPress) {
      onPress();
    }
  };

  return (
    <div 
      className={styles.afkSubCard}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div>
        <h2 className={styles.subCardTitle}>
          {subInfo?.name ?? "AFK"}
        </h2>
        <span className={styles.subCardTag}>
          {subInfo?.main_tag ?? "cypherpunk"}
        </span>
      </div>
      
      <div className={styles.overviewGrid}>
        <div className={styles.overviewItem}>
          <span className={styles.overviewLabel}>Total AI Score</span>
          <div className={styles.overviewValue}>
            {formatDecimal(subInfo?.total_ai_score)}
          </div>
        </div>
        
        <div className={styles.overviewItem}>
          <span className={styles.overviewLabel}>Total Vote Score</span>
          <div className={styles.overviewValue}>
            {formatDecimal(subInfo?.total_vote_score)}
          </div>
        </div>
        
        <div className={styles.overviewItem}>
          <span className={styles.overviewLabel}>Total Tips</span>
          <div className={styles.overviewValue}>
            {formatDecimal(subInfo?.total_tips)}
          </div>
        </div>
        
        <div className={styles.overviewItem}>
          <span className={styles.overviewLabel}>Total Deposits</span>
          <div className={styles.overviewValue}>
            {formatDecimal(subInfo?.total_amount_deposit)}
          </div>
        </div>
      </div>
    </div>
  );
}; 