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
  } = useCashu();

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
    try {
      await createSendToken(amount);
      handleCloseSendModal();
      // Update balance after sending
      const updatedBalance = await getBalance();
      setCurrentBalance(updatedBalance);
    } catch (err) {
      console.error('Error sending token:', err);
      // Error handling will be done by the hook
    }
  };

  // Handle paying a lightning invoice
  const handlePayInvoice = async (invoice: string) => {
    try {
      await payLightningInvoice(invoice);
      handleCloseSendModal();
      // Update balance after paying
      const updatedBalance = await getBalance();
      setCurrentBalance(updatedBalance);
    } catch (err) {
      console.error('Error paying invoice:', err);
      // Error handling will be done by the hook
    }
  };

  // Handle receiving a token
  const handleReceiveToken = async (token: string) => {
    try {
      await receiveToken(token);
      handleCloseReceiveModal();
      // Update balance after receiving
      const updatedBalance = await getBalance();
      setCurrentBalance(updatedBalance);
    } catch (err) {
      console.error('Error receiving token:', err);
      // Error handling will be done by the hook
    }
  };

  // Helper function to ensure mint is connected before operations
  const ensureMintConnected = async (mintUrl: string) => {
    if (!mintUrl) {
      throw new Error('No mint selected');
    }
    
    // Don't try to auto-connect here as it's causing re-renders
    // Just return the mint URL for the calling function to use
    return mintUrl;
  };

  // Handle creating a lightning invoice
  const handleCreateInvoice = async (amount: number) => {
    try {
      // Simply call createInvoice with the amount and active mint
      return await createInvoice(activeMint, amount);
    } catch (err) {
      console.error('Error creating invoice:', err);
      return null;
    }
  };

  // Handle adding a mint
  const handleAddMint = async (mintUrl: string, alias: string) => {
    try {
      await addMint(mintUrl, alias);
      // Update balance after adding mint
      const updatedBalance = await getBalance();
      setCurrentBalance(updatedBalance);
    } catch (err) {
      console.error('Error adding mint:', err);
    }
  };

  // Handle changing active mint
  const handleChangeMint = async (mintUrl: string) => {
    try {
      setIsBalanceLoading(true);
      const success = await setActiveMint(mintUrl);
      
      if (success) {
        // Update balance after changing mint
        const updatedBalance = await getBalance();
        setCurrentBalance(updatedBalance);
      }
    } catch (err) {
      console.error('Error changing mint:', err);
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
