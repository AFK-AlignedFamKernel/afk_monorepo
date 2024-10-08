import {NDKEvent} from '@nostr-dev-kit/ndk';
import {createContext, useCallback, useMemo, useRef, useState} from 'react';

import {TipModalStarknet} from '../modules/TipModal/starknet';
import {TipSuccessModal, TipSuccessModalProps} from '../modules/TipSuccessModal';

export type TipModalContextType = {
  show: (event: NDKEvent) => void;
  hide: () => void;

  showSuccess: (props: TipSuccessModalProps) => void;
  hideSuccess: () => void;
};

export const TipModalStarknetContext = createContext<TipModalContextType | null>(null);

export const TipModalStarknetProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const tipModalRef = useRef<TipModalStarknet>(null);

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
    <TipModalStarknetContext.Provider value={context}>
      {children}

      <TipModalStarknet
        event={event}
        show={show}
        hide={hide}
        showSuccess={showSuccess}
        hideSuccess={hideSuccess}
        ref={tipModalRef}
      />

      {successModal && <TipSuccessModal {...successModal} />}
    </TipModalStarknetContext.Provider>
  );
};
