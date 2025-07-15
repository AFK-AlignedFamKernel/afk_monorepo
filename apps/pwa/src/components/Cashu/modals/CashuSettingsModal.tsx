import React, { useState } from 'react';
import { Icon } from '../../small/icon-component';
import { useCashu, useCashuStore } from 'afk_nostr_sdk';
import { useUIStore } from '@/store/uiStore';
import styles from '@/styles/components/_cashu-wallet.module.scss';
interface MintData {
  url: string;
  alias: string;
  units: string[];
}

interface CashuSettingsModalProps {
  onClose: () => void;
  mints: MintData[];
  activeMint?: string;
  activeUnit?: string;
  onAddMint: (mintUrl: string, alias: string) => void;
  onChangeMint: (mintUrl: string) => void;
  onChangeUnit: (unit: string) => void;
}

export const CashuSettingsModal: React.FC<CashuSettingsModalProps> = ({
  onClose,
  mints,
  activeMint,
  activeUnit,
  onAddMint,
  onChangeMint,
  onChangeUnit,
}) => {
  const [showAddMint, setShowAddMint] = useState<boolean>(false);
  const [newMintUrl, setNewMintUrl] = useState<string>('');
  const [mintAlias, setMintAlias] = useState<string>('');

  const { showToast } = useUIStore()

  // const {seed} = useCashu()

  // Get setMintUrl from the SDK store
  const { setMintUrl, seed, mnemonic } = useCashuStore();

  const handleAddMint = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMintUrl && mintAlias) {
      onAddMint(newMintUrl, mintAlias);
      setNewMintUrl('');
      setMintAlias('');
      setShowAddMint(false);
    }
  };

  // Handle mint change with SDK store update
  const handleChangeMint = (url: string) => {
    // Update the mint URL in the SDK store
    setMintUrl(url);

    // Then call the parent component's handler
    onChangeMint(url);
  };

  return (
    <div className={styles['cashu-wallet__modal']}>
      <div className={styles['cashu-wallet__modal-content']}>
        <div className={styles['cashu-wallet__modal-content-header']}>
          <h3 className={styles['cashu-wallet__modal-content-header-title']}>Settings</h3>
          <button
            className={styles['cashu-wallet__modal-content-header-close']}
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="CloseIcon" size={24} />
          </button>
        </div>

        <div className={styles['cashu-wallet__modal-content-body']}>
          <h4>Mints</h4>
          {mints.length > 0 ? (
            <div className={styles['cashu-wallet__settings-mints']}>
              {mints.map((mint) => (
                <div
                  key={mint.url}
                  className={styles['cashu-wallet__settings-mint'] + ' ' + (mint.url === activeMint ? styles['cashu-wallet__settings-mint--active'] : '')}
                  onClick={() => handleChangeMint(mint.url)}
                  style={{
                    padding: '10px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    border: mint.url === activeMint ? '2px solid var(--primary-600)' : '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{mint.alias}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>{mint.url}</div>

                  {mint.url === activeMint && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Unit:</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {mint.units.map((unit) => (
                          <button
                            key={unit}
                            onClick={(e) => {
                              e.stopPropagation();
                              onChangeUnit(unit);
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              background: unit === activeUnit ? 'var(--primary-600)' : 'var(--card-bg)',
                              color: unit === activeUnit ? 'white' : 'var(--foreground)',
                              cursor: 'pointer',
                            }}
                          >
                            {unit}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div>No mints configured.</div>
          )}


          <div style={{ marginTop: '24px', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '12px' }}>Wallet Seed</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--foreground-muted)', marginBottom: '12px' }}>
              Your wallet seed is used to recover your wallet. Keep it safe and never share it with anyone.
            </p>

            {seed &&
              <button
                className={styles['cashu-wallet__button'] + ' ' + styles['cashu-wallet__button--secondary']}
                onClick={() => {
                  if (seed) {
                    navigator.clipboard.writeText(Buffer.from(seed).toString('hex'));
                    showToast({
                      message: 'Seed copied to clipboard',
                      type: 'success'
                    });
                  } else {
                    showToast({
                      message: 'No seed available',
                      type: 'error'
                    });
                  }
                }}
                style={{ width: '100%' }}
              >
                Copy Seed to Clipboard
              </button>
            }



            {mnemonic &&
              <>
                <p>Mnemonic</p>
                <button
                  className={styles['cashu-wallet__button'] + ' ' + styles['cashu-wallet__button--secondary']}
                  onClick={() => {
                    if (mnemonic) {
                      navigator.clipboard.writeText(mnemonic);
                      showToast({
                        message: 'Mnemonic copied to clipboard',
                        type: 'success'
                      });
                    } else {
                      showToast({
                        message: 'No mnemonic available',
                        type: 'error'
                      });
                    }
                  }}
                  style={{ width: '100%' }}
                >
                  Copy Mnemonic to Clipboard
                </button>
              </>

            }

          </div>

          {!showAddMint ? (
            <button
              className={styles['cashu-wallet__button'] + ' ' + styles['cashu-wallet__button--primary']}
              onClick={() => setShowAddMint(true)}
              style={{ marginTop: '16px' }}
            >
              Add Mint
            </button>
          ) : (
            <form onSubmit={handleAddMint} style={{ marginTop: '16px' }}>
              <div className={styles['cashu-wallet__form-group']}>
                <label className={styles['cashu-wallet__form-group-label']}>Mint URL</label>
                <input
                  type="text"
                  className={styles['cashu-wallet__form-group-input']}
                  value={newMintUrl}
                  onChange={(e) => setNewMintUrl(e.target.value)}
                  placeholder="https://mint.example.com"
                  required
                />
              </div>
              <div className={styles['cashu-wallet__form-group']}>
                <label className={styles['cashu-wallet__form-group-label']}>Mint Alias</label>
                <input
                  type="text"
                  className={styles['cashu-wallet__form-group-input']}
                  value={mintAlias}
                  onChange={(e) => setMintAlias(e.target.value)}
                  placeholder="My Mint"
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  className={styles['cashu-wallet__button'] + ' ' + styles['cashu-wallet__button--primary']}
                >
                  Add Mint
                </button>
                <button
                  type="button"
                  className={styles['cashu-wallet__button'] + ' ' + styles['cashu-wallet__button--secondary']}
                  onClick={() => setShowAddMint(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};