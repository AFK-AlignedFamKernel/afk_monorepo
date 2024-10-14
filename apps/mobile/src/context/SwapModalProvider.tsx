import {createContext, useCallback, useContext, useRef} from 'react';

import {Modalize} from '../components';
import TokenSwapView from '../modules/Swap';

// Create a context for Swap
export const SwapModalContext = createContext<{
  showSwap: () => void;
  hideSwap: () => void;
} | null>(null);

export const SwapModalEVMProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const modalizeRef = useRef<Modalize | any>(null);

  const showSwap = useCallback(() => {
    modalizeRef?.current.open();
  }, []);

  const hideSwap = useCallback(() => {
    modalizeRef?.current.close();
  }, [modalizeRef]);

  return (
    <SwapModalContext.Provider
      value={{
        showSwap,
        hideSwap,
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
        <TokenSwapView showHeader />
      </Modalize>
    </SwapModalContext.Provider>
  );
};

export const useSwapModal = () => {
  const context = useContext(SwapModalContext);
  if (!context) {
    throw new Error('useSwap must be used within a SwapProvider');
  }

  return context;
};
