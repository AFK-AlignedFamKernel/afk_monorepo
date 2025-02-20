import React from 'react';
import { useWalletStore } from '../hooks/useWalletStore';
import Account from '../tabs/account/Account';
import ExtraPixelsPanel from '../tabs/canvas/ExtraPixelsPanel';
import Factions from '../tabs/factions/Factions.js';
import NFTs from '../tabs/nfts/NFTs.js';
import Quests from '../tabs/quests/Quests.js';
import Voting from '../tabs/voting/Voting.js';

interface TabPanelProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  artPeaceContract: any;
  usernameContract: any;
  canvasNftContract: any;
  chain: any;
  colors: any[];
  colorPixel: (position: number[], color: number) => void;
  lastPlacedTime: number;
  basePixelTimer: number;
  setModal: (modal: any) => void;
  isTabletOrMobile: boolean;
  isPortrait: boolean;
  isMobile: boolean;
  isFooterSplit: boolean;
  footerExpanded: boolean;
  setFooterExpanded: (expanded: boolean) => void;
  currentDay: number;
  isLastDay: boolean;
  gameEnded: boolean;
  host: string;
  endTimestamp: number;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  activeTab,
  setActiveTab,
  artPeaceContract,
  usernameContract,
  canvasNftContract,
  chain,
  colors,
  colorPixel,
  lastPlacedTime,
  basePixelTimer,
  setModal,
  isTabletOrMobile,
  isPortrait,
  isMobile,
  isFooterSplit,
  footerExpanded,
  setFooterExpanded,
  currentDay,
  isLastDay,
  gameEnded,
  host,
  endTimestamp
}) => {
  const {
    connectWallet,
    startSession,
    account,
    wallet,
    address,
    queryAddress,
    setConnected,
    isSessionable,
    disconnectWallet,
    usingSessionKeys
  } = useWalletStore();

  const renderTab = () => {
    switch (activeTab) {
      case 'Canvas':
        return (
          <ExtraPixelsPanel
            colors={colors}
            colorPixel={colorPixel}
            lastPlacedTime={lastPlacedTime}
            basePixelTimer={basePixelTimer}
            setActiveTab={setActiveTab}
            setModal={setModal}
            isTabletOrMobile={isTabletOrMobile}
            isPortrait={isPortrait}
            isMobile={isMobile}
            isFooterSplit={isFooterSplit}
            footerExpanded={footerExpanded}
            setFooterExpanded={setFooterExpanded}
            currentDay={currentDay}
            isLastDay={isLastDay}
            gameEnded={gameEnded}
            host={host}
            endTimestamp={endTimestamp}
          />
        );
      case 'Account':
        return (
          <Account
            setActiveTab={setActiveTab}
            setModal={setModal}
            gameEnded={gameEnded}
          />
        );
      case 'Factions':
        return <Factions />;
      case 'Quests':
        return <Quests />;
      case 'Vote':
        return <Voting />;
      case 'NFTs':
        return (
          <NFTs
            address={address}
            queryAddress={queryAddress}
            account={account}
            wallet={wallet}
            canvasNftContract={canvasNftContract}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="tab-panel">
      {renderTab()}
    </div>
  );
}; 