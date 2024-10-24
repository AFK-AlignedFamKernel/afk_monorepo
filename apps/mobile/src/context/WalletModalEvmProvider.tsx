import {createContext, useCallback, useContext, useRef} from 'react';
import {useAccount, useDisconnect} from 'wagmi';

import {Modalize} from '../components';
import WalletEvmModal, {ConnectedWalletModal} from '../modules/WalletModal/walletEvmModal';

// Create a context for the wallet
export const WalletEVMModalContext = createContext<{
  showEvmWallet: () => void;
  hideEvmWallet: () => void;
  isConnected: boolean;
  address: string | undefined;
  disconnect: () => void;
} | null>(null);

export const WalletModalEVMProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const modalizeRef = useRef<Modalize | any>(null);
  const {isConnected, address} = useAccount();

  const {disconnect} = useDisconnect();

  const showEvmWallet = useCallback(() => {
    modalizeRef?.current.open();
  }, []);

  const hideEvmWallet = useCallback(() => {
    modalizeRef?.current.close();
  }, [modalizeRef]);

  return (
    <WalletEVMModalContext.Provider
      value={{
        showEvmWallet,
        hideEvmWallet,
        isConnected,
        address,
        disconnect,
      }}
    >
      {children}

      <Modalize
        modalStyle={{
          maxWidth: 500,
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          marginBottom: 20,
          borderRadius: 20,
        }}
        ref={modalizeRef}
        adjustToContentHeight
      >
        <WalletEvmModal hide={hideEvmWallet} />
        <ConnectedWalletModal />
      </Modalize>
    </WalletEVMModalContext.Provider>
  );
};

export const useEvmWallet = () => {
  const context = useContext(WalletEVMModalContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }

  return context;
};
