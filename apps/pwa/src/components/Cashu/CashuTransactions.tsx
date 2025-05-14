import React, { useState } from 'react';
import { Icon } from '../small/icon-component';
import { Transaction } from '@/utils/storage';
import { useUIStore } from '@/store/uiStore';
import QRCode from 'react-qr-code';

interface CashuTransactionsProps {
  transactions: Transaction[];
  onCheckPayment?: (transaction: Transaction) => void;
  onTransactionClick?: (transaction: Transaction) => void;
}

type TabType = 'all' | 'in' | 'out' | 'mintQuote';

export const CashuTransactions: React.FC<CashuTransactionsProps> = ({
  transactions,
  onCheckPayment,
  onTransactionClick,
}) => {
  const { showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [qrCodeTransaction, setQrCodeTransaction] = useState<Transaction | null>(null);
  
  // Get a human-readable status label
  const getStatusLabel = (status?: string) => {
    if (!status) return null;
    
    switch (status) {
      case 'pending':
        return <span className="cashu-wallet__status-badge cashu-wallet__status-badge--pending">Pending</span>;
      case 'paid':
        return <span className="cashu-wallet__status-badge cashu-wallet__status-badge--success">Paid</span>;
      case 'failed':
        return <span className="cashu-wallet__status-badge cashu-wallet__status-badge--error">Failed</span>;
      default:
        return null;
    }
  };
  
  // Filter transactions based on active tab
  const getFilteredTransactions = () => {
    switch (activeTab) {
      case 'in':
        return transactions.filter(tx => tx.type === 'received');
      case 'out':
        return transactions.filter(tx => tx.type === 'sent');
      case 'mintQuote':
        return transactions.filter(tx => 
          tx.invoiceType === 'lightning' || 
          (tx.type === 'received' && tx.token)
        );
      case 'all':
      default:
        return transactions;
    }
  };
  
  // Determine if this transaction should show a check button
  const shouldShowCheckButton = (transaction: Transaction) => {
    // For lightning invoices
    if (transaction.type === 'received' && 
        transaction.invoiceType === 'lightning' && 
        transaction.status !== 'paid' && 
        transaction.paymentHash) {
      return true;
    }
    
    // For other types of quotes (tokens, etc.)
    if (transaction.type === 'received' && 
        transaction.status !== 'paid' && 
        (transaction.token || transaction.invoiceType)) {
      return true;
    }
    
    return false;
  };
  
  // Check if transaction is a receivable type (Lightning or Ecash)
  const isReceivableTransaction = (transaction: Transaction) => {
    return transaction.type === 'received' && 
           (transaction.invoiceType === 'lightning' || transaction.token) &&
           transaction.status !== 'paid';
  };
  
  // Get appropriate button text based on transaction type
  const getCheckButtonText = (transaction: Transaction) => {
    if (transaction.invoiceType === 'lightning') {
      return 'Check Payment';
    }
    return 'Check Quote';
  };
  
  // Get content to copy based on transaction type
  const getContentToCopy = (transaction: Transaction) => {
    if (transaction.invoiceType === 'lightning') {
      return transaction.invoice || '';
    } else if (transaction.token) {
      return transaction.token;
    }
    return '';
  };

  // Handle copying content to clipboard
  const handleCopy = async (transaction: Transaction, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the onTransactionClick
    
    const content = getContentToCopy(transaction);
    
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
      showToast({
        message: 'Copied to clipboard',
        type: 'success'
      });
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      showToast({
        message: 'Copy failed',
        type: 'error',
        description: 'Could not copy to clipboard'
      });
    }
  };

  // Toggle QR code display
  const toggleQRCode = (transaction: Transaction, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the onTransactionClick
    
    if (qrCodeTransaction && qrCodeTransaction.id === transaction.id) {
      setQrCodeTransaction(null); // Close if the same transaction
    } else {
      setQrCodeTransaction(transaction); // Open for this transaction
    }
  };

  // Check if transaction has copyable content
  const hasCopyableContent = (transaction: Transaction) => {
    return transaction.invoice || transaction.token;
  };

  // Function to download QR code as image
  const handleDownloadQR = (transaction: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const qrCodeElement = document.getElementById(`qr-code-${transaction.id}`);
    if (!qrCodeElement) {
      showToast({
        message: 'Could not download QR code',
        type: 'error',
        description: 'QR code element not found'
      });
      return;
    }
    
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const svgData = new XMLSerializer().serializeToString(qrCodeElement.querySelector('svg')!);
      
      // Create an image from SVG
      const img = new Image();
      img.onload = () => {
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw white background and image
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Create download link
        const link = document.createElement('a');
        link.download = `qr-code-${transaction.amount}-${transaction.unit || 'sats'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        showToast({
          message: 'QR code downloaded',
          type: 'success'
        });
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } catch (err) {
      console.error('Error downloading QR code:', err);
      showToast({
        message: 'Download failed',
        type: 'error',
        description: 'Could not download QR code image'
      });
    }
  };
  
  const filteredTransactions = getFilteredTransactions();
  
  return (
    <div className="cashu-wallet__transactions">
      <div className="cashu-wallet__transactions-header">
        <h3 className="cashu-wallet__transactions-header-title">Recent Transactions</h3>
        <a href="#" className="cashu-wallet__transactions-header-view-all">View All</a>
      </div>
      
      <div className="cashu-wallet__tabs">
        <div 
          className={`cashu-wallet__tabs-item ${activeTab === 'all' ? 'cashu-wallet__tabs-item--active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </div>
        <div 
          className={`cashu-wallet__tabs-item ${activeTab === 'in' ? 'cashu-wallet__tabs-item--active' : ''}`}
          onClick={() => setActiveTab('in')}
        >
          In
        </div>
        <div 
          className={`cashu-wallet__tabs-item ${activeTab === 'out' ? 'cashu-wallet__tabs-item--active' : ''}`}
          onClick={() => setActiveTab('out')}
        >
          Out
        </div>
        <div 
          className={`cashu-wallet__tabs-item ${activeTab === 'mintQuote' ? 'cashu-wallet__tabs-item--active' : ''}`}
          onClick={() => setActiveTab('mintQuote')}
        >
          Quotes
        </div>
      </div>
      
      <div className="cashu-wallet__transactions-list">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <React.Fragment key={transaction.id}>
              <div 
                className="cashu-wallet__transactions-list-item"
                onClick={() => onTransactionClick && onTransactionClick(transaction)}
              >
                <div className="cashu-wallet__transactions-list-item-icon">
                  <Icon 
                    name={
                      transaction.invoiceType === 'lightning' 
                        ? 'LightningIcon' 
                        : transaction.type === 'sent' 
                          ? 'SendIcon' 
                          : 'ReceiveIcon'
                    } 
                    size={16} 
                  />
                </div>
                <div className="cashu-wallet__transactions-list-item-details">
                  <div className="cashu-wallet__transactions-list-item-details-title">
                    {transaction.type === 'sent' ? 'Sent' : 'Received'}
                    {transaction.invoiceType === 'lightning' && ' (Lightning)'}
                    {transaction.token && !transaction.invoiceType && ' (Ecash)'}
                  </div>
                  <div className="cashu-wallet__transactions-list-item-details-date">
                    {transaction.date}
                  </div>
                  {transaction.memo && (
                    <div className="cashu-wallet__transactions-list-item-details-memo">
                      {transaction.memo}
                    </div>
                  )}
                  {getStatusLabel(transaction.status)}
                </div>
                <div className="cashu-wallet__transactions-list-item-actions">
                  <div className={`cashu-wallet__transactions-list-item-amount cashu-wallet__transactions-list-item-amount--${transaction.type}`}>
                    {transaction.type === 'sent' ? '-' : '+'}{transaction.amount}
                  </div>
                  
                  {/* Quick action buttons */}
                  <div className="cashu-wallet__transactions-list-item-quick-actions">
                    {hasCopyableContent(transaction) && (
                      <button 
                        className="cashu-wallet__transactions-list-item-icon-btn"
                        onClick={(e) => handleCopy(transaction, e)}
                        title="Copy Invoice/Token"
                      >
                        <Icon name="CopyIcon" size={16} />
                      </button>
                    )}
                    
                    {hasCopyableContent(transaction) && (
                      <button 
                        className="cashu-wallet__transactions-list-item-icon-btn"
                        onClick={(e) => toggleQRCode(transaction, e)}
                        title="Show QR Code"
                      >
                        <Icon name="ScanIcon" size={16} />
                      </button>
                    )}
                  </div>
                  
                  {/* Receive button for receivable transactions */}
                  {isReceivableTransaction(transaction) && (
                    <button 
                      className="cashu-wallet__transactions-list-item-receive-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleQRCode(transaction, e);
                      }}
                    >
                      <Icon name="ReceiveIcon" size={14} style={{marginRight: '4px'}} />
                      Receive
                    </button>
                  )}
                  
                  {/* Check payment button */}
                  {shouldShowCheckButton(transaction) && onCheckPayment && (
                    <button 
                      className="cashu-wallet__transactions-list-item-check-btn"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the onTransactionClick
                        onCheckPayment(transaction);
                      }}
                    >
                      {getCheckButtonText(transaction)}
                    </button>
                  )}
                </div>
              </div>
              
              {/* QR Code Display */}
              {qrCodeTransaction && qrCodeTransaction.id === transaction.id && (
                <div className="cashu-wallet__transactions-list-item-qr-container">
                  <div className="cashu-wallet__transactions-list-item-qr-content">
                    <div className="cashu-wallet__transactions-list-item-qr-header">
                      <div className="cashu-wallet__transactions-list-item-qr-title">
                        <span className="cashu-wallet__transactions-list-item-qr-icon">
                          {transaction.invoiceType === 'lightning' ? '⚡' : '💸'}
                        </span>
                        <span>
                          {transaction.invoiceType === 'lightning' ? 'Lightning Invoice' : 'Ecash Token'}
                        </span>
                      </div>
                      <button 
                        className="cashu-wallet__transactions-list-item-qr-close"
                        onClick={(e) => toggleQRCode(transaction, e)}
                      >
                        <Icon name="CloseIcon" size={16} />
                      </button>
                    </div>
                    
                    {/* Simplified QR Code approach */}
                    <div className="cashu-wallet__transactions-list-item-qr-simple">
                      <div className="cashu-wallet__transactions-list-item-qr-code-wrapper" id={`qr-code-${transaction.id}`}>
                        <QRCode
                          value={getContentToCopy(transaction) || 'No data available'}
                          size={250}
                          bgColor="#FFFFFF"
                          fgColor="#000000" 
                          level="L"
                        />
                      </div>
                      
                      <div className="cashu-wallet__transactions-list-item-qr-amount">
                        {transaction.amount} {transaction.unit || 'sats'}
                      </div>
                    </div>
                    
                    <div className="cashu-wallet__transactions-list-item-qr-actions">
                      <div className="cashu-wallet__transactions-list-item-qr-buttons">
                        <button 
                          className="cashu-wallet__button cashu-wallet__button--primary"
                          onClick={(e) => handleCopy(transaction, e)}
                        >
                          <Icon name="CopyIcon" size={16} style={{marginRight: '4px'}} />
                          Copy
                        </button>
                        
                        <button 
                          className="cashu-wallet__button cashu-wallet__button--secondary"
                          onClick={(e) => handleDownloadQR(transaction, e)}
                        >
                          <Icon name="SettingsIcon" size={16} style={{marginRight: '4px'}} />
                          Save QR
                        </button>
                      </div>
                      
                      {isReceivableTransaction(transaction) && (
                        <div className="cashu-wallet__transactions-list-item-qr-instruction">
                          Scan this QR code or share the copied code to receive payment
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))
        ) : (
          <div className="cashu-wallet__transactions-empty">
            {activeTab === 'all' 
              ? 'No transactions yet' 
              : activeTab === 'mintQuote' 
                ? 'No pending quotes'
                : `No ${activeTab === 'in' ? 'incoming' : 'outgoing'} transactions`}
          </div>
        )}
      </div>
    </div>
  );
}; 