import React, { useState } from 'react';
import { Icon } from '../small/icon-component';
import { Transaction } from '@/utils/storage';

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
  const [activeTab, setActiveTab] = useState<TabType>('all');
  
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
  
  // Get appropriate button text based on transaction type
  const getCheckButtonText = (transaction: Transaction) => {
    if (transaction.invoiceType === 'lightning') {
      return 'Check Payment';
    }
    return 'Check Quote';
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
            <div 
              key={transaction.id} 
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