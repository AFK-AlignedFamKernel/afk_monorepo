import React, { useState } from 'react';
import { Icon } from '../../small/icon-component';

interface CashuReceiveModalProps {
  onClose: () => void;
  mint: string;
  unit: string;
}

export const CashuReceiveModal: React.FC<CashuReceiveModalProps> = ({
  onClose,
  mint,
  unit,
}) => {
  const [activeTab, setActiveTab] = useState<'lightning' | 'ecash'>('lightning');
  const [amount, setAmount] = useState<string>('');
  const [invoice, setInvoice] = useState<string>('');
  const [ecashToken, setEcashToken] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleTabChange = (tab: 'lightning' | 'ecash') => {
    setActiveTab(tab);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // In a real implementation, this would create a lightning invoice
    setTimeout(() => {
      setInvoice('lnbc1500n1p0z3n32pp5xyax8c9zhttz3dz0xvhujvs9j5tcq3d4vz82f57u6r8e3st5v0sdqqcqzpgxqyz5vqsp5fckmrhwv08luva4f8gqr0ntjcpzjgv89tq8qr9keuwatp5r36mfs9qyyssqcyarj6953ghafs6v5fenjxf8penjrh97lmnycnttvuy5vldxz7688rwymzgtcvywe8ssx33fsw05tewvmxu9835m6w0d5hj5mktx49mgqcw7al6');
      setIsProcessing(false);
    }, 1500);
  };

  const handleReceiveEcash = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // In a real implementation, this would handle the ecash token
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 1500);
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