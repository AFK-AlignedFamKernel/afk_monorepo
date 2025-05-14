'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CashuWallet } from './CashuWallet';
import { CashuBalance } from './CashuBalance';
import { CashuActions } from './CashuActions';
import { CashuTransactions } from './CashuTransactions';
import { CashuNoMint } from './CashuNoMint';
import { CashuSendModal } from './modals/CashuSendModal';
import { CashuReceiveModal } from './modals/CashuReceiveModal';
import { CashuSettingsModal } from './modals/CashuSettingsModal';
import { CashuMintModal } from './modals/CashuMintModal';
import { CashuTransactionDetailsModal } from './modals/CashuTransactionDetailsModal';
import { useCashu } from '@/hooks/useCashu';
import { useCashuStore } from 'afk_nostr_sdk';
import { useUIStore } from '@/store/uiStore';
import { Transaction } from '@/utils/storage';
import { Icon } from '../small/icon-component';

export default function Cashu() {
  const {
    loading,
    error,
    mints,
    activeMint,
    activeUnit,
    balance,
    transactions,
    addMint,
    setActiveMint,
    setActiveUnit,
    getBalance,
    createInvoice,
    receiveToken,
    createSendToken,
    payLightningInvoice,
    checkWalletReadiness,
    checkInvoiceStatus,
    checkInvoicePaymentStatus
  } = useCashu();
  
  // Direct access to the Cashu store from SDK
  const { setMintUrl } = useCashuStore();
  
  // UI store for toast messages
  const { showToast, showModal } = useUIStore();

  const [currentBalance, setCurrentBalance] = useState<number>(balance);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState<boolean>(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState<boolean>(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [walletReady, setWalletReady] = useState<boolean>(false);

  // Initialize wallet connection on mount or when active mint changes
  useEffect(() => {
    async function initializeWallet() {
      if (!activeMint) return;
      
      try {
        setIsBalanceLoading(true);
        console.log('Initializing wallet connection to mint:', activeMint);
        
        // Check if wallet is ready
        const readinessCheck = await checkWalletReadiness(activeMint);
        setWalletReady(readinessCheck.ready);
        
        if (readinessCheck.ready) {
          console.log('Wallet is ready for operations');
          // Update balance
          const currentBalance = await getBalance();
          setCurrentBalance(currentBalance);
        } else {
          console.error('Wallet initialization failed:', readinessCheck.error);
          showToast({
            message: 'Wallet Connection Failed',
            type: 'error',
            description: 'Could not establish wallet connection. Please check your mint settings.'
          });
        }
      } catch (err) {
        console.error('Error initializing wallet:', err);
        setWalletReady(false);
        showToast({
          message: 'Wallet Initialization Error',
          type: 'error',
          description: err instanceof Error ? err.message : 'Unknown error during wallet initialization'
        });
      } finally {
        setIsBalanceLoading(false);
      }
    }
    
    initializeWallet();
  }, [activeMint, checkWalletReadiness, getBalance, showToast]);

  // Fetch current balance
  useEffect(() => {
    if (activeMint && activeUnit) {
      setIsBalanceLoading(true);
      getBalance()
        .then(balance => {
          setCurrentBalance(balance);
        })
        .catch(err => {
          console.error('Error fetching balance:', err);
        })
        .finally(() => {
          setIsBalanceLoading(false);
        });
    }
  }, [activeMint, activeUnit, getBalance]);

  // Update balance from wallet data
  useEffect(() => {
    setCurrentBalance(balance);
  }, [balance]);

  // Handle creating a lightning invoice
  const handleCreateInvoice = async (amount: number) => {
    if (!amount || amount <= 0) {
      console.error('Invalid amount for invoice creation');
      showToast({
        message: 'Invalid amount',
        type: 'error',
        description: 'Please enter a valid amount greater than 0'
      });
      return null;
    }
    
    try {
      // Verify wallet is ready before proceeding
      if (!walletReady) {
        console.log('Checking wallet readiness before invoice creation');
        const readinessCheck = await checkWalletReadiness(activeMint);
        if (!readinessCheck.ready) {
          showToast({
            message: 'Wallet not ready',
            type: 'error',
            description: 'Please check mint connection and try again'
          });
          return null;
        }
        setWalletReady(true);
      }
      
      if (!activeMint) {
        showToast({
          message: 'No mint selected',
          type: 'error',
          description: 'Please add and select a mint first'
        });
        return null;
      }
      
      console.log(`Creating invoice for ${amount} sats using mint: ${activeMint}`);
      
      // Single attempt with proper error handling
      const invoiceResult = await createInvoice(activeMint, amount).catch(err => {
        console.error('Error creating invoice:', err);
        showToast({
          message: 'Invoice creation failed',
          type: 'error',
          description: err instanceof Error ? err.message : 'Could not generate Lightning invoice'
        });
        return null;
      });
      
      if (!invoiceResult || !invoiceResult.invoice) {
        console.error('No valid invoice returned from createInvoice');
        showToast({
          message: 'Invoice generation failed',
          type: 'error',
          description: 'Could not generate a valid Lightning invoice'
        });
        return null;
      }
      
      // Log the payment hash information for debugging
      console.log('Invoice payment hash:', invoiceResult.paymentHash);
      console.log('Full invoice result:', invoiceResult);
      
      // Success
      showToast({
        message: 'Invoice created',
        type: 'success',
        description: `Share this invoice to receive ${amount} sats`
      });
      
      return invoiceResult;
    } catch (err) {
      console.error('Invoice creation error:', err);
      
      showToast({
        message: 'Invoice generation error',
        type: 'error',
        description: err instanceof Error ? err.message : 'Failed to create invoice'
      });
      
      return null;
    }
  };

  // Handle modal opening/closing
  const handleOpenSendModal = () => setIsSendModalOpen(true);
  const handleCloseSendModal = () => setIsSendModalOpen(false);
  const handleOpenReceiveModal = () => setIsReceiveModalOpen(true);
  const handleCloseReceiveModal = () => setIsReceiveModalOpen(false);
  const handleOpenSettingsModal = () => setIsSettingsModalOpen(true);
  const handleCloseSettingsModal = () => setIsSettingsModalOpen(false);
  const handleOpenMintModal = () => setIsMintModalOpen(true);
  const handleCloseMintModal = () => setIsMintModalOpen(false);
  
  // Handle adding a new mint
  const handleAddMint = async (mintUrl: string, alias: string) => {
    if (!mintUrl) return;
    
    try {
      await addMint(mintUrl, alias);
      handleCloseMintModal();
      
      showToast({
        message: 'Mint added successfully',
        type: 'success',
        description: alias || mintUrl
      });
      
      await setActiveMint(mintUrl);
    } catch (err) {
      console.error('Error adding mint:', err);
      showToast({
        message: 'Failed to add mint',
        type: 'error',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };
  
  // Handle changing a mint
  const handleChangeMint = async (mintUrl: string) => {
    if (!mintUrl) return;
    
    try {
      setIsBalanceLoading(true);
      await setActiveMint(mintUrl);
      
      // Also verify that we can connect to it
      const readinessCheck = await checkWalletReadiness(mintUrl);
      setWalletReady(readinessCheck.ready);
      
      if (readinessCheck.ready) {
        showToast({
          message: 'Mint selected',
          type: 'success',
          description: mints.find(mint => mint.url === mintUrl)?.alias || mintUrl
        });
      } else {
        showToast({
          message: 'Warning: Mint connection issue',
          type: 'warning',
          description: 'Selected mint may not be functioning correctly'
        });
      }
    } catch (err) {
      console.error('Error changing mint:', err);
      showToast({
        message: 'Error changing mint',
        type: 'error',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setIsBalanceLoading(false);
    }
  };
  
  // Continue with remaining handlers...
  const handleSendToken = async (amount: number) => {
    // Verify wallet is ready first
    if (!walletReady) {
      const readinessCheck = await checkWalletReadiness(activeMint);
      if (!readinessCheck.ready) {
        showToast({
          message: 'Wallet not ready',
          type: 'error',
          description: 'Please check mint connection and try again'
        });
        return null;
      }
      setWalletReady(true);
    }
    
    try {
      const token = await createSendToken(amount);
      handleCloseSendModal();
      showToast({
        message: 'Token created',
        type: 'success',
        description: `for ${amount} ${activeUnit || 'sats'}`
      });
      return token;
    } catch (err) {
      console.error('Error creating send token:', err);
      showToast({
        message: 'Failed to create token',
        type: 'error',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
      return null;
    }
  };
  
  // Handle receiving token
  const handleReceiveToken = async (token: string) => {
    try {
      await receiveToken(token);
      handleCloseReceiveModal();
      showToast({
        message: 'Token received',
        type: 'success'
      });
      return true;
    } catch (err) {
      console.error('Error receiving token:', err);
      showToast({
        message: 'Failed to receive token',
        type: 'error',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
      return false;
    }
  };
  
  // Handle paying invoice
  const handlePayInvoice = async (invoice: string) => {
    // Verify wallet is ready first
    if (!walletReady) {
      const readinessCheck = await checkWalletReadiness(activeMint);
      if (!readinessCheck.ready) {
        showToast({
          message: 'Wallet not ready',
          type: 'error',
          description: 'Please check mint connection and try again'
        });
        return null;
      }
      setWalletReady(true);
    }
    
    try {
      await payLightningInvoice(invoice);
      handleCloseSendModal();
      showToast({
        message: 'Invoice paid',
        type: 'success'
      });
      return true;
    } catch (err) {
      console.error('Error paying invoice:', err);
      showToast({
        message: 'Failed to pay invoice',
        type: 'error',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
      return false;
    }
  };
  
  // Handle checking payment status
  const handleCheckPayment = async (transaction: Transaction) => {
    if (!transaction) {
      console.error('Cannot check payment: no transaction provided');
      return;
    }
    
    // Don't attempt to check fallback payment hashes
    if (transaction.paymentHash?.startsWith('fallback-')) {
      showToast({
        message: 'Cannot verify payment',
        type: 'warning',
        description: 'This transaction uses a fallback ID which cannot be verified with the mint'
      });
      return { paid: false, error: 'Cannot verify fallback payment hash' };
    }
    
    setIsCheckingPayment(true);
    setSelectedTransaction(transaction);
    
    try {
      // Verify wallet is ready first
      if (!walletReady) {
        const readinessCheck = await checkWalletReadiness(activeMint);
        if (!readinessCheck.ready) {
          throw new Error('Wallet not ready - please check mint connection');
        }
        setWalletReady(true);
      }

      console.log('transaction', transaction);
      
      // Check if this is a Lightning invoice with a payment hash
      if (transaction.paymentHash || transaction?.invoice && transaction?.invoiceType === 'lightning') {
        // Use the proper checkInvoicePaymentStatus function that handles all details
        const result = await checkInvoicePaymentStatus(transaction);
        console.log('result', result);
        
        if (result.paid) {
          showToast({
            message: 'Payment confirmed',
            type: 'success',
            description: `${transaction.amount} ${activeUnit || 'sats'}`
          });
        } else if (result.error) {
          showToast({
            message: 'Error checking payment',
            type: 'error',
            description: result.error
          });
        } else {
          showToast({
            message: 'Payment not detected',
            type: 'warning',
            description: 'This invoice has not been paid yet'
          });
        }
        
        return result;
      } 
      // For other types of quotes (tokens etc.)
      else if (transaction.token || transaction.invoiceType) {
        // Simulate checking the quote status
        // In a real implementation, this would call an API endpoint
        setTimeout(() => {
          showToast({
            message: 'Quote status checked',
            type: 'info',
            description: 'Quote is still pending'
          });
        }, 500);
        
        return { checked: true, status: 'pending' };
      }
      else {
        showToast({
          message: 'Cannot check status',
          type: 'error',
          description: 'This transaction type does not support status checking'
        });
      }
    } catch (err) {
      console.error('Error checking payment/quote:', err);
      showToast({
        message: 'Error checking status',
        type: 'error',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
      return null;
    } finally {
      setIsCheckingPayment(false);
    }
  };
  
  // Show transaction details
  const handleShowTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  return (
    <>
      <CashuWallet onOpenSettings={handleOpenSettingsModal}>
        {walletReady && !loading && mints.length > 0 && activeMint ? (
          <>
            <CashuBalance 
              balance={isBalanceLoading ? 0 : currentBalance} 
              unit={activeUnit || 'sat'} 
              mintAlias={mints.find(mint => mint.url === activeMint)?.alias || activeMint}
              onChangeMint={handleOpenMintModal}
            />
            <CashuActions
              onSend={handleOpenSendModal}
              onReceive={handleOpenReceiveModal}
            />
            <CashuTransactions 
              transactions={transactions} 
              onCheckPayment={handleCheckPayment}
              onTransactionClick={handleShowTransactionDetails}
            />
          </>
        ) : loading ? (
          <div className="cashu-wallet__loading">Loading wallet...</div>
        ) : !activeMint || mints.length === 0 ? (
          <CashuNoMint onAddMint={handleOpenMintModal} />
        ) : !walletReady && activeMint ? (
          <div className="cashu-wallet__error">
            <h3>Wallet Connection Issue</h3>
            <p>Cannot connect to mint: {activeMint}</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="cashu-wallet__button cashu-wallet__button--primary" 
                onClick={async () => {
                  setIsBalanceLoading(true);
                  try {
                    const readinessCheck = await checkWalletReadiness(activeMint);
                    setWalletReady(readinessCheck.ready);
                    if (readinessCheck.ready) {
                      showToast({
                        message: 'Wallet Connected',
                        type: 'success'
                      });
                    } else {
                      showToast({
                        message: 'Connection Failed',
                        type: 'error',
                        description: readinessCheck.error
                      });
                    }
                  } catch (err) {
                    console.error('Reconnection error:', err);
                  } finally {
                    setIsBalanceLoading(false);
                  }
                }}
              >
                {isBalanceLoading ? 'Connecting...' : 'Reconnect'}
              </button>
              <button 
                className="cashu-wallet__button cashu-wallet__button--secondary" 
                onClick={handleOpenSettingsModal}
              >
                Settings
              </button>
            </div>
          </div>
        ) : (
          <div className="cashu-wallet__error">
            <h3>Error loading wallet</h3>
            <p>{error}</p>
            <button 
              className="cashu-wallet__button cashu-wallet__button--primary" 
              onClick={handleOpenSettingsModal}
            >
              Check Settings
            </button>
          </div>
        )}
      </CashuWallet>
      
      {/* Modals */}
      {isReceiveModalOpen && (
        <CashuReceiveModal
          onClose={handleCloseReceiveModal}
          mint={activeMint || ''}
          unit={activeUnit || 'sat'}
          onReceiveToken={handleReceiveToken}
          onCreateInvoice={handleCreateInvoice}
        />
      )}

      {isSendModalOpen && (
        <CashuSendModal
          onClose={handleCloseSendModal}
          balance={currentBalance}
          unit={activeUnit || 'sat'}
          onSendToken={handleSendToken}
          onPayInvoice={handlePayInvoice}
        />
      )}
      
      {isSettingsModalOpen && (
        <CashuSettingsModal
          onClose={handleCloseSettingsModal}
          mints={mints}
          activeMint={activeMint}
          activeUnit={activeUnit}
          onAddMint={handleOpenMintModal}
          onChangeMint={handleChangeMint}
          onChangeUnit={setActiveUnit}
        />
      )}
      
      {isMintModalOpen && (
        <CashuMintModal
          onClose={handleCloseMintModal}
          mints={mints}
          activeMint={activeMint}
          onChangeMint={handleChangeMint}
          onOpenSettings={handleOpenSettingsModal}
          onAddMint={handleAddMint}
        />
      )}
      
      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <CashuTransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onCheckPayment={isCheckingPayment ? null : handleCheckPayment}
          isCheckingPayment={isCheckingPayment}
        />
      )}
    </>
  );
}
