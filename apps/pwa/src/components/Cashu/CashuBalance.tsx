import React from 'react';
import styles from '@/styles/components/_cashu-wallet.module.scss';
interface CashuBalanceProps {
  balance: number;
  unit: string;
  mintAlias: string;
  onChangeMint: () => void;
}

export const CashuBalance: React.FC<CashuBalanceProps> = ({
  balance,
  unit,
  mintAlias,
  onChangeMint,
}) => {
  return (
    <div className={styles['cashu-wallet__balance']}>
      <span className={styles['cashu-wallet__balance-amount']}>{balance}</span>
      <span className={styles['cashu-wallet__balance-unit']}>{unit}</span>
      <button 
        onClick={onChangeMint}
        className={styles['cashu-wallet__balance-mint']}
        title="Change mint"
      >
        {mintAlias} ▾
      </button>
    </div>
  );
}; 