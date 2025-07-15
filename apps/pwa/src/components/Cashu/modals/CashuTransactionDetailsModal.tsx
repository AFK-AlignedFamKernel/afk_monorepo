import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Icon } from '../../small/icon-component';
import { useUIStore } from '@/store/uiStore';
import { Transaction } from '@/utils/storage';
import styles from '@/styles/components/_cashu-wallet.module.scss';


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

  

  // Check if this transaction should show the quote check button
  const shouldShowQuoteCheck = () => {
    // Don't show check button for fallback payment hashes
    if (transaction.paymentHash?.startsWith('fallback-')) {
      return false;
    }
    
    return (
      transaction.type === 'received' && 
      transaction.status !== 'paid' &&
      (transaction.invoiceType === 'lightning' || transaction.token)
    );
  };

  return (
    <div className={styles['cashu-wallet__modal']}>
      <div className={styles['cashu-wallet__modal-content']}>
        <div className={styles['cashu-wallet__modal-content-header']}>
          <h3 className={styles['cashu-wallet__modal-content-header-title']}>{title}</h3>
          <button
            className={styles['cashu-wallet__modal-content-header-close']}
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="CloseIcon" size={24} />
          </button>
        </div>
        
        <div className={styles['cashu-wallet__modal-content-body']}>
          <div className={styles['cashu-wallet__transaction-details']}>
            <div className={styles['cashu-wallet__transaction-details-header']}>
              <div className={styles['cashu-wallet__transaction-details-amount']}>
                {transaction.type === 'sent' ? '-' : '+'}{transaction.amount} {transaction.unit || 'sats'}
              </div>
              <div className={styles['cashu-wallet__transaction-details-status']}>
                {transaction.status && (
                  <div className={styles['statusBadge'] + ' ' + styles[`status${transaction.status}`]}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles['cashu-wallet__transaction-details-info']}>
              <div className={styles['cashu-wallet__transaction-details-row']}>
                <div className={styles['cashu-wallet__transaction-details-label']}>Date:</div>
                <div className={styles['cashu-wallet__transaction-details-value']}>{formattedDate}</div>
              </div>
              
              {transaction.mintUrl && (
                <div className={styles['cashu-wallet__transaction-details-row']}>
                  <div className={styles['cashu-wallet__transaction-details-label']}>Mint:</div>
                  <div className={styles['cashu-wallet__transaction-details-value']}>{transaction.mintUrl}</div>
                </div>
              )}
              
              {transaction.memo && (
                <div className={styles['cashu-wallet__transaction-details-row']}>
                  <div className={styles['cashu-wallet__transaction-details-label']}>Memo:</div>
                  <div className={styles['cashu-wallet__transaction-details-value']}>{transaction.memo}</div>
                </div>
              )}
              
              {transaction.description && (
                <div className={styles['cashu-wallet__transaction-details-row']}>
                  <div className={styles['cashu-wallet__transaction-details-label']}>Description:</div>
                  <div className={styles['cashu-wallet__transaction-details-value']}>{transaction.description}</div>
                  <button onClick={handleCopy}><Icon name='CopyIcon' size={16} /></button>

                </div>
              )}
              
              {transaction.invoiceType === 'lightning' && transaction.paymentHash && (
                <div className={styles['cashu-wallet__transaction-details-row']}>
                  <div className={styles['cashu-wallet__transaction-details-label']}>Payment Hash:</div>
                  <div className={styles['cashu-wallet__transaction-details-value text-xs']}>
                    {transaction.paymentHash.startsWith('fallback-') 
                      ? `Temporary ID (cannot verify payment)` 
                      : transaction.paymentHash.length > 15 
                        ? `${transaction.paymentHash.substring(0, 15)}...` 
                        : transaction.paymentHash}
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.paymentHash || '');
                      showToast({
                        message: 'Payment hash copied',
                        type: 'success'
                      });
                    }}
                    aria-label="Copy payment hash"
                  >
                    <Icon name='CopyIcon' size={16} />
                  </button>
                </div>
              )}
              
              {/* Invoice or Token Data */}
              {(transaction.invoice || transaction.token) && (
                <div className={styles['cashu-wallet__transaction-details-data']}>
                  <div className={styles['cashu-wallet__transaction-details-label']}>
                    {transaction.invoiceType === 'lightning' ? 'Invoice:' : 'Token:'}
                  </div>
                  <div className={styles['cashu-wallet__form-group']}>
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                      <textarea
                        className={styles['cashu-wallet__form-group-textarea']}
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
                    className={styles['cashu-wallet__button'] + ' ' + styles['cashu-wallet__button--secondary']}
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
          <div className={styles['cashu-wallet__transaction-details-actions']}>
            {/* Lightning Invoice Payment Check Button */}
            {transaction.type === 'received' && 
             transaction.invoiceType === 'lightning' && 
             transaction.status !== 'paid' && 
             transaction.paymentHash && 
             !transaction.paymentHash.startsWith('fallback-') && 
             onCheckPayment && (
              <button 
                className={styles['cashu-wallet__button'] + ' ' + styles['cashu-wallet__button--primary']}
                onClick={handleCheckPayment}
                disabled={isCheckingPayment}
              >
                {isCheckingPayment ? 'Checking...' : 'Check Payment Status'}
              </button>
            )}
            
            {/* Quote Check Button for any received transaction */}
            {shouldShowQuoteCheck() && onCheckPayment && !(
              transaction.invoiceType === 'lightning' && transaction.paymentHash && !transaction.paymentHash.startsWith('fallback-')
            ) && (
              <button 
                className={styles['cashu-wallet__button'] + ' ' + styles['cashu-wallet__button--primary']}
                onClick={handleCheckPayment}
                disabled={isCheckingPayment}
              >
                {isCheckingPayment ? 'Checking...' : 'Check Quote Status'}
              </button>
            )}
            
            <button 
              className={styles['cashu-wallet__button'] + ' ' + styles['cashu-wallet__button--secondary']}
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