import { NDKEvent } from '@nostr-dev-kit/ndk';
import { createContext, useCallback, useMemo, useRef, useState } from 'react';

import { TipSuccessModal, TipSuccessModalProps } from '../modules/TipSuccessModal';
import { LoginNostrModule } from '../modules/Login';
import {Modalize} from '../components';

export type LoginModalContextType = {
  show: () => void;
  hide: () => void;

  showSuccess: (props: TipSuccessModalProps) => void;
  hideSuccess: () => void;
};

export const LoginModalContext = createContext<LoginModalContextType | null>(null);
export type LoginModal = Modalize;

export const LoginModalProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const loginModalRef = useRef<LoginModal>(null);

  const [successModal, setSuccessModal] = useState<TipSuccessModalProps | null>(null);

  const show = useCallback(() => {
    loginModalRef.current?.open();
  }, []);

  const hide = useCallback(() => {
    loginModalRef.current?.close();
  }, []);

  const showSuccess = useCallback((props: TipSuccessModalProps) => {
    setSuccessModal(props);
  }, []);

  const hideSuccess = useCallback(() => {
    setSuccessModal(null);
  }, []);

  const context = useMemo(
    () => ({ show, hide, showSuccess, hideSuccess }),
    [show, hide, showSuccess, hideSuccess],
  );

  return (
    <LoginModalContext.Provider value={context}>
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
        ref={loginModalRef}
        adjustToContentHeight
        
        >
        <LoginNostrModule />
      </Modalize>

      {successModal && <TipSuccessModal {...successModal} />}
    </LoginModalContext.Provider>
  );
};
