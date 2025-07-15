import React, { ReactNode } from 'react';
import { Icon } from '../small/icon-component';
import styles from '@/styles/components/_cashu-wallet.module.scss';
interface CashuWalletProps {
  children: ReactNode;
  onOpenSettings: () => void;
}

export const CashuWallet: React.FC<CashuWalletProps> = ({
  children,
  onOpenSettings,
}) => {
  return (
    <div className={styles['cashu-wallet']}>
      <div className={styles['cashu-wallet__header']}>
        <h2 className={styles['cashu-wallet__header-title']}>Cashu Wallet</h2>
        <button
          className={styles['cashu-wallet__header-settings']}
          onClick={onOpenSettings}
          aria-label="Settings"
        >
          <Icon name="SettingsIcon" size={24} />
        </button>
      </div>
      {children}
    </div>
  );
}; 