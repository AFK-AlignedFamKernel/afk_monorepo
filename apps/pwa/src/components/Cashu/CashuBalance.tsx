import React from 'react';

interface CashuBalanceProps {
  balance: number;
  unit: string;
  mintAlias: string;
  onChangeMint: () => void;
}

export const CashuBalance: React.FC<CashuBalanceProps> = ({
  balance,
  unit,
  mintAlias,
  onChangeMint,
}) => {
  return (
    <div className="cashu-wallet__balance">
      <span className="cashu-wallet__balance-amount">{balance}</span>
      <span className="cashu-wallet__balance-unit">{unit}</span>
      <button 
        onClick={onChangeMint}
        className="cashu-wallet__balance-mint"
        title="Change mint"
      >
        {mintAlias} ▾
      </button>
    </div>
  );
}; 