'use client';

import React, { useState, useEffect } from 'react';
import { CashuWallet } from './CashuWallet';
import { CashuBalance } from './CashuBalance';
import { CashuActions } from './CashuActions';
import { CashuTransactions } from './CashuTransactions';
import { CashuNoMint } from './CashuNoMint';
import { CashuSendModal } from './modals/CashuSendModal';
import { CashuReceiveModal } from './modals/CashuReceiveModal';
import { CashuSettingsModal } from './modals/CashuSettingsModal';
import { CashuMintModal } from './modals/CashuMintModal';
import { useCashu } from '@/hooks/useCashu';
import { useCashuStore } from 'afk_nostr_sdk';
import { useUIStore } from '@/store/uiStore';
import { Transaction } from '@/utils/storage';

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
    checkInvoiceStatus
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
    const fetchBalance = async () => {
      if (activeMint && activeUnit) {
        setIsBalanceLoading(true);
        try {
          const currentBalance = await getBalance();
          setCurrentBalance(currentBalance);
        } catch (err) {
          console.error('Error fetching balance:', err);
          // Don't crash the UI, use default value
          setCurrentBalance(0);
        } finally {
          setIsBalanceLoading(false);
        }
      }
    };

    fetchBalance();
  }, [activeMint, activeUnit, getBalance]);

  // Update balance from wallet data
  useEffect(() => {
    setCurrentBalance(balance);
  }, [balance]);

  // Open send modal
  const handleOpenSendModal = () => {
    setIsSendModalOpen(true);
  };

  // Close send modal
  const handleCloseSendModal = () => {
    setIsSendModalOpen(false);
  };

  // Open receive modal
  const handleOpenReceiveModal = () => {
    setIsReceiveModalOpen(true);
  };

  // Close receive modal
  const handleCloseReceiveModal = () => {
    setIsReceiveModalOpen(false);
  };

  // Open settings modal
  const handleOpenSettingsModal = () => {
    setIsSettingsModalOpen(true);
  };

  // Close settings modal
  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  // Open mint selector modal
  const handleOpenMintModal = () => {
    setIsMintModalOpen(true);
  };

  // Close mint selector modal
  const handleCloseMintModal = () => {
    setIsMintModalOpen(false);
  };

  // Handle sending a token
  const handleSendToken = async (amount: number) => {
    if (!amount || amount <= 0) {
      console.error('Invalid amount for sending token');
      return;
    }
    
    try {
      setIsBalanceLoading(true);
      await createSendToken(amount);
      handleCloseSendModal();
      
      // Update balance after sending
      try {
        const updatedBalance = await getBalance();
        setCurrentBalance(updatedBalance);
      } catch (balanceErr) {
        console.error('Error updating balance after send:', balanceErr);
      }
    } catch (err) {
      console.error('Error sending token:', err);
      // Error handling will be done by the hook
    } finally {
      setIsBalanceLoading(false);
    }
  };

  // Handle paying a lightning invoice
  const handlePayInvoice = async (invoice: string) => {
    if (!invoice || typeof invoice !== 'string') {
      console.error('Invalid invoice format');
      return;
    }
    
    try {
      setIsBalanceLoading(true);
      await payLightningInvoice(invoice);
      handleCloseSendModal();
      
      // Update balance after paying
      try {
        const updatedBalance = await getBalance();
        setCurrentBalance(updatedBalance);
      } catch (balanceErr) {
        console.error('Error updating balance after payment:', balanceErr);
      }
    } catch (err) {
      console.error('Error paying invoice:', err);
      // Error handling will be done by the hook
    } finally {
      setIsBalanceLoading(false);
    }
  };

  // Handle receiving a token
  const handleReceiveToken = async (token: string) => {
    if (!token || typeof token !== 'string') {
      console.error('Invalid token format');
      return;
    }
    
    try {
      setIsBalanceLoading(true);
      await receiveToken(token);
      handleCloseReceiveModal();
      
      // Update balance after receiving
      try {
        const updatedBalance = await getBalance();
        setCurrentBalance(updatedBalance);
      } catch (balanceErr) {
        console.error('Error updating balance after receive:', balanceErr);
      }
    } catch (err) {
      console.error('Error receiving token:', err);
      // Error handling will be done by the hook
    } finally {
      setIsBalanceLoading(false);
    }
  };

  // Helper function to ensure mint is connected before operations
  const ensureMintConnected = async (mintUrl: string) => {
    if (!mintUrl) {
      throw new Error('No mint selected');
    }
    
    // Return the mint URL for the calling function to use
    return mintUrl;
  };

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
      
      // Success
      showToast({
        message: 'Invoice created',
        type: 'success',
        description: 'Lightning invoice generated successfully'
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

  // Handle checking transaction payment status
  const handleCheckPayment = async (transaction: Transaction) => {
    if (isCheckingPayment) return;
    
    try {
      setIsCheckingPayment(true);
      
      showToast({
        message: 'Checking payment',
        type: 'info',
        description: 'Verifying payment status...'
      });
      
      const result = await checkInvoiceStatus(transaction.mintUrl || '', transaction.paymentHash || '');
      
      if (result.paid) {
        showToast({
          message: 'Payment confirmed',
          type: 'success',
          description: `Received ${transaction.amount} sats`
        });
        
        // Update balance - no need to fetch, the hook has already updated it
        setCurrentBalance(prev => prev + transaction.amount);
      } else {
        showToast({
          message: 'Payment pending',
          type: 'info',
          description: 'Payment has not been received yet'
        });
      }
    } catch (err) {
      console.error('Error checking payment:', err);
      showToast({
        message: 'Payment check failed',
        type: 'error',
        description: err instanceof Error ? err.message : 'Failed to verify payment'
      });
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Show more details about a transaction, especially for MintQuotes
  const handleShowTransactionDetails = (transaction: Transaction) => {
    if (!transaction) return;
    
    let title = transaction.type === 'sent' ? 'Sent' : 'Received';
    
    if (transaction.invoiceType === 'lightning') {
      title += ' (Lightning)';
    } else if (transaction.token) {
      title += ' (Ecash)';
    }
    
    // Format the date to be more user-friendly
    const date = new Date(transaction.date);
    const formattedDate = date.toLocaleString();
    
    const MintQuoteDetails = () => (
      <div className="cashu-wallet__transaction-details">
        <div className="cashu-wallet__transaction-details-header">
          <h3>{title}</h3>
          <div className="cashu-wallet__transaction-details-amount">
            {transaction.type === 'sent' ? '-' : '+'}{transaction.amount} sats
          </div>
        </div>
        
        <div className="cashu-wallet__transaction-details-info">
          <div className="cashu-wallet__transaction-details-row">
            <div className="cashu-wallet__transaction-details-label">Date:</div>
            <div className="cashu-wallet__transaction-details-value">{formattedDate}</div>
          </div>
          
          {transaction.mintUrl && (
            <div className="cashu-wallet__transaction-details-row">
              <div className="cashu-wallet__transaction-details-label">Mint:</div>
              <div className="cashu-wallet__transaction-details-value">{
                mints.find(mint => mint.url === transaction.mintUrl)?.alias || transaction.mintUrl
              }</div>
            </div>
          )}
          
          {transaction.memo && (
            <div className="cashu-wallet__transaction-details-row">
              <div className="cashu-wallet__transaction-details-label">Memo:</div>
              <div className="cashu-wallet__transaction-details-value">{transaction.memo}</div>
            </div>
          )}
          
          {transaction.status && (
            <div className="cashu-wallet__transaction-details-row">
              <div className="cashu-wallet__transaction-details-label">Status:</div>
              <div className="cashu-wallet__transaction-details-value">
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </div>
            </div>
          )}
          
          {transaction.invoiceType === 'lightning' && transaction.paymentHash && (
            <div className="cashu-wallet__transaction-details-row">
              <div className="cashu-wallet__transaction-details-label">Payment Hash:</div>
              <div className="cashu-wallet__transaction-details-value text-xs">
                {transaction.paymentHash.length > 15 
                  ? `${transaction.paymentHash.substring(0, 15)}...` 
                  : transaction.paymentHash}
              </div>
            </div>
          )}
        </div>
        
        {transaction.type === 'received' && 
         transaction.invoiceType === 'lightning' && 
         transaction.status !== 'paid' && 
         transaction.paymentHash && (
          <div className="cashu-wallet__transaction-details-actions">
            <button 
              className="cashu-wallet__button cashu-wallet__button--primary"
              onClick={() => {
                handleCheckPayment(transaction);
                showModal(null); // Close the modal after checking
              }}
              disabled={isCheckingPayment}
            >
              {isCheckingPayment ? 'Checking...' : 'Check Payment Status'}
            </button>
          </div>
        )}
      </div>
    );
    
    showModal(<MintQuoteDetails />);
  };

  // Handle adding a mint
  const handleAddMint = async (mintUrl: string, alias: string) => {
    if (!mintUrl || !alias) {
      console.error('Missing required parameters for adding mint');
      return;
    }
    
    try {
      setIsBalanceLoading(true);
      await addMint(mintUrl, alias);
      
      // Update balance after adding mint
      try {
        const updatedBalance = await getBalance();
        setCurrentBalance(updatedBalance);
      } catch (balanceErr) {
        console.error('Error updating balance after adding mint:', balanceErr);
      }
    } catch (err) {
      console.error('Error adding mint:', err);
      // Don't crash UI on mint add error
    } finally {
      setIsBalanceLoading(false);
    }
  };

  // Handle changing active mint
  const handleChangeMint = async (mintUrl: string) => {
    if (!mintUrl) {
      console.error('Invalid mint URL');
      return;
    }
    
    try {
      setIsBalanceLoading(true);
      
      // Update the mint URL in the SDK store directly
      setMintUrl(mintUrl);
      
      // Then update in our local storage
      const success = await setActiveMint(mintUrl);
      
      if (success) {
        // Update balance after changing mint
        try {
          const updatedBalance = await getBalance();
          setCurrentBalance(updatedBalance);
        } catch (balanceErr) {
          console.error('Error updating balance after mint change:', balanceErr);
        }
      }
    } catch (err) {
      console.error('Error changing mint:', err);
      // Don't crash UI on mint change error
    } finally {
      setIsBalanceLoading(false);
    }
  };

  if (loading) {
    return <div>Loading wallet...</div>;
  }

  // if (error) {
  //   return <div>Error loading wallet: {error}</div>;
  // }

  return (
    <>
      <CashuWallet onOpenSettings={handleOpenSettingsModal}>
        {mints.length > 0 && activeMint ? (
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
        ) : (
          <CashuNoMint onAddMint={handleAddMint} />
        )}
      </CashuWallet>

      {/* Modals */}
      {isSendModalOpen && (
        <CashuSendModal
          onClose={handleCloseSendModal}
          balance={currentBalance}
          unit={activeUnit || 'sat'}
          onSendToken={handleSendToken}
          onPayInvoice={handlePayInvoice}
        />
      )}

      {isReceiveModalOpen && (
        <CashuReceiveModal
          onClose={handleCloseReceiveModal}
          mint={activeMint || ''}
          unit={activeUnit || 'sat'}
          onReceiveToken={handleReceiveToken}
          onCreateInvoice={handleCreateInvoice}
        />
      )}

      {isSettingsModalOpen && (
        <CashuSettingsModal
          onClose={handleCloseSettingsModal}
          mints={mints}
          activeMint={activeMint}
          activeUnit={activeUnit}
          onAddMint={handleAddMint}
          onChangeMint={setActiveMint}
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
    </>
  );
}
