import React from 'react';
import { Icon } from '../small/icon-component';

interface CashuActionsProps {
  onSend: () => void;
  onReceive: () => void;
}

export const CashuActions: React.FC<CashuActionsProps> = ({
  onSend,
  onReceive,
}) => {
  return (
    <div className="cashu-wallet__actions">
      <button className="cashu-wallet__actions-button" onClick={onSend}>
        <Icon name="SendIcon" size={24} className="cashu-wallet__actions-button-icon" />
        <span className="cashu-wallet__actions-button-text">Send</span>
      </button>
      
      <div className="cashu-wallet__actions-scan">
        <Icon name="ScanIcon" size={24} />
      </div>
      
      <button className="cashu-wallet__actions-button" onClick={onReceive}>
        <Icon name="ReceiveIcon" size={24} className="cashu-wallet__actions-button-icon" />
        <span className="cashu-wallet__actions-button-text">Receive</span>
      </button>
    </div>
  );
}; 