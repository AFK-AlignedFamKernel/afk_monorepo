import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Icon } from '../../small/icon-component';
import { useUIStore } from '@/store/uiStore';
import { Transaction } from '@/utils/storage';

// CSS styles for the component
const styles = {
  statusBadge: {
    display: 'inline-flex',
    padding: '4px 8px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 500,
    textTransform: 'capitalize' as const,
  },
  statusPending: {
    backgroundColor: 'rgba(255, 171, 0, 0.1)',
    color: '#FFAB00',
    border: '1px solid rgba(255, 171, 0, 0.3)',
  },
  statusPaid: {
    backgroundColor: 'rgba(80, 200, 120, 0.1)',
    color: '#50C878',
    border: '1px solid rgba(80, 200, 120, 0.3)',
  },
  statusFailed: {
    backgroundColor: 'rgba(255, 76, 76, 0.1)',
    color: '#FF4C4C', 
    border: '1px solid rgba(255, 76, 76, 0.3)',
  },
};

interface CashuTransactionDetailsModalProps {
  transaction: Transaction;
  onClose: () => void;
  onCheckPayment: ((transaction: Transaction) => Promise<any>) | null;
  isCheckingPayment: boolean;
}

export const CashuTransactionDetailsModal: React.FC<CashuTransactionDetailsModalProps> = ({
  transaction,
  onClose,
  onCheckPayment,
  isCheckingPayment
}) => {
  const { showToast } = useUIStore();
  const [showQR, setShowQR] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!transaction) {
    return null;
  }

  // Format the date to be more user-friendly
  const date = new Date(transaction.date);
  const formattedDate = date.toLocaleString();

  // Determine transaction type for display
  let title = transaction.type === 'sent' ? 'Sent' : 'Received';
  if (transaction.invoiceType === 'lightning') {
    title += ' (Lightning)';
  } else if (transaction.token) {
    title += ' (Ecash)';
  }

  // Get content to display/copy based on transaction type
  const getContentToCopy = () => {
    if (transaction.invoiceType === 'lightning') {
      return transaction.invoice || '';
    } else if (transaction.token) {
      return transaction.token;
    }
    return '';
  };

  const handleCopy = async () => {
    const content = getContentToCopy();
    
    if (!content) {
      showToast({
        message: 'Nothing to copy',
        type: 'error',
        description: 'No invoice or token data available'
      });
      return;
    }
    
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      showToast({
        message: 'Copied to clipboard',
        type: 'success'
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

  const handleCheckPayment = () => {
    if (onCheckPayment) {
      onCheckPayment(transaction);
    }
  };

  const toggleQRCode = () => {
    setShowQR(!showQR);
  };

  // Function to get the appropriate status badge style
  const getStatusStyle = () => {
    switch (transaction.status) {
      case 'pending':
        return { ...styles.statusBadge, ...styles.statusPending };
      case 'paid':
        return { ...styles.statusBadge, ...styles.statusPaid };
      case 'failed':
        return { ...styles.statusBadge, ...styles.statusFailed };
      default:
        return styles.statusBadge;
    }
  };

  // Check if this transaction should show the quote check button
  const shouldShowQuoteCheck = () => {
    return (
      transaction.type === 'received' && 
      transaction.status !== 'paid' &&
      (transaction.invoiceType === 'lightning' || transaction.token)
    );
  };

  return (
    <div className="cashu-wallet__modal">
      <div className="cashu-wallet__modal-content">
        <div className="cashu-wallet__modal-content-header">
          <h3 className="cashu-wallet__modal-content-header-title">{title}</h3>
          <button
            className="cashu-wallet__modal-content-header-close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="CloseIcon" size={24} />
          </button>
        </div>
        
        <div className="cashu-wallet__modal-content-body">
          <div className="cashu-wallet__transaction-details">
            <div className="cashu-wallet__transaction-details-header">
              <div className="cashu-wallet__transaction-details-amount">
                {transaction.type === 'sent' ? '-' : '+'}{transaction.amount} {transaction.unit || 'sats'}
              </div>
              <div className="cashu-wallet__transaction-details-status">
                {transaction.status && (
                  <div style={getStatusStyle()}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="cashu-wallet__transaction-details-info">
              <div className="cashu-wallet__transaction-details-row">
                <div className="cashu-wallet__transaction-details-label">Date:</div>
                <div className="cashu-wallet__transaction-details-value">{formattedDate}</div>
              </div>
              
              {transaction.mintUrl && (
                <div className="cashu-wallet__transaction-details-row">
                  <div className="cashu-wallet__transaction-details-label">Mint:</div>
                  <div className="cashu-wallet__transaction-details-value">{transaction.mintUrl}</div>
                </div>
              )}
              
              {transaction.memo && (
                <div className="cashu-wallet__transaction-details-row">
                  <div className="cashu-wallet__transaction-details-label">Memo:</div>
                  <div className="cashu-wallet__transaction-details-value">{transaction.memo}</div>
                </div>
              )}
              
              {transaction.description && (
                <div className="cashu-wallet__transaction-details-row">
                  <div className="cashu-wallet__transaction-details-label">Description:</div>
                  <div className="cashu-wallet__transaction-details-value">{transaction.description}</div>
                </div>
              )}
              
              {transaction.invoiceType === 'lightning' && transaction.paymentHash && (
                <div className="cashu-wallet__transaction-details-row">
                  <div className="cashu-wallet__transaction-details-label">Payment Hash:</div>
                  <div className="cashu-wallet__transaction-details-value text-xs">
                    {transaction.paymentHash.length > 15 
                      ? `${transaction.paymentHash.substring(0, 15)}...` 
                      : transaction.paymentHash}
                  </div>
                </div>
              )}
              
              {/* Invoice or Token Data */}
              {(transaction.invoice || transaction.token) && (
                <div className="cashu-wallet__transaction-details-data">
                  <div className="cashu-wallet__transaction-details-label">
                    {transaction.invoiceType === 'lightning' ? 'Invoice:' : 'Token:'}
                  </div>
                  <div className="cashu-wallet__form-group">
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                      <textarea
                        className="cashu-wallet__form-group-textarea"
                        value={getContentToCopy()}
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
                        onClick={handleCopy}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '8px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                        aria-label="Copy"
                      >
                        <Icon name={isCopied ? "CheckIcon" : "CopyIcon"} size={20} />
                      </button>
                    </div>
                  </div>
                  
                  {/* QR Code Toggle Button */}
                  <button
                    className="cashu-wallet__button cashu-wallet__button--secondary"
                    onClick={toggleQRCode}
                    style={{ marginBottom: '16px' }}
                  >
                    {showQR ? 'Hide QR Code' : 'Show QR Code'}
                  </button>
                  
                  {/* QR Code Display */}
                  {showQR && (
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
                        <span style={{ marginRight: '8px' }}>
                          {transaction.invoiceType === 'lightning' ? '⚡' : '💸'}
                        </span>
                        <span>
                          {transaction.invoiceType === 'lightning' ? 'Lightning Invoice' : 'Ecash Token'}
                        </span>
                      </div>
                      <QRCode
                        value={getContentToCopy()}
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
                        {transaction.amount} {transaction.unit || 'sats'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="cashu-wallet__transaction-details-actions">
            {/* Lightning Invoice Payment Check Button */}
            {transaction.type === 'received' && 
             transaction.invoiceType === 'lightning' && 
             transaction.status !== 'paid' && 
             transaction.paymentHash && onCheckPayment && (
              <button 
                className="cashu-wallet__button cashu-wallet__button--primary"
                onClick={handleCheckPayment}
                disabled={isCheckingPayment}
              >
                {isCheckingPayment ? 'Checking...' : 'Check Payment Status'}
              </button>
            )}
            
            {/* Quote Check Button for any received transaction */}
            {shouldShowQuoteCheck() && onCheckPayment && !(
              transaction.invoiceType === 'lightning' && transaction.paymentHash
            ) && (
              <button 
                className="cashu-wallet__button cashu-wallet__button--primary"
                onClick={handleCheckPayment}
                disabled={isCheckingPayment}
              >
                {isCheckingPayment ? 'Checking...' : 'Check Quote Status'}
              </button>
            )}
            
            <button 
              className="cashu-wallet__button cashu-wallet__button--secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 