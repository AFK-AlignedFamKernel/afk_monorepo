import React from 'react';

interface CashuBalanceProps {
  balance: number;
  unit: string;
  mintAlias: string;
}

export const CashuBalance: React.FC<CashuBalanceProps> = ({
  balance,
  unit,
  mintAlias,
}) => {
  return (
    <div className="cashu-wallet__balance">
      <h3 className="cashu-wallet__balance-amount">{balance}</h3>
      <div className="cashu-wallet__balance-unit">{unit}</div>
      <div className="cashu-wallet__balance-mint">{mintAlias}</div>
    </div>
  );
}; 