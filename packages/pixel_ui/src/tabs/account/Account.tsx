import React from 'react';
import { constants } from 'starknet';
import './Account.css';
import BasicTab from '../BasicTab.js';
import '../../utils/Styles.css';
import { useWalletStore } from 'afk_react_sdk';
import BeggarRankImg from '../../resources/ranks/Beggar.png';
import OwlRankImg from '../../resources/ranks/Owl.png';
import CrownRankImg from '../../resources/ranks/Crown.png';
import WolfRankImg from '../../resources/ranks/Wolf.png';
import ArgentIcon from '../../resources/icons/Argent.png';
import BraavosIcon from '../../resources/icons/Braavos.png';

interface AccountProps {
  setActiveTab: (tab: string) => void;
  setModal: (modal: any) => void;
  gameEnded: boolean;
}

const Account = ({ setActiveTab, setModal, gameEnded }: AccountProps) => {
  const {
    // Core wallet state
    connected,
    address,
    queryAddress,
    isSessionable,
    usingSessionKeys,
    isLoading,
    error,

    // Account metadata
    username,
    pixelCount,
    accountRank,

    // Actions
    connectWallet,
    disconnectWallet,
    startSession,
    updateAccountMetadata
  } = useWalletStore();

  const connectorLogo = (name: string) => {
    switch (name) {
      case 'Argent':
      case 'ArgentX':
      case 'argentX':
      case 'Argent X':
        return ArgentIcon;
      case 'Braavos':
      case 'braavos':
        return BraavosIcon;
      default:
        return null;
    }
  };

  const connectorName = (name: string) => {
    switch (name) {
      case 'Argent':
      case 'ArgentX':
      case 'argentX':
      case 'Argent X':
        return 'Argent X';
      case 'Braavos':
      case 'braavos':
        return 'Braavos';
      default:
        return name;
    }
  };

  const addressShort = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  // Get rank image based on account rank
  const getRankImage = () => {
    switch (accountRank) {
      case 'Alpha Wolf':
        return WolfRankImg;
      case 'Degen Artist':
        return CrownRankImg;
      case 'Pixel Wizard':
        return OwlRankImg;
      default:
        return BeggarRankImg;
    }
  };

  // Get rank background based on pixel count
  const getRankBackground = () => {
    if (pixelCount >= 500) {
      return {
        background: `linear-gradient(45deg, hsl(${Date.now() % 360}, 100%, 50%), hsl(${(Date.now() + 1000) % 360}, 100%, 50%))`
      };
    } else if (pixelCount >= 250) {
      return {
        background: 'linear-gradient(45deg, rgba(255, 215, 0, 0.9), rgba(255, 215, 0, 0.6))'
      };
    } else if (pixelCount >= 50) {
      return {
        background: 'linear-gradient(45deg, rgba(192, 192, 200, 0.9), rgba(192, 192, 200, 0.6))'
      };
    }
    return {
      background: 'linear-gradient(45deg, rgba(205, 127, 50, 0.9), rgba(205, 127, 50, 0.6))'
    };
  };

  return (
    <BasicTab
      title='Account'
      queryAddress={queryAddress}
      setActiveTab={setActiveTab}
    >
      {!connected ? (
        <div className="Account__login-container">
          <div className="Account__login">
            <div
              className="Text__medium Button__primary Account__login__button"
              onClick={() => connectWallet()}
            >
              Starknet Login
            </div>
          </div>
          <div className="Account__wallet__noconnectors">
            <p className="Text__small">
              Please install a Starknet wallet extension
            </p>
            <div
              className="Text__medium Button__primary Account__walletlogin__button"
              onClick={() =>
                window.open(
                  'https://www.argent.xyz/argent-x/',
                  '_blank',
                  'noreferrer'
                )
              }
            >
              Argent X
            </div>
            <div
              className="Text__medium Button__primary Account__walletlogin__button"
              onClick={() =>
                window.open(
                  'https://braavos.app/download-braavos-wallet/',
                  '_blank',
                  'noreferrer'
                )
              }
            >
              Braavos
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="Text__medium Heading__sub Account__subheader">Info</h2>
          
          <div className="Account__item Account__item__user">
            <p className="Text__small Account__item__label">Username</p>
            <p className="Text__small Account__item__text">{username || 'Not set'}</p>
          </div>

          <div className="Account__item Account__item__separator">
            <p className="Text__medium Account__item__label">Rank</p>
            <div className="Text__small Account__rank">
              <div className="Account__rank__outer" style={getRankBackground()}>
                <div className="Account__rank__inner">
                  <img
                    className="Account__rank__img"
                    src={getRankImage()}
                    alt="rank"
                  />
                  <p className="Text__small Account__rank__text">
                    {accountRank}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="Account__item">
            <p className="Text__small Account__item__label">Address</p>
            <p className="Text__small Account__item__text">{addressShort}</p>
          </div>

          <div className="Account__item">
            <p className="Text__small Account__item__label">Network</p>
            <p className="Text__small Account__item__text">
              {process.env.REACT_APP_CHAIN_ID === constants.NetworkName.SN_MAIN
                ? 'Mainnet'
                : 'Sepolia'}
            </p>
          </div>

          <h2 className="Text__medium Heading__sub Account__subheader">
            Stats
          </h2>
          
          <div className="Account__item">
            <p className="Text__small Account__item__label">Pixels placed</p>
            <p className="Text__small Account__item__text">{pixelCount}</p>
          </div>

          <div className="Account__disconnect__button__separator"></div>
          
          <div className="Account__footer">
            <div className="Account__kudos">
              {!usingSessionKeys && isSessionable ? (
                <p className="Text__small Account__kudos__label">
                  Tired of approving each pixel? Start a session!
                </p>
              ) : (
                <p className="Text__small Account__kudos__label">
                  Session active
                </p>
              )}
            </div>
            <div>
              {!usingSessionKeys && isSessionable && (
                <div
                  className="Text__small Button__primary"
                  style={{ marginBottom: '0.3rem' }}
                  onClick={() => startSession()}
                >
                  Start session
                </div>
              )}
              <div
                className="Text__small Button__primary Account__disconnect__button"
                onClick={() => disconnectWallet()}
              >
                Logout
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="Account__error">
          <p className="Text__small">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="Account__loading">
          <p className="Text__small">Loading...</p>
        </div>
      )}
    </BasicTab>
  );
};

export default Account;