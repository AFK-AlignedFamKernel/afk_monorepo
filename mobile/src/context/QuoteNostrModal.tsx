import {NDKEvent} from '@nostr-dev-kit/ndk';
import {createContext, useCallback, useMemo, useRef, useState} from 'react';

import {TipModal} from '../modules/TipModal';
import {TipSuccessModal, TipSuccessModalProps} from '../modules/TipSuccessModal';
import { QuoteNostrModal } from '../modules/QuoteNote';

export type QuoteNostrModalContextType = {
  show: (event: NDKEvent) => void;
  hide: () => void;

  showSuccess: (props: TipSuccessModalProps) => void;
  hideSuccess: () => void;
};

export const QuoteNostrModalContext = createContext<QuoteNostrModalContextType | null>(null);

export const QuoteNostrModalProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const tipModalRef = useRef<TipModal>(null);

  const [event, setEvent] = useState<NDKEvent | undefined>();
  const [successModal, setSuccessModal] = useState<TipSuccessModalProps | null>(null);

  const show = useCallback((event: NDKEvent) => {
    setEvent(event);
    tipModalRef.current?.open();
  }, []);

  const hide = useCallback(() => {
    tipModalRef.current?.close();
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
    <QuoteNostrModalContext.Provider value={context}>
      {children}

      <QuoteNostrModal
        event={event}
        show={show}
        hide={hide}
        showSuccess={showSuccess}
        hideSuccess={hideSuccess}
        ref={tipModalRef}
      />

      {successModal && <TipSuccessModal {...successModal} />}
    </QuoteNostrModalContext.Provider>
  );
};
