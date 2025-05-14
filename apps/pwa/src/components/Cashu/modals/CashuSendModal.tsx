import React, { useState } from 'react';
import { Icon } from '../../small/icon-component';

interface CashuSendModalProps {
  onClose: () => void;
  balance: number;
  unit: string;
}

export const CashuSendModal: React.FC<CashuSendModalProps> = ({
  onClose,
  balance,
  unit,
}) => {
  const [activeTab, setActiveTab] = useState<'lightning' | 'ecash'>('ecash');
  const [amount, setAmount] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleTabChange = (tab: 'lightning' | 'ecash') => {
    setActiveTab(tab);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // In a real implementation, this would handle the ecash sending logic
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="cashu-wallet__modal">
      <div className="cashu-wallet__modal-content">
        <div className="cashu-wallet__modal-content-header">
          <h3 className="cashu-wallet__modal-content-header-title">Send</h3>
          <button
            className="cashu-wallet__modal-content-header-close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="CloseIcon" size={24} />
          </button>
        </div>
        
        <div className="cashu-wallet__tabs">
          <div
            className={`cashu-wallet__tabs-item ${activeTab === 'lightning' ? 'cashu-wallet__tabs-item--active' : ''}`}
            onClick={() => handleTabChange('lightning')}
          >
            Lightning
          </div>
          <div
            className={`cashu-wallet__tabs-item ${activeTab === 'ecash' ? 'cashu-wallet__tabs-item--active' : ''}`}
            onClick={() => handleTabChange('ecash')}
          >
            Ecash
          </div>
        </div>
        
        <div className="cashu-wallet__modal-content-body">
          {activeTab === 'lightning' && (
            <form onSubmit={handleSend}>
              <div className="cashu-wallet__form-group">
                <label className="cashu-wallet__form-group-label">
                  Invoice
                </label>
                <textarea
                  className="cashu-wallet__form-group-textarea"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Paste Lightning Invoice"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="cashu-wallet__button cashu-wallet__button--primary"
                disabled={isProcessing || !recipient}
              >
                {isProcessing ? 'Processing...' : 'Pay Invoice'}
              </button>
            </form>
          )}
          
          {activeTab === 'ecash' && (
            <form onSubmit={handleSend}>
              <div className="cashu-wallet__form-group">
                <label className="cashu-wallet__form-group-label">
                  Amount ({unit})
                </label>
                <input
                  type="number"
                  className="cashu-wallet__form-group-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  max={String(balance)}
                  placeholder="Amount to send"
                  required
                />
                <small>Available balance: {balance} {unit}</small>
              </div>
              
              <button
                type="submit"
                className="cashu-wallet__button cashu-wallet__button--primary"
                disabled={isProcessing || !amount || Number(amount) > balance}
              >
                {isProcessing ? 'Processing...' : 'Generate Ecash Token'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}; 