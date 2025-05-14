import React, { useState } from 'react';
import { Icon } from '../../small/icon-component';

interface MintData {
  url: string;
  alias: string;
  units: string[];
}

interface CashuMintModalProps {
  onClose: () => void;
  mints: MintData[];
  activeMint?: string;
  onChangeMint: (mintUrl: string) => void;
  onOpenSettings: () => void;
  onAddMint: (mintUrl: string, alias: string) => void;
}

export const CashuMintModal: React.FC<CashuMintModalProps> = ({
  onClose,
  mints,
  activeMint,
  onChangeMint,
  onOpenSettings,
  onAddMint,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMintUrl, setNewMintUrl] = useState('');
  const [newMintAlias, setNewMintAlias] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectMint = (mintUrl: string) => {
    onChangeMint(mintUrl);
    onClose();
  };

  const handleAddMint = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMintUrl) {
      setError('Mint URL is required');
      return;
    }
    
    if (!newMintAlias) {
      setError('Mint alias is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Add the new mint
      await onAddMint(newMintUrl, newMintAlias);
      
      // Reset form
      setNewMintUrl('');
      setNewMintAlias('');
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add mint');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cashu-wallet__modal">
      <div className="cashu-wallet__modal-content">
        <div className="cashu-wallet__modal-content-header">
          <h3 className="cashu-wallet__modal-content-header-title">Select Mint</h3>
          <button
            className="cashu-wallet__modal-content-header-close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="CloseIcon" size={24} />
          </button>
        </div>
        
        <div className="cashu-wallet__modal-content-body">
          {/* Mint list */}
          {mints.length > 0 ? (
            <div className="cashu-wallet__settings-mints">
              {mints.map((mint) => (
                <div 
                  key={mint.url} 
                  className={`cashu-wallet__settings-mint ${mint.url === activeMint ? 'cashu-wallet__settings-mint--active' : ''}`}
                  onClick={() => handleSelectMint(mint.url)}
                  style={{
                    padding: '10px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    border: mint.url === activeMint ? '2px solid var(--primary-600)' : '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{mint.alias}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>{mint.url}</div>
                  </div>
                  
                  {mint.url === activeMint && (
                    <div style={{ 
                      backgroundColor: 'var(--primary-600)', 
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon name="CheckIcon" size={16} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div>No mints configured.</div>
          )}
          
          {/* Add mint form */}
          {showAddForm ? (
            <div className="cashu-wallet__add-mint-form" style={{ marginTop: '16px' }}>
              <h4>Add New Mint</h4>
              {error && (
                <div className="cashu-wallet__form-error">
                  {error}
                </div>
              )}
              <form onSubmit={handleAddMint}>
                <div className="cashu-wallet__form-group">
                  <label className="cashu-wallet__form-group-label">Mint URL</label>
                  <input
                    type="text"
                    className="cashu-wallet__form-group-input"
                    value={newMintUrl}
                    onChange={(e) => setNewMintUrl(e.target.value)}
                    placeholder="https://mint.example.com"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="cashu-wallet__form-group">
                  <label className="cashu-wallet__form-group-label">Mint Alias</label>
                  <input
                    type="text"
                    className="cashu-wallet__form-group-input"
                    value={newMintAlias}
                    onChange={(e) => setNewMintAlias(e.target.value)}
                    placeholder="My Mint"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    className="cashu-wallet__button cashu-wallet__button--primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Adding...' : 'Add Mint'}
                  </button>
                  <button
                    type="button"
                    className="cashu-wallet__button cashu-wallet__button--secondary"
                    onClick={() => setShowAddForm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <button
                className="cashu-wallet__button cashu-wallet__button--secondary"
                onClick={() => setShowAddForm(true)}
              >
                Add New Mint
              </button>
              <button
                className="cashu-wallet__button cashu-wallet__button--primary"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
              >
                Manage All Mints
              </button>
            </div>
          )}
          
          {/* Bottom buttons (when not showing add form) */}
          {!showAddForm && (
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="cashu-wallet__button cashu-wallet__button--secondary"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 