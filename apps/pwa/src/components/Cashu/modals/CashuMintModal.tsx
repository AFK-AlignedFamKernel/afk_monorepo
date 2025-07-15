import React, { useState } from 'react';
import { Icon } from '../../small/icon-component';
import { useUIStore } from '@/store/uiStore';
import { useCashuStore } from 'afk_nostr_sdk';
import styles from '@/styles/components/_cashu-wallet.module.scss';
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
  const [defaultMint, setDefaultMint] = useState<string | undefined>(activeMint ?? 'https://mint.cubabitcoin.org');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useUIStore();

  // Get setMintUrl from the SDK store
  const { setMintUrl } = useCashuStore();

  const handleSelectMint = (mintUrl: string) => {
    // Update the mint URL in the SDK store
    setMintUrl(mintUrl);

    // Then call the parent component's handler
    onChangeMint(mintUrl);
    onClose();
  };

  const handleAddMint = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMintUrl) {
      showToast({
        message: 'Validation Error',
        type: 'error',
        description: 'Mint URL is required'
      });
      return;
    }

    if (!newMintAlias) {
      showToast({
        message: 'Validation Error',
        type: 'error',
        description: 'Mint alias is required'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Add the new mint
      await onAddMint(newMintUrl, newMintAlias);

      // Also update the SDK store if this is the first mint
      if (mints.length === 0) {
        setMintUrl(newMintUrl);
      }

      // Reset form
      setNewMintUrl('');
      setNewMintAlias('');
      setShowAddForm(false);

      // Show success message
      showToast({
        message: 'Mint Added Successfully',
        type: 'success',
        description: `${newMintAlias} added to your wallet`
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add mint';
      showToast({
        message: 'Error Adding Mint',
        type: 'error',
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles['cashu-wallet__modal']}>
      <div className={styles['cashu-wallet__modal-content']}>
        <div className={styles['cashu-wallet__modal-content-header']}>
          <h3 className={styles['cashu-wallet__modal-content-header-title']}>Select Mint</h3>
          <button
            className={styles['cashu-wallet__modal-content-header-close']}
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="CloseIcon" size={24} />
          </button>
        </div>

        <div className={styles['cashu-wallet__modal-content-body']}>
          {/* Mint list */}
          {mints.length > 0 ? (
            <div className={styles['cashu-wallet__settings-mints']}>
              {mints.map((mint) => (
                <div
                  key={mint.url}
                  className={styles['cashu-wallet__settings-mint'] + ' ' + (mint.url === activeMint ? styles['cashu-wallet__settings-mint--active'] : '')}
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
            <div className={styles['cashu-wallet__add-mint-form']} style={{ marginTop: '16px' }}>
              <h4>Add New Mint</h4>


                <div className={styles['cashu-wallet__form-group']}>
                  <label className={styles['cashu-wallet__form-group-label']}> Add the Default Mint</label>
                <input
                  type="text"
                  className={styles['cashu-wallet__form-group-input']}
                  value={defaultMint}
                  onChange={(e) => setDefaultMint(e.target.value)}
                  placeholder="https://mint.example.com"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className={styles['cashu-wallet__button'] + ' ' + styles['cashu-wallet__button--secondary']}
                  onClick={() => {
                    setDefaultMint('https://mint.cubabitcoin.org');
                    setNewMintUrl('https://mint.cubabitcoin.org');
                    setNewMintAlias('Default Mint (cubabitcoin)');
                  }}
                >
                  Set Default Mint
                </button>
              </div>

              <form onSubmit={handleAddMint}>
                <div className={styles['cashu-wallet__form-group']}>
                  <label className={styles['cashu-wallet__form-group-label']}>Mint URL</label>
                  <input
                    type="text"
                    className={styles['cashu-wallet__form-group-input']}
                    value={newMintUrl}
                    onChange={(e) => setNewMintUrl(e.target.value)}
                    placeholder="https://mint.example.com"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className={styles['cashu-wallet__form-group']}>
                  <label className={styles['cashu-wallet__form-group-label']}>Mint Alias</label>
                  <input
                    type="text"
                    className={styles['cashu-wallet__form-group-input']}
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
                    className={styles['cashu-wallet__button'] + ' ' + styles['cashu-wallet__button--primary']}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Adding...' : 'Add Mint'}
                  </button>
                  <button
                    type="button"
                    className={styles['cashu-wallet__button'] + ' ' + styles['cashu-wallet__button--secondary']}
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
                className={styles['cashu-wallet__button'] + ' ' + styles['cashu-wallet__button--secondary']}
                onClick={() => setShowAddForm(true)}
              >
                Add New Mint
              </button>
              <button
                className={styles['cashu-wallet__button'] + ' ' + styles['cashu-wallet__button--primary']}
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
                className={styles['cashu-wallet__button'] + ' ' + styles['cashu-wallet__button--secondary']}
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