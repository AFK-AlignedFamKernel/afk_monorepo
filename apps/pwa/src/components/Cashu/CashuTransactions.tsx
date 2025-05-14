import React from 'react';
import { Icon } from '../small/icon-component';

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  date: string;
}

interface CashuTransactionsProps {
  transactions: Transaction[];
}

export const CashuTransactions: React.FC<CashuTransactionsProps> = ({
  transactions,
}) => {
  return (
    <div className="cashu-wallet__transactions">
      <div className="cashu-wallet__transactions-header">
        <h3 className="cashu-wallet__transactions-header-title">Recent Transactions</h3>
        <a href="#" className="cashu-wallet__transactions-header-view-all">View All</a>
      </div>
      
      <div className="cashu-wallet__transactions-list">
        {transactions.length > 0 ? (
          transactions.map((transaction) => (
            <div key={transaction.id} className="cashu-wallet__transactions-list-item">
              <div className="cashu-wallet__transactions-list-item-icon">
                <Icon 
                  name={transaction.type === 'sent' ? 'SendIcon' : 'ReceiveIcon'} 
                  size={16} 
                />
              </div>
              <div className="cashu-wallet__transactions-list-item-details">
                <div className="cashu-wallet__transactions-list-item-details-title">
                  {transaction.type === 'sent' ? 'Sent' : 'Received'}
                </div>
                <div className="cashu-wallet__transactions-list-item-details-date">
                  {transaction.date}
                </div>
              </div>
              <div className={`cashu-wallet__transactions-list-item-amount cashu-wallet__transactions-list-item-amount--${transaction.type}`}>
                {transaction.type === 'sent' ? '-' : '+'}{transaction.amount}
              </div>
            </div>
          ))
        ) : (
          <div className="cashu-wallet__transactions-empty">
            No transactions yet
          </div>
        )}
      </div>
    </div>
  );
}; 