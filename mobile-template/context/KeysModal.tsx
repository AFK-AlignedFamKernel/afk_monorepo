import {NDKEvent} from '@nostr-dev-kit/ndk';
import {createContext, useCallback, useMemo, useRef, useState} from 'react';

import {KeyModal, KeyModalAction} from '../modules/KeyModal';
import {TipSuccessModal, TipSuccessModalProps} from '../modules/TipSuccessModal';

export type KeyModalContextType = {
  show: (event: NDKEvent, starknetAddress?: string, action?: KeyModalAction) => void;
  hide: () => void;

  showSuccess: (props: TipSuccessModalProps) => void;
  hideSuccess: () => void;
};

export const KeyModalContext = createContext<KeyModalContextType | null>(null);

export const KeyModalProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const keyModalRef = useRef<KeyModal>(null);

  const [event, setEvent] = useState<NDKEvent | undefined>();
  const [starknetAddress, setStarknetAddress] = useState<string | undefined>();
  const [action, setAction] = useState<KeyModalAction | undefined>();
  const [successModal, setSuccessModal] = useState<TipSuccessModalProps | null>(null);

  const show = useCallback((event: NDKEvent, starknetAddress?: string, action?: KeyModalAction) => {
    setEvent(event);
    setStarknetAddress(starknetAddress);
    keyModalRef.current?.open();
  }, []);

  const hide = useCallback(() => {
    keyModalRef.current?.close();
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
    <KeyModalContext.Provider value={context}>
      {children}
      <KeyModal
        starknetAddress={starknetAddress}
        event={event}
        show={show}
        hide={hide}
        showSuccess={showSuccess}
        hideSuccess={hideSuccess}
        ref={keyModalRef}
      />

      {successModal && <TipSuccessModal {...successModal} />}
    </KeyModalContext.Provider>
  );
};
