import React from 'react';
import { Icon } from '../small/icon-component';
import styles from '@/styles/components/_cashu-wallet.module.scss';
interface CashuActionsProps {
  onSend: () => void;
  onReceive: () => void;
}

export const CashuActions: React.FC<CashuActionsProps> = ({
  onSend,
  onReceive,
}) => {
  return (
    <div className={styles['cashu-wallet__actions']}>
      <button className={styles['cashu-wallet__actions-button']} onClick={onSend}>
        <Icon name="SendIcon" size={24} className={styles['cashu-wallet__actions-button-icon']} />
        <span className={styles['cashu-wallet__actions-button-text']}>Send</span>
      </button>
      
      <div className={styles['cashu-wallet__actions-scan']}>
        <Icon name="ScanIcon" size={24} />
      </div>
      
      <button className={styles['cashu-wallet__actions-button']} onClick={onReceive}>
        <Icon name="ReceiveIcon" size={24} className={styles['cashu-wallet__actions-button-icon']} />
        <span className={styles['cashu-wallet__actions-button-text']}>Receive</span>
      </button>
    </div>
  );
}; 