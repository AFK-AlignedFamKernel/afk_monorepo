'use client';

import { formatUnits } from 'viem';
import styles from '@/styles/nostr/infofi-nostr.module.scss';

interface SubInfo {
  contract_address: string;
  name: string;
  about: string;
  main_tag: string;
  total_amount_deposit: string;
}

interface SubCardProps {
  subInfo: SubInfo;
  onPress?: () => void;
}

export const SubCard: React.FC<SubCardProps> = ({
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
        <h3 className={styles.subCardTitle + "overflow-hidden text-ellipsis whitespace-nowrap"}>
          {subInfo.name}
        </h3>
        <span className={styles.subCardTag + "overflow-hidden text-ellipsis whitespace-nowrap"}>
          {subInfo.main_tag}
        </span>
        <p className="mt-2 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
          {subInfo.about}
        </p>
      </div>
      
      <div className="mt-4">
        <div className={styles.overviewItem}>
          <span className={styles.overviewLabel}>Total Deposits</span>
          <div className={styles.overviewValue}>
            {formatDecimal(subInfo.total_amount_deposit)}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs font-mono overflow-hidden text-ellipsis whitespace-nowrap">
        {subInfo.contract_address}
      </div>
    </div>
  );
}; 