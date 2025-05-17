import React, { useState } from 'react';
import { Icon } from '../small/icon-component';
// import { useCashu } from '@/hooks/useCashu';

interface CashuNoMintProps {
  onAddMint: (mintUrl: string, alias: string) => void;
}

export const CashuNoMint: React.FC<CashuNoMintProps> = ({
  onAddMint,
}) => {
  const [mintUrl, setMintUrl] = useState<string>('');
  const [mintAlias, setMintAlias] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);

  const handleAddDefaultMint = () => {
    onAddMint('https://mint.cubabitcoin.org', 'Default Mint (cubabitcoin)');
  };

  const handleAddCustomMint = (e: React.FormEvent) => {
    e.preventDefault();
    if (mintUrl && mintAlias) {
      onAddMint(mintUrl, mintAlias);
      setMintUrl('');
      setMintAlias('');
      setShowForm(false);
    }
  };

  return (
    <div className="cashu-wallet__no-mint">
      <div className="cashu-wallet__no-mint-icon">
        <Icon name="WalletIcon" size={48} />
      </div>
      <h3 className="cashu-wallet__no-mint-title">No Mint Configured</h3>
      <p className="cashu-wallet__no-mint-description">
        Add a mint to start using your Cashu wallet
      </p>
      
      {!showForm ? (
        <>
          <button 
            className="cashu-wallet__button cashu-wallet__button--primary"
            onClick={handleAddDefaultMint}
          >
            Add Default Mint
          </button>
          <button 
            className="cashu-wallet__button cashu-wallet__button--secondary"
            onClick={() => setShowForm(true)}
            style={{ marginLeft: '8px' }}
          >
            Add Custom Mint
          </button>
        </>
      ) : (
        <form onSubmit={handleAddCustomMint}>
          <div className="cashu-wallet__form-group">
            <label className="cashu-wallet__form-group-label">Mint URL</label>
            <input
              type="text"
              className="cashu-wallet__form-group-input"
              value={mintUrl}
              onChange={(e) => setMintUrl(e.target.value)}
              placeholder="https://mint.example.com"
              required
            />
          </div>
          <div className="cashu-wallet__form-group">
            <label className="cashu-wallet__form-group-label">Mint Alias</label>
            <input
              type="text"
              className="cashu-wallet__form-group-input"
              value={mintAlias}
              onChange={(e) => setMintAlias(e.target.value)}
              placeholder="My Mint"
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="submit" 
              className="cashu-wallet__button cashu-wallet__button--primary"
            >
              Add Mint
            </button>
            <button 
              type="button"
              className="cashu-wallet__button cashu-wallet__button--secondary"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}; 