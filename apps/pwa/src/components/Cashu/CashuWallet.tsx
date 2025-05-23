import React, { ReactNode } from 'react';
import { Icon } from '../small/icon-component';

interface CashuWalletProps {
  children: ReactNode;
  onOpenSettings: () => void;
}

export const CashuWallet: React.FC<CashuWalletProps> = ({
  children,
  onOpenSettings,
}) => {
  return (
    <div className="cashu-wallet">
      <div className="cashu-wallet__header">
        <h2 className="cashu-wallet__header-title">Cashu Wallet</h2>
        <button
          className="cashu-wallet__header-settings"
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