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
  } = useCashu();
  
  // Direct access to the Cashu store from SDK
  const { setMintUrl } = useCashuStore();
  
  // UI store for toast messages
  const { showToast } = useUIStore();

  const [currentBalance, setCurrentBalance] = useState<number>(balance);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState<boolean>(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState<boolean>(false);

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
      if (!activeMint) {
        showToast({
          message: 'No mint selected',
          type: 'error',
          description: 'Please add and select a mint first'
        });
        throw new Error('No mint selected');
      }
      
      // First check if the wallet is ready
      const readinessCheck = await checkWalletReadiness(activeMint);
      if (!readinessCheck.ready) {
        showToast({
          message: 'Wallet not ready',
          type: 'error',
          description: readinessCheck.error || 'Please check mint connection'
        });
        return null;
      }
      
      // Wallet is ready, proceed with invoice creation
      console.log(`Creating invoice for ${amount} sats using mint: ${activeMint}`);
      
      const invoiceResult = await createInvoice(activeMint, amount).catch(err => {
        console.error('SDK error creating invoice:', err);
        showToast({
          message: 'Failed to create invoice',
          type: 'error',
          description: err instanceof Error ? err.message : 'Unknown error occurred'
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
      
      console.log('Invoice created successfully');
      return invoiceResult;
    } catch (err) {
      console.error('Error creating invoice:', err);
      showToast({
        message: 'Invoice creation error',
        type: 'error',
        description: err instanceof Error ? err.message : 'Failed to create invoice'
      });
      return null;
    }
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
            <CashuTransactions transactions={transactions} />
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
