import {NDKEvent} from '@nostr-dev-kit/ndk';
import {createContext, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Modalize} from 'react-native-modalize';

import {KeyModalAction} from '../modules/KeyModal';
import {TipSuccessModal, TipSuccessModalProps} from '../modules/TipSuccessModal';
import {TokenCreateModal} from '../modules/TokenCreatedModal';
import {useAccount} from '@starknet-react/core';

export type TokenCreateModal = Modalize;

export type TokenCreatedContextType = {
  show: (event?: NDKEvent, starknetAddress?: string) => void;
  hide?: () => void;

  showSuccess?: (props: TipSuccessModalProps) => void;
  hideSuccess?: () => void;
};

export const TokenModalContext = createContext<TokenCreatedContextType | null>(null);

export const TokenCreateModalProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const account = useAccount();
  const tokenModalRef = useRef<TokenCreateModal>(null);

  const [event, setEvent] = useState<NDKEvent | undefined>();
  const [starknetAddress, setStarknetAddress] = useState<string | undefined>();
  const [action, setAction] = useState<KeyModalAction | undefined>();
  const [successModal, setSuccessModal] = useState<TipSuccessModalProps | null>(null);

  useEffect(() => {
    if (account?.address && !starknetAddress) {
      setStarknetAddress(account?.address);
    }
    if (!account?.address) {
      setStarknetAddress(undefined);
    }
  }, [account, account?.address]);
  const show = useCallback(
    (event?: NDKEvent, starknetAddress?: string, action?: KeyModalAction) => {
      setEvent(event);
      setStarknetAddress(starknetAddress);
      tokenModalRef.current?.open();
    },
    [],
  );

  const hide = useCallback(() => {
    tokenModalRef.current?.close();
    setEvent(undefined);
  }, []);

  const showSuccess = useCallback((props: TipSuccessModalProps) => {
    setSuccessModal(props);
  }, []);

  const hideSuccess = useCallback(() => {
    setSuccessModal(null);
  }, []);

  const context = useMemo(
    () => ({show, hide, showSuccess, hideSuccess}),
    [show, hide, showSuccess, hideSuccess],
  );
  return (
    <TokenModalContext.Provider value={context}>
      {children}
      <TokenCreateModal
        starknetAddress={starknetAddress}
        event={event}
        show={show}
        hide={hide}
        showSuccess={showSuccess}
        hideSuccess={hideSuccess}
        ref={tokenModalRef}
      />

      {successModal && <TipSuccessModal {...successModal} />}
    </TokenModalContext.Provider>
  );
};
