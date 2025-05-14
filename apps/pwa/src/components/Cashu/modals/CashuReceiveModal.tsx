import React, { useState, useEffect } from 'react';
import { Icon } from '../../small/icon-component';
import { useUIStore } from '@/store/uiStore';
import QRCode from 'react-qr-code';

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
  const { showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'lightning' | 'ecash'>('lightning');
  const [amount, setAmount] = useState<string>('');
  const [invoice, setInvoice] = useState<string>('');
  const [ecashToken, setEcashToken] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleTabChange = (tab: 'lightning' | 'ecash') => {
    setActiveTab(tab);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input before processing
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showToast({
        message: 'Invalid amount',
        type: 'error',
        description: 'Please enter a valid positive number'
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log(`Creating invoice for ${Number(amount)} ${unit} with mint: ${mint}`);
      const invoiceData = await onCreateInvoice(Number(amount));
      
      // Handle null or invalid response gracefully
      if (invoiceData && typeof invoiceData === 'object' && invoiceData.invoice) {
        // Only update state with valid invoice data
        setInvoice(invoiceData.invoice);
        showToast({
          message: `Invoice created`,
          type: 'success',
          description: `for ${amount} ${unit}`
        });
      } else {
        // Handle the case where no valid invoice was returned
        console.error('Invalid invoice data returned:', invoiceData);
        
        showToast({
          message: 'Invoice Creation Failed',
          type: 'error',
          description: 'Could not generate a valid invoice. Please check mint connection.'
        });
      }
    } catch (err) {
      // Handle specific error types
      let errorMessage = 'Failed to create invoice';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        console.error('Invoice creation error details:', err);
        
        // Map common mint errors to user-friendly messages
        if (errorMessage.includes('connect')) {
          errorMessage = 'Could not connect to the selected mint. Please try again or select a different mint.';
        } else if (errorMessage.includes('timeout')) {
          errorMessage = 'The connection to the mint timed out. Please try again.';
        } else if (errorMessage.includes('quote')) {
          errorMessage = 'The mint was unable to create an invoice. Please verify the mint is working correctly.';
        } else if (errorMessage.includes('Wallet not initialized')) {
          errorMessage = 'The wallet connection to the mint failed. Please try selecting the mint again from settings.';
        } else if (errorMessage.includes('undefined')) {
          errorMessage = 'There was a problem with the mint connection.';
        }
      }
      
      showToast({
        message: 'Invoice Creation Failed',
        type: 'error',
        description: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyInvoice = () => {
    try {
      if (!invoice) {
        showToast({
          message: 'No invoice to copy',
          type: 'error',
          description: 'Please create an invoice first'
        });
        return;
      }
      
      navigator.clipboard.writeText(invoice);
      setIsCopied(true);
      showToast({
        message: 'Invoice copied',
        type: 'success',
        description: 'Lightning invoice copied to clipboard'
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      showToast({
        message: 'Copy failed',
        type: 'error',
        description: 'Could not copy to clipboard'
      });
    }
  };

  const handleReceiveEcash = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input before processing
    if (!ecashToken || typeof ecashToken !== 'string' || !ecashToken.trim()) {
      showToast({
        message: 'Invalid token',
        type: 'error',
        description: 'Please enter a valid token'
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      await onReceiveToken(ecashToken);
      showToast({
        message: 'Token received successfully',
        type: 'success'
      });
      setEcashToken('');
      onClose(); // Close modal on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to receive token';
      
      // Map common errors to user-friendly messages
      let userMessage = errorMessage;
      if (errorMessage.includes('invalid')) {
        userMessage = 'The token format is invalid or corrupted';
      } else if (errorMessage.includes('spent')) {
        userMessage = 'This token has already been spent';
      } else if (errorMessage.includes('mint')) {
        userMessage = 'Could not connect to the mint to verify this token';
      }
      
      showToast({
        message: 'Error receiving token',
        type: 'error',
        description: userMessage
      });
      console.error('Error receiving token:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Format invoice for display
  const formatInvoice = (invoice: string) => {
    if (!invoice) return '';
    if (invoice.length <= 30) return invoice;
    
    return `${invoice.substring(0, 15)}...${invoice.substring(invoice.length - 15)}`;
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
                  {/* QR Code Display */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    margin: '16px 0',
                    background: '#FFFFFF',
                    padding: '16px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '12px',
                      color: '#000000',
                      fontWeight: 500
                    }}>
                      <span style={{ marginRight: '8px' }}>⚡</span>
                      <span>Lightning Invoice</span>
                    </div>
                    <QRCode
                      value={invoice}
                      size={256}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      viewBox={`0 0 256 256`}
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                      level="M"
                    />
                    <div style={{ 
                      fontSize: '14px', 
                      marginTop: '12px', 
                      textAlign: 'center',
                      color: '#000000'
                    }}>
                      {amount} {unit}
                    </div>
                  </div>
                  
                  <div className="cashu-wallet__form-group">
                    <label className="cashu-wallet__form-group-label">
                      Invoice Details
                    </label>
                    <div style={{ 
                      position: 'relative', 
                      marginBottom: '8px' 
                    }}>
                      <textarea
                        className="cashu-wallet__form-group-textarea"
                        value={invoice}
                        readOnly
                        style={{ 
                          paddingRight: '40px', 
                          fontSize: '14px',
                          fontFamily: 'monospace',
                          minHeight: '80px',
                          whiteSpace: 'nowrap',
                          overflowX: 'auto'
                        }}
                      />
                      <button
                        onClick={handleCopyInvoice}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '8px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                        aria-label="Copy invoice"
                      >
                        <Icon name={isCopied ? "CheckIcon" : "CopyIcon"} size={20} />
                      </button>
                    </div>
                    <p style={{ 
                      fontSize: '12px', 
                      color: 'var(--foreground-muted)',
                      marginTop: '4px'
                    }}>
                      Share this invoice to receive {amount} {unit}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="cashu-wallet__button cashu-wallet__button--primary"
                      onClick={handleCopyInvoice}
                    >
                      {isCopied ? 'Copied!' : 'Copy Invoice'}
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