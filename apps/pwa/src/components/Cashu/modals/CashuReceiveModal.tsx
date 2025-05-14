import React, { useState } from 'react';
import { Icon } from '../../small/icon-component';

interface CashuReceiveModalProps {
  onClose: () => void;
  mint: string;
  unit: string;
  onReceiveToken: (token: string) => Promise<void>;
  onCreateInvoice: (amount: number) => Promise<any>;
}

export const CashuReceiveModal: React.FC<CashuReceiveModalProps> = ({
  onClose,
  mint,
  unit,
  onReceiveToken,
  onCreateInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'lightning' | 'ecash'>('lightning');
  const [amount, setAmount] = useState<string>('');
  const [invoice, setInvoice] = useState<string>('');
  const [ecashToken, setEcashToken] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (tab: 'lightning' | 'ecash') => {
    setActiveTab(tab);
    setError(null);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    
    try {
      const invoiceData = await onCreateInvoice(Number(amount));
      if (invoiceData && invoiceData.invoice) {
        setInvoice(invoiceData.invoice);
      } else {
        throw new Error('Failed to create invoice');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReceiveEcash = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    
    try {
      await onReceiveToken(ecashToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to receive token');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="cashu-wallet__modal">
      <div className="cashu-wallet__modal-content">
        <div className="cashu-wallet__modal-content-header">
          <h3 className="cashu-wallet__modal-content-header-title">Receive</h3>
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
          {error && (
            <div style={{ color: '#EF4444', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          
          {activeTab === 'lightning' && (
            <>
              {!invoice ? (
                <form onSubmit={handleCreateInvoice}>
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
                      placeholder="Amount to receive"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="cashu-wallet__button cashu-wallet__button--primary"
                    disabled={isProcessing || !amount}
                  >
                    {isProcessing ? 'Processing...' : 'Create Invoice'}
                  </button>
                </form>
              ) : (
                <div className="cashu-wallet__invoice">
                  <div className="cashu-wallet__form-group">
                    <label className="cashu-wallet__form-group-label">
                      Lightning Invoice
                    </label>
                    <textarea
                      className="cashu-wallet__form-group-textarea"
                      value={invoice}
                      readOnly
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="cashu-wallet__button cashu-wallet__button--primary"
                      onClick={() => {
                        navigator.clipboard.writeText(invoice);
                      }}
                    >
                      Copy Invoice
                    </button>
                    <button
                      className="cashu-wallet__button cashu-wallet__button--secondary"
                      onClick={() => setInvoice('')}
                    >
                      New Invoice
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          
          {activeTab === 'ecash' && (
            <form onSubmit={handleReceiveEcash}>
              <div className="cashu-wallet__form-group">
                <label className="cashu-wallet__form-group-label">
                  Ecash Token
                </label>
                <textarea
                  className="cashu-wallet__form-group-textarea"
                  value={ecashToken}
                  onChange={(e) => setEcashToken(e.target.value)}
                  placeholder="Paste Cashu token (cashuXYZ...)"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="cashu-wallet__button cashu-wallet__button--primary"
                disabled={isProcessing || !ecashToken}
              >
                {isProcessing ? 'Processing...' : 'Redeem Token'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}; 