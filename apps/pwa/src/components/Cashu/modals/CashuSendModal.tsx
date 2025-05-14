import React, { useState } from 'react';
import { Icon } from '../../small/icon-component';
import { useUIStore } from '@/store/uiStore';

interface CashuSendModalProps {
  onClose: () => void;
  balance: number;
  unit: string;
  onSendToken: (amount: number) => Promise<void>;
  onPayInvoice: (invoice: string) => Promise<void>;
}

export const CashuSendModal: React.FC<CashuSendModalProps> = ({
  onClose,
  balance,
  unit,
  onSendToken,
  onPayInvoice,
}) => {
  const { showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'lightning' | 'ecash'>('ecash');
  const [amount, setAmount] = useState<string>('');
  const [invoice, setInvoice] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleTabChange = (tab: 'lightning' | 'ecash') => {
    setActiveTab(tab);
  };

  const handleSendEcash = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      await onSendToken(Number(amount));
      showToast({
        message: 'Ecash token created',
        type: 'success',
        description: `${amount} ${unit}`
      });
      onClose(); // Close modal on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send ecash';
      showToast({
        message: 'Error creating token',
        type: 'error',
        description: errorMessage
      });
      console.error('Error sending ecash:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayLightningInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      await onPayInvoice(invoice);
      showToast({
        message: 'Payment successful',
        type: 'success',
        description: 'Lightning invoice paid'
      });
      onClose(); // Close modal on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pay invoice';
      showToast({
        message: 'Payment failed',
        type: 'error',
        description: errorMessage
      });
      console.error('Error paying invoice:', err);
    } finally {
      setIsProcessing(false);
    }
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
            <form onSubmit={handlePayLightningInvoice}>
              <div className="cashu-wallet__form-group">
                <label className="cashu-wallet__form-group-label">
                  Invoice
                </label>
                <textarea
                  className="cashu-wallet__form-group-textarea"
                  value={invoice}
                  onChange={(e) => setInvoice(e.target.value)}
                  placeholder="Paste Lightning Invoice"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="cashu-wallet__button cashu-wallet__button--primary"
                disabled={isProcessing || !invoice}
              >
                {isProcessing ? 'Processing...' : 'Pay Invoice'}
              </button>
            </form>
          )}
          
          {activeTab === 'ecash' && (
            <form onSubmit={handleSendEcash}>
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