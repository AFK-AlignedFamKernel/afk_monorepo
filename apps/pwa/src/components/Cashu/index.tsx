'use client';

import React, { useState } from 'react';
import { CashuWallet } from './CashuWallet';
import { CashuBalance } from './CashuBalance';
import { CashuActions } from './CashuActions';
import { CashuTransactions } from './CashuTransactions';
import { CashuNoMint } from './CashuNoMint';
import { CashuSendModal } from './modals/CashuSendModal';
import { CashuReceiveModal } from './modals/CashuReceiveModal';
import { CashuSettingsModal } from './modals/CashuSettingsModal';

export default function Cashu() {
  const [mints, setMints] = useState<any[]>([]);
  const [activeMint, setActiveMint] = useState<string | undefined>();
  const [activeUnit, setActiveUnit] = useState<string | undefined>();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isSendModalOpen, setIsSendModalOpen] = useState<boolean>(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

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

  // Handle adding a new mint
  const handleAddMint = (mintUrl: string, alias: string) => {
    const newMint = {
      url: mintUrl,
      alias: alias,
      units: ['sat'],
    };
    
    setMints([...mints, newMint]);
    setActiveMint(mintUrl);
    setActiveUnit('sat');
    handleCloseSettingsModal();
  };

  return (
    <>
      <CashuWallet onOpenSettings={handleOpenSettingsModal}>
        {mints.length > 0 && activeMint ? (
          <>
            <CashuBalance 
              balance={balance} 
              unit={activeUnit || 'sat'} 
              mintAlias={mints.find(mint => mint.url === activeMint)?.alias || activeMint}
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
          balance={balance}
          unit={activeUnit || 'sat'}
        />
      )}

      {isReceiveModalOpen && (
        <CashuReceiveModal
          onClose={handleCloseReceiveModal}
          mint={activeMint || ''}
          unit={activeUnit || 'sat'}
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
    </>
  );
}
